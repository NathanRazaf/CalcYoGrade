"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const user_model_1 = __importDefault(require("../models/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Service function to register a new user
const registerUser = async (req, res) => {
    try {
        console.log('Registering user...');
        const { username, password } = req.body;
        // Check if the user already exists
        const existingUser = await user_model_1.default.findOne({ username });
        if (existingUser) {
            res.status(400).send({ message: 'User with this email already exists.' });
        }
        // Hash the password
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        // Create a new user
        const newUser = new user_model_1.default({
            username,
            password: hashedPassword,
        });
        await newUser.save();
        console.log('User registered successfully.');
        res.status(201).send({ message: 'User registered successfully.' });
    }
    catch (error) {
        return res.status(500).send({ message: 'Error registering user', error });
    }
};
exports.registerUser = registerUser;
// Service function to log in the user
const loginUser = async (req, res) => {
    try {
        console.log('Logging in user...');
        const { username, password } = req.body;
        // Find the user by email
        const user = await user_model_1.default.findOne({ username });
        if (!user) {
            res.status(400).send({ message: 'User not found.' });
            return;
        }
        // Check if the password is correct
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(400).send({ message: 'Invalid credentials.' });
        }
        // Generate a JWT token
        const token = jsonwebtoken_1.default.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
            expiresIn: '7d',
        });
        return res.status(200).send({ token, message: 'Logged in successfully.' });
    }
    catch (error) {
        return res.status(500).send({ message: 'Error logging in user', error });
    }
};
exports.loginUser = loginUser;
