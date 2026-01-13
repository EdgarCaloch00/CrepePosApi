import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { UserController } from "../controllers/user.controller";

const UserRoute = Router();

UserRoute.post("/user/create", verifyToken, UserController.createUser);
UserRoute.post("/user/login", UserController.login);
UserRoute.get("/user/all", UserController.getAllUser);
UserRoute.get("/user/cashier", UserController.getUserCashier);
UserRoute.put("/user/update", UserController.updateUser);
UserRoute.delete("/user/delete", UserController.deleteUser);

export default UserRoute;