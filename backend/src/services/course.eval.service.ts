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

        // Get the course evaluation
        const courseEval = await CourseEval.findById(req.body.courseEvalId);
        if (!courseEval) {
            res.status(404).send({ message: 'Course evaluation not found.' });
            return;
        }

        // The course should be in the user's academic path
        const semesterIndex = user.academicPath.findIndex((semester: any) => semester.semester === courseEval.semester);
        if (semesterIndex === -1) {
            res.status(404).send({ message: 'Semester not found in the user\'s academic path.' });
            return;
        }
        const semester = user.academicPath[semesterIndex];
        const courseIndex = semester.courses.findIndex((course: any) => course.courseId === courseEval.courseId);
        if (courseIndex === -1) {
            res.status(404).send({ message: 'Course not found in the user\'s academic path.' });
            return;
        }
        const course = semester.courses[courseIndex];

        // Populate the course's assignments with the course evaluation's assignments
        for (let i = 0; i < courseEval.assignments.length; i++) {
            // use user.set() to forcefully tell Mongoose this is a new entry
            user.set(`academicPath.${semesterIndex}.courses.${courseIndex}.assignments`, [
                ...course.assignments,
                {
                    name: courseEval.assignments[i].name,
                    weight: courseEval.assignments[i].weight,
                    grade: 0
                }
            ]);
        }

        // Increment the usedBy of the course evaluation
        courseEval.usedBy += 1;
        await courseEval.save();

        // Save the user
        await user.save();
        res.status(200).send({ message: 'Course evaluation set up successfully.', user });
        return;
    } catch (error) {
        res.status(500).send({ message: 'Internal server error' });
        return;
    }
};

export const createCourseEval = async (req: Request, res: Response): Promise<void> => {
    try {
        // Destructure request body
        const { courseId, semester, assignments } = req.body;

        // Check if there are course evaluations that already exist with the same courseId and semester
        const existingCourseEvals = await CourseEval.find({ courseId, semester });
        if (existingCourseEvals.length > 0) {
            // Loop through each existing course evaluation to check for matching assignment weights
            for (let evaluation of existingCourseEvals) {
                // Compare the weights of the assignments in the existing eval and the new one
                const existingWeights = evaluation.assignments.map((assignment: any) => assignment.weight);
                const newWeights = assignments.map((assignment: any) => assignment.weight);

                // Sort the arrays to ensure correct comparison
                existingWeights.sort();
                newWeights.sort();

                // Check if the weights match
                if (JSON.stringify(existingWeights) === JSON.stringify(newWeights)) {
                    res.status(400).send({ message: 'Cannot create a course evaluation with the same weights as an already existing course evaluation.' });
                    return;
                }
            }
        }

        // If no matching weights are found, proceed with creating a new course evaluation
        const courseEval = new CourseEval({
            name: req.body.name,
            courseId,
            semester,
            assignments
        });

        await courseEval.save();
        res.status(201).send({ message: 'Course evaluation created successfully.', courseEval });
        return;
    } catch (error) {
        res.status(500).send({ message: 'Internal server error', error });
        return;
    }
};