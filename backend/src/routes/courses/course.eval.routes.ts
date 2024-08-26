import {Router} from "express";
import {createCourseEval, searchCourseEvals, setCourseEval} from "../../services/courses/course.eval.service";
import {authenticate} from "../../middleware/authenticate";

const courseEvalRoutes = Router();

courseEvalRoutes.post('/set', authenticate, setCourseEval);

courseEvalRoutes.post('/create', authenticate, createCourseEval);

courseEvalRoutes.get('/search', searchCourseEvals);

export default courseEvalRoutes;