import {Router} from "express";
import gradeSystemRoutes from "./grade.system.routes";
import {setGradeAssignment, setIsFinalGrade} from "../../services/grades/grade.service";
import {authenticate} from "../../middleware/authenticate";

const gradeRoutes = Router();

gradeRoutes.use('/system', gradeSystemRoutes);

gradeRoutes.post('/set', authenticate, setGradeAssignment);

gradeRoutes.post('/confirm', authenticate, setIsFinalGrade);

export default gradeRoutes;