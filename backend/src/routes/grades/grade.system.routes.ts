import {Router} from "express";
import {authenticate} from "../../middleware/authenticate";
import {searchGradeSystems, setupGradeSystem} from "../../services/grades/grade.system.service";

const gradeSystemRoutes = Router();

gradeSystemRoutes.post('/add', authenticate, setupGradeSystem);

gradeSystemRoutes.get('/search', searchGradeSystems);

export default gradeSystemRoutes;