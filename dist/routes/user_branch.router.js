"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const user_branch_controller_1 = require("../controllers/user_branch.controller");
const UserBranchRouter = (0, express_1.Router)();
UserBranchRouter.post("/user/branch/create", AuthToken_1.verifyToken, user_branch_controller_1.UserBranchController.createUserBranch);
UserBranchRouter.get("/user/branch/all", AuthToken_1.verifyToken, user_branch_controller_1.UserBranchController.getAllUserBranches);
exports.default = UserBranchRouter;
