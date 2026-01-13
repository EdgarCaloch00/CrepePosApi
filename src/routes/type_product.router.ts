import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { TypeProductController } from "../controllers/type_product.controller";

const TypeProductRoute = Router();

TypeProductRoute.post("/type_product/create", verifyToken, TypeProductController.createTypeProduct);
TypeProductRoute.get("/type_products", verifyToken, TypeProductController.getTypeProducts);

export default TypeProductRoute;