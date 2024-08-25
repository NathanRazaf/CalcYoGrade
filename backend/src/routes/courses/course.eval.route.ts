import {Router} from "express";
import {setCourseEval} from "../../services/course.eval.service";
import {authenticate} from "../../middleware/authenticate";

const courseEvalRoutes = Router();

courseEvalRoutes.post('/set', authenticate, setCourseEval);

export default courseEvalRoutes;