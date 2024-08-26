import {Router} from "express";
import {adminAuth} from "../../middleware/authenticate";
import {deleteAllData} from "../../services/users/admin.service";

const adminRoutes = Router();

adminRoutes.delete('/db/clear', adminAuth, deleteAllData);


export default adminRoutes;