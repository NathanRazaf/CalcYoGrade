import express from 'express';
import swaggerJsDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userRoutes from "./routes/users/user.route";
import adminRoutes from "./routes/users/admin.routes";
import gradeRoutes from "./routes/grades/grade.route";
import courseRoutes from "./routes/courses/course.route";

const app = express();
app.use(express.json());

// Load environment variables
dotenv.config();

const swaggerOptions = {
    swaggerDefinition: {
        openapi: '3.0.0',
        info: {
            title: 'API Documentation',
            version: '1.0.0',
            description: 'API Documentation for CalcYoGrades',
        },
        tags: [
            {
                name: 'users',
                description: 'Operations related to users (e.g. login, register)'
            },
        ],
    },
    apis: ['./src/routes/*.ts'],
};



// Register routes
app.use('/users', userRoutes);
app.use('/admin', adminRoutes);
app.use('/grades', gradeRoutes);
app.use('/courses', courseRoutes);


// Serve Swagger documentation
const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Define the server's start function
const start = async () : Promise<void> => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.NODE_ENV === 'test' ? process.env.TEST_MONGODB_URI : process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('MongoDB URI not found in environment variables');
            process.exit(1);
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

start();

export default app;