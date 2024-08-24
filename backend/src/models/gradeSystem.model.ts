import mongoose, {Schema} from "mongoose";

const gradeSystemSchema = new Schema({
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

// Add a text index on the "name" field
gradeSystemSchema.index({ name: 'text' });

const GradeSystem = mongoose.model("GradeSystem", gradeSystemSchema, "gradeSystems");

export default GradeSystem;