import mongoose from "mongoose";

const gradeSystemSchema = new mongoose.Schema({
    name: {type: String, required: true},
    maxPoints: {type: Number, required: true},
    numUsers: {type: Number, required: true, default: 1},
    system: [
        {
            grade: {type: String, required: true},
            minPoints: {type: Number, required: true},
            maxPoints: {type: Number, required: true}
        }
    ]
});

const GradeSystem = mongoose.model("GradeSystem", gradeSystemSchema, "gradeSystems");

export default GradeSystem;