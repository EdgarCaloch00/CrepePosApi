import express from 'express';
import cors from "cors";
import prisma from './lib/prisma';
import UserRoleRoute from './routes/user_role.router';
import UserRoute from './routes/user.router';
import TypeProductRoute from './routes/type_product.router';
import ProductRoute from './routes/product.router';
import IngredientRoute from './routes/ingredient.router';
import ProductIngredientRoute from './routes/product_ingredient.router';
import ComboRoute from './routes/combo.router';
import ComboDetailRoute from './routes/combo_detail.router';
import SaleRoute from './routes/sale.router';
import SaleDetailRoute from './routes/sale_detail.router';
import BranchRouter from './routes/branch.router';
import UserBranchRouter from './routes/user_branch.router';

const app = express();

app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

app.use("/api", UserRoleRoute);
app.use("/api", UserRoute);
app.use("/api", TypeProductRoute);
app.use("/api", ProductRoute);
app.use("/api", IngredientRoute);
app.use("/api", ProductIngredientRoute);
app.use("/api", ComboRoute);
app.use("/api", ComboDetailRoute);
app.use("/api", SaleRoute);
app.use("/api", SaleDetailRoute);
app.use("/api", BranchRouter);
app.use("/api", UserBranchRouter);

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

process.on("SIGTERM", () => {
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
