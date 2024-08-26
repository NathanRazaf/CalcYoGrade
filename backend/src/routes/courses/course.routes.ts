import {Router} from "express";
import {addCourse, getCourseStats, removeCourse, searchCourses} from "../../services/courses/course.service";
import {authenticate} from "../../middleware/authenticate";
import courseEvalRoutes from "./course.eval.routes";

const courseRoutes = Router();

courseRoutes.post('/add', authenticate, addCourse);

courseRoutes.delete('/remove', authenticate, removeCourse);

courseRoutes.get('/stats', getCourseStats);

courseRoutes.get('/search', searchCourses);

courseRoutes.use('/eval', courseEvalRoutes);

export default courseRoutes;
