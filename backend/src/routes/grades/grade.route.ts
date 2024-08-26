import {Router} from "express";
import gradeSystemRoutes from "./grade.system.routes";
import {setGradeAssignment} from "../../services/grade.service";
import {authenticate} from "../../middleware/authenticate";

const gradeRoutes = Router();

gradeRoutes.use('/system', gradeSystemRoutes);
gradeRoutes.post('/set', authenticate, setGradeAssignment);

export default gradeRoutes;