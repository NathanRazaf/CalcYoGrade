import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

const app = express();

// Load environment variables
dotenv.config();

// Define a basic route
app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'Hello, world!' });
});

// Define the server's start function
const start = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.NODE_ENV === 'test' ? process.env.TEST_MONGODB_URI : process.env.MONGODB_URI;
        if (!mongoURI) {
            throw new Error('MONGODB_URI is not defined in the environment variables');
        }
        await mongoose.connect(mongoURI);
        console.log('Connected to MongoDB successfully');

        // Start the Express server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

    } catch (error : any) {
        console.error('Error starting the application:', error.message);
        process.exit(1); // Exit if there's an error
    }
};
