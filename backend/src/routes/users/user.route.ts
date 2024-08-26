import {registerUser, loginUser} from '../../services/user.service';
import {Router} from "express";
import {authenticate} from "../../middleware/authenticate";
import User from "../../models/user.model";

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

userRoutes.get('/me', authenticate, async (req, res) => {
   const user = await User.findById(req.userId);
    if (!user) {
         res.status(404).send({message: 'User not found.'});
         return;
    }
    res.status(200).send(user);
});

export default userRoutes;