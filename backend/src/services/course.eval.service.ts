import {Request, Response} from "express";
import User from "../models/user.model";
import CourseEval from "../models/courseEval.model";

export const setCourseEval = async (req: Request, res: Response): Promise<void> => {
    try {
        // Fetch the user
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).send({ message: 'User not found' });
            return;
        }

        if (!req.body.courseId) {
            res.status(400).send({ message: 'Course ID is required.' });
            return;
        }

        if (!req.body.semester) {
            res.status(400).send({ message: 'Semester is required.' });
            return;
        }

        // The course should be in the user's academic path
        const semesterIndex = user.academicPath.findIndex((semester) => semester.semester.toLowerCase() === req.body.semester.toLowerCase());
        const course = user.academicPath[semesterIndex].courses.find((course) => course.courseId === req.body.courseId);

        if (!course) {
            res.status(404).send({ message: 'Course not found in the specified semester.' });
            return;
        }

        // If a course evaluation ID has already been set, unset it and decrement the usedBy of the course evaluation
        if (course.courseEvalId) {
            const prevCourseEval = await CourseEval.findById(course.courseEvalId);
            if (prevCourseEval) {
                prevCourseEval.usedBy -= 1;
                await prevCourseEval.save();
            }
        }

        // If we're setting up an already existing course evaluation, set it up and increment the usedBy
        if (req.body.courseEvalId) {
            const courseEval = await CourseEval.findById(req.body.courseEvalId);
            if (!courseEval) {
                res.status(404).send({ message: 'Course evaluation not found.' });
                return;
            }

            courseEval.usedBy += 1;
            await courseEval.save();

            course.courseEvalId = courseEval.id;
            await user.save();
            res.status(200).send({ message: 'Course evaluation set up successfully.', user });
            return;
        }

        // If we're creating a new course evaluation, create it and set it up
        const courseEval = new CourseEval({
            courseId: req.body.courseId,
            semester: req.body.semester,
            assignments: req.body.assignments
        });
        await courseEval.save();

        course.courseEvalId = courseEval.id;
        await user.save();
        res.status(200).send({ message: 'Course evaluation set up successfully.', user });
        return;
    } catch (error) {
        res.status(500).send({ message: 'Internal server error' });
        return;
    }
};