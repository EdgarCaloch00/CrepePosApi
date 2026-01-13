import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { ProductIngredientController } from "../controllers/product_ingredient.controller";

const ProductIngredientRoute = Router();

ProductIngredientRoute.post("/product/ingredient/create", verifyToken, ProductIngredientController.createProductIngredient);
ProductIngredientRoute.get("/product/ingredient/all", verifyToken, ProductIngredientController.getAllProductIngredients);
ProductIngredientRoute.get("/product/ingredient/:id", verifyToken, ProductIngredientController.getProductIngredients);
ProductIngredientRoute.delete("/product/ingredient/delete", verifyToken, ProductIngredientController.deleteProductIngredient);
ProductIngredientRoute.delete("/product/ingredient/delete-virtual", verifyToken, ProductIngredientController.deleteVirtualProductIngredient);

export default ProductIngredientRoute;