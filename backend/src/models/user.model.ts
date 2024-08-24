import mongoose, {Schema} from "mongoose";

const userSchema = new Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true}, // It's going to be bcrypted
    gradeSysId: {type: String},
});

const User = mongoose.model("User", userSchema, "users");

export default User;