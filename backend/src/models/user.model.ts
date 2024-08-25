import {model, Schema} from "mongoose";

const userSchema = new Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true}, // It's going to be bcrypted
    gradeSysId: {type: String},
    academicPath: [
        {
            semester: {type: String, required: true},
            courses: [
                {
                    courseId: {type: String, required: true},
                    courseEvalId: {type: String},
                    assignments: [
                        {
                            assignmentId: { type: String, required: true },  // ID of the assignment from CourseEval
                            grade: { type: Number, required: true }  // Grade for this specific assignment
                        }
                    ],
                    projectedFinalGrade: {type: Number, required: true, default: 0},
                }
            ]
        }
    ]
});

const User = model("User", userSchema, "users");

export default User;