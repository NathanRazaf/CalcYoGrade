import { model, Schema } from "mongoose";

// Define the schema for courses within a semester
const courseSchema = new Schema({
    courseId: { type: String, required: true },  // ID of the course
    assignments: [
        {
            name: { type: String, required: true },  // Name of the assignment
            weight: { type: Number, required: true },  // Weight of the assignment
            grade: { type: Number, required: true }  // Grade for this specific assignment
        }
    ],
    projectedFinalGrade: { type: Number, required: true, default: 0 },  // Projected final grade for the course
    isFinalGrade: { type: Boolean, required: true, default: false },  // Whether the final grade is in
});

// Define the schema for semesters, which contains an array of courses
const semesterSchema = new Schema({
    semester: { type: String, required: true },  // e.g., 'Fall 2023'
    courses: [courseSchema],  // Array of courses for this semester
});

// Define the user schema, with an array of semesters (each containing courses)
const userSchema = new Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },  // It's going to be bcrypted
    gradeSysId: { type: String },  // Reference to the grading system
    overallFinalGrade: { type: Number, default: 0 },  // Overall final grade for all courses
    academicPath: [semesterSchema],  // Array of semesters, each containing courses
});

const User = model("User", userSchema, "users");

export default User;
