import {Router} from "express";
import {addCourse} from "../../services/course.service";
import {authenticate} from "../../middleware/authenticate";
import courseEvalRoutes from "./course.eval.route";

const courseRoutes = Router();

courseRoutes.use('/eval', courseEvalRoutes);
courseRoutes.post('/add', authenticate, addCourse);

export default courseRoutes;
