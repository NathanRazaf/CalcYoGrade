import {Request, Response} from "express";
import User from "../models/user.model";
import Course from "../models/course.model";

export const addCourse = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch the user
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).send({ message: 'User not found' });
            return;
        }

        // Check if that semester is already added in the user's academic path (lowercase comparison)
        const semesterIndex = user.academicPath.findIndex((semester) => semester.semester.toLowerCase() === req.body.semester.toLowerCase());

        if (req.body.courseId) {
            const course = await Course.findById(req.body.courseId);
            if (!course) {
                res.status(404).send({ message: 'Course not found' });
                return;
            }

            if (!req.body.semester) {
                res.status(400).send({ message: 'Semester is required.' });
                return;
            }

            if (semesterIndex !== -1) {
                // Check if the course is already added in that semester
                const courseIndex = user.academicPath[semesterIndex].courses.findIndex((course) => course.courseId === req.body.courseId);
                if (courseIndex !== -1) {
                    res.status(400).send({ message: 'Course already added in this semester.' });
                    return;
                }

                user.academicPath[semesterIndex].courses.push({
                    courseId: req.body.courseId,
                    // the course evaluation ID will be added later
                    assignments: [],
                    projectedFinalGrade: 0
                });

                // Increment the number of students taking the course
                course.numStudents += 1;
                await course.save();
            } else {
                // Add the new semester and the course
                user.academicPath.push({
                    semester: req.body.semester,
                    courses: [
                        {
                            courseId: req.body.courseId,
                            // the course evaluation ID will be added later
                            assignments: [],
                            projectedFinalGrade: 0
                        }
                    ]
                });

                // Increment the number of students taking the course
                course.numStudents += 1;
                await course.save();
            }
            await user.save();
            res.status(200).send({ message: 'Course added successfully.', user });
            return;
        }

        // If the course ID is not provided, create a new course
        const course = new Course({
            schoolName: req.body.schoolName,
            courseCode: req.body.courseCode,
            courseName: req.body.courseName,
            weight: req.body.weight,
            maxPoints: req.body.maxPoints
        });
        await course.save();

        // Add the course to the user's academic path
        if (!req.body.semester) {
            res.status(400).send({ message: 'Semester is required.' });
            return;
        }

        if (semesterIndex !== -1) {
            // Add the course to the existing semester
            user.academicPath[semesterIndex].courses.push({
                courseId: course.id,
                // the course evaluation ID will be added later
                assignments: [],
                projectedFinalGrade: 0
            });
        } else {
            // Add the new semester and the course
            user.academicPath.push({
                semester: req.body.semester,
                courses: [
                    {
                        courseId: course.id,
                        // the course evaluation ID will be added later
                        assignments: [],
                        projectedFinalGrade: 0
                    }
                ]
            });
        }
        await user.save();

        res.status(200).send({ message: 'Course added successfully.', user });
    } catch (error) {
        res.status(500).send({ message: 'Internal server error' });
        return;
    }
};



