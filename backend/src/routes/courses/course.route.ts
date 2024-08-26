import {Router} from "express";
import {addCourse} from "../../services/course.service";
import {authenticate} from "../../middleware/authenticate";
import courseEvalRoutes from "./course.eval.route";

const courseRoutes = Router();

courseRoutes.post('/add', authenticate, addCourse);
courseRoutes.use('/eval', courseEvalRoutes);

export default courseRoutes;
