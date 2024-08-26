import { Request, Response } from "express";
import User from "../../models/user.model";
import Course from "../../models/course.model";
import {updateUserGrades} from "../grades/grade.service";

export const addCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch the user
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).send({ message: 'User not found.' });
            return;
        }

        // Ensure semester is provided
        if (!req.body.semester) {
            res.status(400).send({ message: 'Semester is required.' });
            return;
        }

        // Find the semester or create it if it doesn't exist
        let semesterCourses = user.academicPath.find(sem => sem.semester === req.body.semester);
        if (!semesterCourses) {
            // @ts-ignore
            // Push the new semester using set() to forcefully tell Mongoose this is a new entry
            user.set('academicPath', [
                ...user.academicPath,
                { semester: req.body.semester, courses: [] }
            ]);
        }

        await user.save();

        // Find the semester again after adding it
        semesterCourses = user.academicPath.find(sem => sem.semester === req.body.semester);

        // If the courseId is provided, check if it already exists
        if (req.body.courseId) {
            // Check if the course already exists in the semester
            if (semesterCourses!.courses.some(course => course.courseId === req.body.courseId)) {
                res.status(400).send({ message: 'Course already exists in this semester.' });
                return;
            }

            // Find the course by its ID
            const course = await Course.findById(req.body.courseId);
            if (!course) {
                res.status(404).send({ message: 'Course not found.' });
                return;
            }

            // Increment the number of students taking the course
            course.numStudents += 1;
            await course.save();

            // Add the course to the semester's courses
            user.set(`academicPath.${user.academicPath.indexOf(semesterCourses!)}.courses`, [
                ...semesterCourses!.courses,
                { courseId: req.body.courseId, assignments: [] }
            ]);

            // Mark and save the user with the new course
            user.markModified('academicPath');
            await user.save();

            res.status(200).send({ message: 'Course added successfully.', user });
            return;
        }

        // Create a new course if no courseId is provided
        const newCourse = new Course({
            schoolName: req.body.schoolName,
            courseCode: req.body.courseCode,
            courseName: req.body.courseName,
            weight: req.body.weight,
            maxPoints: req.body.maxPoints,
            numStudents: 1,
            allGrades: []
        });
        await newCourse.save();

        // Add the new course to the semester's courses
        user.set(`academicPath.${user.academicPath.indexOf(semesterCourses!)}.courses`, [
            ...semesterCourses!.courses,
            { courseId: newCourse.id, assignments: [] }
        ]);

        await user.save();

        res.status(200).send({ message: 'Course added successfully.', user });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
};

export const removeCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch the user
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).send({ message: 'User not found.' });
            return;
        }

        // Ensure semester is provided
        if (!req.body.semester) {
            res.status(400).send({ message: 'Semester is required.' });
            return;
        }

        // Find the semester
        const semesterIndex = user.academicPath.findIndex(sem => sem.semester === req.body.semester);
        if (semesterIndex === -1) {
            res.status(404).send({ message: 'Semester not found.' });
            return;
        }
        const semesterCourses = user.academicPath[semesterIndex];
        // Find the course within the semester
        const courseIndex = semesterCourses.courses.findIndex(course => course.courseId === req.body.courseId);
        if (courseIndex === -1) {
            res.status(404).send({ message: 'Course not found in this semester.' });
            return;
        }

        // Remove the course from the semester
        user.set(`academicPath.${semesterIndex}.courses`, [
            ...semesterCourses.courses.slice(0, courseIndex),
            ...semesterCourses.courses.slice(courseIndex + 1)
        ]);

        await user.save();
        await updateUserGrades(user.id);

        // Decrement the number of students taking the course
        const course = await Course.findById(req.body.courseId);
        if (!course) {
            res.status(404).send({ message: 'Course not found.' });
            return;
        }
        course.numStudents -= 1;

        // Find the index of the semester
        const courseSemesterIndex = course.allGrades.findIndex(grade => grade.semester === req.body.semester);

        if (courseSemesterIndex !== -1) {
            const gradesMap = course.allGrades[courseSemesterIndex].grades;

            // Check if the user exists in the map and delete their grade
            if (gradesMap!.has(user.id)) {
                gradesMap!.delete(user.id);
            }

            // Use set() to ensure the change is registered by Mongoose
            course.set(`allGrades.${courseSemesterIndex}.grades`, gradesMap);
        }

        await course.save();

        res.status(200).send({ message: 'Course removed successfully.', user });
    } catch (error) {
        console.error('Error removing course:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
}

export const searchCourses = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = req.query.query;

        if (!query) {
            const courses = await Course.find();
            res.status(200).send({ courses });
            return;
        }

        // Step 1: Perform a MongoDB text search
        let textResults = await Course.find(
            { $text: { $search: query as string } },
            { score: { $meta: 'textScore' } }
        ).sort({ score: { $meta: 'textScore' } });

        // Step 2: If text search yields too few results, fallback to regex
        if (textResults.length < 5) {
            const regexResults = await Course.find({
                $or: [
                    { courseCode: { $regex: new RegExp(query as string, 'i') } },
                    { courseName: { $regex: new RegExp(query as string, 'i') } },
                    { schoolName: { $regex: new RegExp(query as string, 'i') } }
                ]
            });

            // Merge results and filter out duplicates based on `_id`
            const mergedResults = [...textResults, ...regexResults];
            textResults = mergedResults.filter((value, index, self) =>
                index === self.findIndex((v) => v._id.toString() === value._id.toString())
            );
        }

        res.status(200).send({ courses: textResults });
    } catch (error) {
        console.error('Error searching courses:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
};

export const getCourseStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const courseId = req.params.courseId;

        // Find the course by its ID
        const course = await Course.findById(courseId);
        if (!course) {
            res.status(404).send({ message: 'Course not found.' });
            return;
        }

        // Calculate total grade, number of students, and collect all grades
        let totalGrade = 0;
        let totalStudents = 0;
        let allGrades: number[] = [];

        for (let i = 0; i < course.allGrades.length; i++) {
            const gradesMap = course.allGrades[i].grades;
            for (const grade of gradesMap!.values()) {
                allGrades.push(grade);
                totalGrade += grade;
                totalStudents += 1;
            }
        }

        // Calculate the average grade
        const averageGrade = totalStudents > 0 ? totalGrade / totalStudents : 0;

        // Calculate the median grade
        allGrades.sort((a, b) => a - b);
        let medianGrade = 0;
        if (totalStudents > 0) {
            const mid = Math.floor(totalStudents / 2);
            medianGrade = totalStudents % 2 === 0 ? (allGrades[mid - 1] + allGrades[mid]) / 2 : allGrades[mid];
        }

        // Calculate grade distribution (using maxPoints from the course)
        const gradeDistribution = getGradeDistribution(allGrades, course.maxPoints);

        res.status(200).send({ averageGrade, medianGrade, gradeDistribution });
    } catch (error) {
        console.error('Error getting course stats:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
}

// Helper function to calculate grade distribution
function getGradeDistribution(grades: number[], maxPoints: number): number[] {
    const range = maxPoints / 5;
    const distribution = [0, 0, 0, 0, 0];

    grades.forEach(grade => {
        if (grade >= 0 && grade < range) {
            distribution[0]++;
        } else if (grade >= range && grade < 2 * range) {
            distribution[1]++;
        } else if (grade >= 2 * range && grade < 3 * range) {
            distribution[2]++;
        } else if (grade >= 3 * range && grade < 4 * range) {
            distribution[3]++;
        } else if (grade >= 4 * range && grade <= maxPoints) {
            distribution[4]++;
        }
    });

    return distribution;
}
