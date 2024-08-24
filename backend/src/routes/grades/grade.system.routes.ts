import {Router} from "express";
import {authenticate} from "../../middleware/authenticate";
import {searchGradeSystems, setupGradeSystem} from "../../services/grade.service";

const gradeSystemRoutes = Router();

gradeSystemRoutes.post('/add', authenticate, setupGradeSystem);

gradeSystemRoutes.get('/search', searchGradeSystems);

export default gradeSystemRoutes;