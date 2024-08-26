import User from '../../models/user.model';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { Request, Response } from 'express';
import Course from "../../models/course.model";

dotenv.config();

// Service function to register a new user
export const registerUser = async (req: Request, res: Response) : Promise<void> => {
    try {
        const { username, password } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            res.status(400).send({ message: 'User with this username already exists.' });
            return;
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const newUser = new User({
            username,
            password: hashedPassword,
        });

        await newUser.save();
        res.status(201).send({ message: 'User registered successfully.' });
    } catch (error) {
        res.status(500).send({ message: 'Error registering user', error });
    }
};

// Service function to log in the user
export const loginUser = async (req: Request, res: Response) : Promise<void> => {
    try {
        const { username, password } = req.body;

        // Find the user by email
        const user = await User.findOne({ username });
        if (!user) {
            res.status(400).send({ message: 'User not found.' });
            return;
        }

        // Check if the password is correct
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(400).send({ message: 'Invalid credentials.' });
            return;
        }

        // Generate a JWT token
        const token = jwt.sign({ userId: user.id, username: username }, process.env.JWT_SECRET_KEY as string, {
            expiresIn: '7d',
        });

        res.status(200).send({ token, message: 'Logged in successfully.' });
    } catch (error) {
        console.log(error);
        res.status(500).send({ message: 'Error logging in user', error });
    }
};

export const getUser = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).send({ message: 'User not found.' });
            return;
        }

        res.status(200).send(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
}

export const getUserAcademicPath = async (req: Request, res: Response) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).send({ message: 'User not found.' });
            return;
        }

        let result = [];

        for (let i = 0; i < user.academicPath.length; i++) {
            let semester = user.academicPath[i];

            // Explicitly define the type of obj and courses
            let obj: {
                semester: string,
                courses: Array<{
                    courseName: string,
                    courseCode: string,
                    schoolName: string,
                    weight: number,
                    maxPoints: number,
                    assignments: {
                        name: string,
                        weight: number,
                        grade: number
                    }[],
                    projectedFinalGrade: number,
                    isFinalGrade?: boolean
                }>
            } = {
                semester: semester.semester,
                courses: [],  // Now TypeScript knows it's an array of objects
            };

            for (let j = 0; j < semester.courses.length; j++) {
                let course = semester.courses[j];
                const trueCourse = await Course.findById(course.courseId);
                if (!trueCourse) {
                    res.status(404).send({ message: 'Course not found.' });
                    return;
                }

                let courseObj = {
                    courseName: trueCourse.courseName,
                    courseCode: trueCourse.courseCode,
                    schoolName: trueCourse.schoolName,
                    weight: trueCourse.weight,
                    maxPoints: trueCourse.maxPoints,
                    assignments: course.assignments,
                    projectedFinalGrade: course.projectedFinalGrade,
                    isFinalGrade: course.isFinalGrade,
                };

                obj.courses.push(courseObj);
            }

            result.push(obj);
        }

        res.status(200).send(result);
    } catch (error) {
        console.error('Error fetching user academic path:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
}
