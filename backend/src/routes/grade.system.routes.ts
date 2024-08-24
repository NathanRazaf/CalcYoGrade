import {Router} from "express";
import {authenticate} from "../middleware/authenticate";
import {setupGradeSystem} from "../services/grade.service";

const gradeSystemRoutes = Router();

gradeSystemRoutes.post('/add', authenticate, setupGradeSystem);

export default gradeSystemRoutes;