import {model, Schema} from "mongoose";

const courseEvalSchema = new Schema({
    courseId: { type: String, required: true },
    semester: { type: String, required: true },
    assignments: [
        {
            name: { type: String, required: true },  // e.g., 'Midterm Exam', 'Final Project'
            weight: { type: Number, required: true }  // e.g., 50%, 30%, etc.
        }
    ],
    usedBy: { type: Number, default: 1 },  // Number of users using this division
});

// Add a text index on the "courseId" field
courseEvalSchema.index({ courseId: 'text' });

const CourseEval = model("CourseEval", courseEvalSchema, "courseEvals");

export default CourseEval;