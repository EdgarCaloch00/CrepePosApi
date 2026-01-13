"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const user_role_controller_1 = require("../controllers/user_role.controller");
const UserRoleRoute = (0, express_1.Router)();
UserRoleRoute.post("/user/role/create", AuthToken_1.verifyToken, user_role_controller_1.UserRoleController.createUserRole);
UserRoleRoute.get("/user/roles", AuthToken_1.verifyToken, user_role_controller_1.UserRoleController.getUserRoles);
exports.default = UserRoleRoute;
