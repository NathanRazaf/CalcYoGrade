"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const user_route_1 = __importDefault(require("./routes/user.route"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Load environment variables
dotenv_1.default.config();
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
            }
        ],
    },
    apis: ['./src/routes/*.ts'],
};
const swaggerDocs = (0, swagger_jsdoc_1.default)(swaggerOptions);
app.use('/', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocs));
// Register routes
console.log('Registering user routes');
app.use('/users', user_route_1.default);
console.log('User routes registered');
// Define the server's start function
const start = async () => {
    try {
        // Connect to MongoDB
        const mongoURI = process.env.NODE_ENV === 'test' ? process.env.TEST_MONGODB_URI : process.env.MONGODB_URI;
        if (!mongoURI) {
            console.error('MongoDB URI not found in environment variables');
            process.exit(1);
        }
        await mongoose_1.default.connect(mongoURI);
        console.log('Connected to MongoDB successfully');
        // Start the Express server
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Error starting the application:', error.message);
        process.exit(1); // Exit if there's an error
    }
};
start();
exports.default = app;
