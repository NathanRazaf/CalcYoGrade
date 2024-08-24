import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';


// Extend the Request interface to include userId
declare global {
    namespace Express {
        interface Request {
            userId?: string; // Optional userId field on the request object
        }
    }
}

// Middleware to verify JWT and set req.userId
export const authenticate = (req: Request, res: Response, next: NextFunction) : void => {
    // Get the token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

    if (!token) {
        res.status(401).json({ message: 'Access token is missing or invalid' });
        return;
    }

    try {
        // Verify the token and extract the userId from it
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { userId: string };

        // Set the userId on the request object
        req.userId = decoded.userId;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
        return;
    }
};

export const adminAuth = (req: Request, res: Response, next: NextFunction) : void => {
    // Get the token from the Authorization header
    const token = req.headers['authorization']?.split(' ')[1]; // Bearer <token>

    if (!token) {
        res.status(401).json({ message: 'Access token is missing or invalid' });
        return;
    }

    try {
        // Verify the token and extract the userId from it
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY as string) as { userId: string, username: string };

        // Check if the user is an admin
        if (decoded.username !== process.env.ADMIN_USERNAME) {
            res.status(403).json({ message: 'Unauthorized' });
            return;
        }

        next();
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
        return;
    }
}

