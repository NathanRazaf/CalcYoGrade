import mongoose, {Schema} from "mongoose";

const courseSchema = new Schema({
    schoolName: { type: String, required: true },
    courseCode: { type: String, required: true },
    courseName: { type: String, required: true },
    weight: { type: Number, required: true },
    maxPoints: { type: Number, required: true },
    numStudents: { type: Number, default: 1 },
    allGrades: [
        {
            semester: { type: String, required: true },
            grades: {
                type: Map,
                of: new Schema({
                    grade: { type: Number, required: true }  // The student's grade
                })
            }
        }
    ]
});

// Add a text index on the "courseCode", "courseName", and "schoolName" fields
courseSchema.index({ courseCode: 'text', courseName: 'text', schoolName: 'text' });

const Course = mongoose.model("Course", courseSchema, "courses");

export default Course;