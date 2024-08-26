import {registerUser, loginUser, getUser, getUserAcademicPath} from '../../services/users/user.service';
import {Router} from "express";
import {authenticate} from "../../middleware/authenticate";

const userRoutes = Router();

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
userRoutes.post('/register', registerUser);

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
userRoutes.post('/login', loginUser);

userRoutes.get('/me', authenticate, getUser);

userRoutes.get('/my-academic-path', authenticate, getUserAcademicPath);

export default userRoutes;