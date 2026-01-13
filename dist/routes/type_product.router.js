"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthToken_1 = require("../middlewares/AuthToken");
const type_product_controller_1 = require("../controllers/type_product.controller");
const TypeProductRoute = (0, express_1.Router)();
TypeProductRoute.post("/type_product/create", AuthToken_1.verifyToken, type_product_controller_1.TypeProductController.createTypeProduct);
TypeProductRoute.get("/type_products", AuthToken_1.verifyToken, type_product_controller_1.TypeProductController.getTypeProducts);
exports.default = TypeProductRoute;
