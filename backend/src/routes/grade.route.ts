import {Router} from "express";
import gradeSystemRoutes from "./grade.system.routes";

const gradeRoutes = Router();

gradeRoutes.use('/system', gradeSystemRoutes);

export default gradeRoutes;