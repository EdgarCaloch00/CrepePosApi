import { Router } from "express";
import { DashboardController } from "../controllers/dashboard.controller";

const dashboardRouter = Router();
const dashboardController = new DashboardController();

dashboardRouter.get("/stats", dashboardController.getStats);

export default dashboardRouter;
