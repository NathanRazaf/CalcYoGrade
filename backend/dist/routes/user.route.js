"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_model_1 = __importDefault(require("../models/user.model"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userRoutes = (0, express_1.Router)();
/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags: [users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *             required:
 *              - username
 *              - password
 *     responses:
 *       201:
 *         description: User registered successfully.
 *       400:
 *         description: User already exists.
 *       500:
 *         description: Error registering user.
 */
userRoutes.post('/register', async (req, res) => {
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
});
/**
 * @swagger
 * /users/login:
 *   tags: [users]
 *   post:
 *     summary: Log in a user
 *     tags: [users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged in successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid credentials or user not found.
 *       500:
 *         description: Error logging in user.
 */
userRoutes.post('/login', async (req, res) => {
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
});
exports.default = userRoutes;
