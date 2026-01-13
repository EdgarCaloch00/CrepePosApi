import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { UserBranchController } from "../controllers/user_branch.controller";

const UserBranchRouter = Router();

UserBranchRouter.post("/user/branch/create", verifyToken, UserBranchController.createUserBranch);
UserBranchRouter.get("/user/branch/all", verifyToken, UserBranchController.getAllUserBranches);

export default UserBranchRouter;