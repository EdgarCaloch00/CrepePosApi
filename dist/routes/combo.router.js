"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const combo_controller_1 = require("../controllers/combo.controller");
const ComboRoute = (0, express_1.Router)();
ComboRoute.post("/combo/create", AuthToken_1.verifyToken, combo_controller_1.ComboController.createCombo);
ComboRoute.get("/combo/all", AuthToken_1.verifyToken, combo_controller_1.ComboController.getAllCombos);
exports.default = ComboRoute;
