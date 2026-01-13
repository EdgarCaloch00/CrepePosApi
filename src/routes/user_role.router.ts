import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { UserRoleController } from "../controllers/user_role.controller";


const UserRoleRoute = Router();

UserRoleRoute.post("/user/role/create", verifyToken, UserRoleController.createUserRole);
UserRoleRoute.get("/user/roles", verifyToken, UserRoleController.getUserRoles);

export default UserRoleRoute;