import {model, Schema} from "mongoose";

const gradeSystemSchema = new Schema({
    name: {type: String, required: true},
    maxGrade: {type: Number, required: true},
    usedBy: {type: Number, required: true, default: 1},
    system: [
        {
            letterGrade: {type: String, required: true},
            minGrade: {type: Number, required: true},
            maxGrade: {type: Number, required: true}
        }
    ]
});

// Add a text index on the "name" field
gradeSystemSchema.index({ name: 'text' });

const GradeSystem = model("GradeSystem", gradeSystemSchema, "gradeSystems");

export default GradeSystem;