"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const user_role_router_1 = __importDefault(require("./routes/user_role.router"));
const user_router_1 = __importDefault(require("./routes/user.router"));
const type_product_router_1 = __importDefault(require("./routes/type_product.router"));
const product_router_1 = __importDefault(require("./routes/product.router"));
const ingredient_router_1 = __importDefault(require("./routes/ingredient.router"));
const product_ingredient_router_1 = __importDefault(require("./routes/product_ingredient.router"));
const combo_router_1 = __importDefault(require("./routes/combo.router"));
const combo_detail_router_1 = __importDefault(require("./routes/combo_detail.router"));
const sale_router_1 = __importDefault(require("./routes/sale.router"));
const sale_detail_router_1 = __importDefault(require("./routes/sale_detail.router"));
const branch_router_1 = __importDefault(require("./routes/branch.router"));
const user_branch_router_1 = __importDefault(require("./routes/user_branch.router"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use((0, cors_1.default)());
const PORT = process.env.PORT || 3000;
app.use("/api", user_role_router_1.default);
app.use("/api", user_router_1.default);
app.use("/api", type_product_router_1.default);
app.use("/api", product_router_1.default);
app.use("/api", ingredient_router_1.default);
app.use("/api", product_ingredient_router_1.default);
app.use("/api", combo_router_1.default);
app.use("/api", combo_detail_router_1.default);
app.use("/api", sale_router_1.default);
app.use("/api", sale_detail_router_1.default);
app.use("/api", branch_router_1.default);
app.use("/api", user_branch_router_1.default);
const server = app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
process.on("SIGTERM", () => {
    server.close(() => __awaiter(void 0, void 0, void 0, function* () {
        yield prisma_1.default.$disconnect();
        process.exit(0);
    }));
});
