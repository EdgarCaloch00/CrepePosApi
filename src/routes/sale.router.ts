import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { SaleController } from "../controllers/sale.controller";

const SaleRoute = Router();

SaleRoute.post("/sale/create", verifyToken, SaleController.createSale);
SaleRoute.get("/sale/all", verifyToken, SaleController.getAllSales);
SaleRoute.delete("/sale/delete", verifyToken, SaleController.deleteSale);
SaleRoute.get("/sales/daily", verifyToken, SaleController.getSalesByDateAndUser);

export default SaleRoute;