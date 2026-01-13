import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { IngredientController } from "../controllers/ingredient.controller";

const IngredientRoute = Router();

IngredientRoute.post("/ingredient/create", verifyToken, IngredientController.createIngredient);
IngredientRoute.get("/ingredients", verifyToken, IngredientController.getAllIngredients);
IngredientRoute.get("/ingredients/basic", verifyToken, IngredientController.getAllBasicIngredients);
IngredientRoute.get("/ingredients/with-virtual", verifyToken, IngredientController.getAllIngredientsWithVirtual);
IngredientRoute.get("/ingredients/branch/:branch_id", verifyToken, IngredientController.getIngredientsByBranch);
IngredientRoute.get("/ingredients/inventory-summary", verifyToken, IngredientController.getInventorySummary);
IngredientRoute.get("/ingredient/consumption-report", verifyToken, IngredientController.getIngredientConsumptionReport);
IngredientRoute.put("/ingredient/update", verifyToken, IngredientController.updateIngredient);
IngredientRoute.put("/ingredient/reset-consumption", verifyToken, IngredientController.resetIngredientConsumption);
IngredientRoute.delete("/ingredient/delete", verifyToken, IngredientController.deleteIngredient);

export default IngredientRoute;