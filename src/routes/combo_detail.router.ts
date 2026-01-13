import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { ComboDetailController } from "../controllers/combo_detail.controller";

const ComboDetailRoute = Router();

ComboDetailRoute.post("/combo/detail/create", verifyToken, ComboDetailController.createComboDetail);
ComboDetailRoute.get("/combo/detail/all", verifyToken, ComboDetailController.getAllComboDetails);
ComboDetailRoute.get("/combo/detail/:id", verifyToken, ComboDetailController.getAllComboDetail);

export default ComboDetailRoute;