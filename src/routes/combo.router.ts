import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { ComboController } from "../controllers/combo.controller";

const ComboRoute = Router();

ComboRoute.post("/combo/create", verifyToken, ComboController.createCombo);
ComboRoute.get("/combo/all", verifyToken, ComboController.getAllCombos);
ComboRoute.put("/combo/update", verifyToken, ComboController.updateCombo);

export default ComboRoute;