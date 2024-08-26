import { Request, Response } from "express";
import User from "../models/user.model";
import Course from "../models/course.model";
import {updateUserGrades} from "./grade.service";

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


    } catch (error) {

    }
}

