import {Router} from "express";
import {createCourseEval, setCourseEval} from "../../services/course.eval.service";
import {authenticate} from "../../middleware/authenticate";

const courseEvalRoutes = Router();

courseEvalRoutes.post('/set', authenticate, setCourseEval);
courseEvalRoutes.post('/create', authenticate, createCourseEval);

export default courseEvalRoutes;