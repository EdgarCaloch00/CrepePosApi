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
exports.SaleController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.SaleController = {
    createSale(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { total, payment_method, user_id } = req.body;
            try {
                const uuid = (0, uuid_1.v4)();
                const saleBufferId = (0, common_1.uuidToBuffer)(uuid);
                const newSale = yield prisma_1.default.sale.create({
                    data: {
                        id: saleBufferId,
                        created_at: new Date(),
                        updated_at: new Date(),
                        total: total,
                        payment_method: payment_method,
                        user_id: (0, common_1.uuidToBuffer)(user_id),
                    },
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        total: true,
                        user_id: true,
                    },
                });
                if (!newSale) {
                    return res.status(400).json({ message: "Error al insertar venta" });
                }
                const formattedSale = Object.assign(Object.assign({}, newSale), { id: (0, common_1.bufferToUuid)(Buffer.from(newSale.id)), user_id: (0, common_1.bufferToUuid)(Buffer.from(newSale.user_id)) });
                res.status(200).json(formattedSale);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllSales(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const sales = yield prisma_1.default.sale.findMany({
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        total: true,
                        payment_method: true,
                        user_id: true,
                        user: {
                            select: {
                                name: true,
                            }
                        },
                        sale_detail: {
                            select: {
                                id: true,
                                created_at: true,
                                updated_at: true,
                                amount: true,
                                subtotal: true,
                                sale_id: true,
                                product_id: true,
                                combo_id: true,
                                note: true,
                                product: {
                                    select: {
                                        name: true,
                                        price: true,
                                    }
                                },
                                combo: {
                                    select: {
                                        name: true,
                                        price: true,
                                    }
                                }
                            }
                        }
                    },
                });
                const formattedSales = sales.map((sale) => (Object.assign(Object.assign({}, sale), { id: (0, common_1.bufferToUuid)(Buffer.from(sale.id)), user_id: (0, common_1.bufferToUuid)(Buffer.from(sale.user_id)), sale_detail: sale.sale_detail.map((detail) => (Object.assign(Object.assign({}, detail), { id: (0, common_1.bufferToUuid)(Buffer.from(detail.id)), sale_id: (0, common_1.bufferToUuid)(Buffer.from(detail.sale_id)), product_id: detail.product_id ? (0, common_1.bufferToUuid)(Buffer.from(detail.product_id)) : null, combo_id: detail.combo_id ? (0, common_1.bufferToUuid)(Buffer.from(detail.combo_id)) : null }))) })));
                res.status(200).json(formattedSales);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    updateSale(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, total, payment_method, user_id } = req.body;
            try {
                const updatedSale = yield prisma_1.default.sale.update({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    },
                    data: {
                        updated_at: new Date(),
                        total: total,
                        payment_method: payment_method,
                        user_id: user_id ? (0, common_1.uuidToBuffer)(user_id) : undefined,
                    },
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        total: true,
                        payment_method: true,
                        user_id: true,
                    }
                });
                if (!updatedSale) {
                    return res.status(404).json({ message: "Venta no encontrada" });
                }
                const formattedSale = Object.assign(Object.assign({}, updatedSale), { id: (0, common_1.bufferToUuid)(Buffer.from(updatedSale.id)), user_id: (0, common_1.bufferToUuid)(Buffer.from(updatedSale.user_id)) });
                res.status(200).json(formattedSale);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    },
    deleteSale(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.body;
            try {
                // Usar una transacción para eliminar tanto la venta como sus detalles
                const deletedSale = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // Primero eliminamos los detalles de venta
                    yield tx.sale_detail.deleteMany({
                        where: {
                            sale_id: (0, common_1.uuidToBuffer)(id)
                        }
                    });
                    // Luego eliminamos la venta
                    const deletedSale = yield tx.sale.delete({
                        where: {
                            id: (0, common_1.uuidToBuffer)(id)
                        }
                    });
                    return deletedSale;
                }));
                if (!deletedSale) {
                    return res.status(404).json({ message: "Venta no encontrada" });
                }
                res.status(200).json({ message: "Venta y sus detalles eliminados correctamente" });
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    },
    getSalesByDateAndUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { date, user_id } = req.query;
            try {
                // Validate date format
                if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                    return res.status(400).json({
                        message: "Formato de fecha inválido. Use YYYY-MM-DD (ejemplo: 2023-10-18)"
                    });
                }
                // Crear fechas en la zona horaria de México
                const startDate = new Date(`${date}T00:00:00-06:00`);
                const endDate = new Date(`${date}T23:59:59.999-06:00`);
                console.log('Buscando ventas entre:', startDate.toISOString(), 'y', endDate.toISOString());
                const sales = yield prisma_1.default.sale.findMany({
                    where: {
                        created_at: {
                            gte: startDate,
                            lte: endDate
                        },
                        user_id: (0, common_1.uuidToBuffer)(user_id)
                    },
                    orderBy: {
                        created_at: 'asc'
                    },
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        total: true,
                        payment_method: true,
                        user_id: true,
                        user: {
                            select: {
                                name: true
                            }
                        }
                    }
                });
                // Calculate totals by payment method
                const totals = sales.reduce((acc, sale) => {
                    if (!acc[sale.payment_method]) {
                        acc[sale.payment_method] = 0;
                    }
                    acc[sale.payment_method] += Number(sale.total);
                    return acc;
                }, {});
                const formattedSales = sales.map((sale) => (Object.assign(Object.assign({}, sale), { id: (0, common_1.bufferToUuid)(Buffer.from(sale.id)), user_id: (0, common_1.bufferToUuid)(Buffer.from(sale.user_id)) })));
                res.status(200).json({
                    sales: formattedSales,
                    summary: {
                        totalSales: sales.length,
                        paymentMethodTotals: totals,
                        grandTotal: Object.values(totals).reduce((a, b) => a + b, 0)
                    }
                });
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    },
};
