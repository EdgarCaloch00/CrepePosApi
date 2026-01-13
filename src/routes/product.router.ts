import { Router } from "express";
import { verifyToken } from "../middlewares/AuthToken";
import { ProductController } from "../controllers/product.controller";

const ProductRoute = Router();

ProductRoute.post("/product/create", verifyToken, ProductController.createProduct);
ProductRoute.get("/products", verifyToken, ProductController.getProducts);
ProductRoute.put("/product/update", verifyToken, ProductController.updateProduct);
ProductRoute.delete("/product/delete", verifyToken, ProductController.deleteProduct);

export default ProductRoute;