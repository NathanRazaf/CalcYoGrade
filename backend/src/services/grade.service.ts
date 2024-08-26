import User from "../models/user.model";
import {Request, Response} from "express";
import Course from "../models/course.model";

export const setGradeAssignment = async (req: Request, res: Response) : Promise<void> => {
    try {
        // Fetch the user
        const user = await User.findById(req.userId);
        if (!user) {
            res.status(404).send({ message: 'User not found' });
            return;
        }

        if (!req.body.semester) {
            res.status(400).send({ message: 'Semester is required.' });
            return;
        }

        if (!req.body.courseId) {
            res.status(400).send({ message: 'Course ID is required.' });
            return;
        }

        if (!req.body.assignmentId) {
            res.status(400).send({ message: 'Assignment ID is required.' });
            return;
        }

        if (!req.body.grade && req.body.grade !== 0) {
            res.status(400).send({ message: 'Grade is required.' });
            return;
        }

        const semester = user.academicPath.find((semester: any) => semester.semester === req.body.semester);
        if (!semester) {
            res.status(404).send({ message: 'Semester not found' });
            return;
        }

        const course = semester.courses.find((course: any) => course.courseId == req.body.courseId);
        if (!course) {
            res.status(404).send({ message: 'Course not found' });
            return;
        }

        const assignment = course.assignments
            .find((assignment: any) => assignment.id == req.body.assignmentId);
        if (!assignment) {
            res.status(404).send({ message: 'Assignment not found' });
            return;
        }

        if (req.body.isFinalGrade !== undefined) {
            course.isFinalGrade = req.body.isFinalGrade;
        }

        assignment.grade = req.body.grade;
        await user.save();

        await updateUserGrades(req.userId!);

        res.status(200).send({ message: 'Grade updated successfully.' });
    } catch (error) {
        console.error('Error setting grade:', error);
        res.status(500).send({ message: 'Internal server error.' });
    }
}




export const updateUserGrades = async (userId: string) : Promise<void> => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            return;
        }

        // First, in the user
        let overallFinalGrade = 0;
        let totalWeight = 0;
        for (let i = 0; i < user.academicPath.length; i++) { // For each semester
            for (let j = 0; j < user.academicPath[i].courses.length; j++) { // For each course
                let totalAssignmentWeight = 0;
                let totalAssignmentGrade = 0;
                for (let k = 0; k < user.academicPath[i].courses[j].assignments.length; k++) { // For each assignment
                    totalAssignmentWeight += user.academicPath[i].courses[j].assignments[k].weight;
                    totalAssignmentGrade +=
                        user.academicPath[i].courses[j].assignments[k].grade
                        * user.academicPath[i].courses[j].assignments[k].weight;
                }
                // Calculate and set the course grade
                const courseGrade = parseFloat((totalAssignmentGrade / totalAssignmentWeight).toFixed(2));
                user.set(`academicPath.${i}.courses.${j}.projectedFinalGrade`, courseGrade);
                const dbCourse = await Course.findById(user.academicPath[i].courses[j].courseId);
                if (dbCourse) {
                    overallFinalGrade += courseGrade * dbCourse.weight;
                    totalWeight += dbCourse.weight;
                    if (user.academicPath[i].courses[j].isFinalGrade) {
                        const semesterIndex = dbCourse.allGrades.findIndex((grade: any) => grade.semester === user.academicPath[i].semester);
                        if (semesterIndex === -1) {
                            dbCourse.set('allGrades', [
                                ...dbCourse.allGrades,
                                {
                                    semester: user.academicPath[i].semester,
                                    grades: new Map([[userId, user.academicPath[i].courses[j].projectedFinalGrade]])
                                }
                            ]);
                        } else {
                            // If the semester is found, check if the grades map contains the userId
                            const gradesMap = dbCourse.allGrades[semesterIndex].grades;

                            if (!gradesMap!.has(userId)) {
                                // If userId does not exist in the grades map, add it
                                gradesMap!.set(userId, user.academicPath[i].courses[j].projectedFinalGrade);
                                dbCourse.set(`allGrades.${semesterIndex}.grades`, gradesMap); // Update the grades map
                            } else {
                                // If userId already exists, update the grade
                                dbCourse.set(`allGrades.${semesterIndex}.grades.${userId}`, user.academicPath[i].courses[j].projectedFinalGrade);
                            }                        }
                    }
                }
                await dbCourse?.save();
            }
        }
        // Calculate and set the overall grade
        overallFinalGrade = parseFloat((overallFinalGrade / totalWeight).toFixed(2));
        user.set('overallFinalGrade', overallFinalGrade);
        await user.save();
    } catch (error) {
        console.error('Error updating user grades:', error);
    }
}