import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { BranchController } from "../controllers/branch.controller";

const BranchRouter = Router();

BranchRouter.post('/branch/create', verifyToken, BranchController.createBranch);
BranchRouter.get('/branch/all', verifyToken, BranchController.getAllBranches);
BranchRouter.get('/branch/:id', verifyToken, BranchController.updateBranchReferences);

export default BranchRouter