"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const combo_day_controller_1 = require("../controllers/combo_day.controller");
const ComboDayRoute = (0, express_1.Router)();
ComboDayRoute.post("/combo-day/today", AuthToken_1.verifyToken, combo_day_controller_1.ComboDayController.createComboDay);
ComboDayRoute.get("/combo-day/all", AuthToken_1.verifyToken, combo_day_controller_1.ComboDayController.getAllComboDays);
exports.default = ComboDayRoute;
