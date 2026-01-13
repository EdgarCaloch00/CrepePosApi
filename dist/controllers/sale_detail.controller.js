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
exports.SaleDetailController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.SaleDetailController = {
    createSaleDetail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { amount, subtotal, sale_id, product_id, combo_id, note } = req.body;
            try {
                const uuid = (0, uuid_1.v4)();
                const saleDetailBufferId = (0, common_1.uuidToBuffer)(uuid);
                const newSaleDetail = yield prisma_1.default.sale_detail.create({
                    data: {
                        id: saleDetailBufferId,
                        created_at: new Date(),
                        updated_at: new Date(),
                        amount: amount,
                        subtotal: subtotal,
                        sale_id: (0, common_1.uuidToBuffer)(sale_id),
                        product_id: product_id ? (0, common_1.uuidToBuffer)(product_id) : null,
                        combo_id: combo_id ? (0, common_1.uuidToBuffer)(combo_id) : null,
                        note: note
                    },
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        sale_id: true,
                        product_id: true,
                        combo_id: true,
                    },
                });
                if (!newSaleDetail) {
                    return res.status(400).json({ message: "Error al insertar detalle de venta" });
                }
                const formattedSaleDetail = Object.assign(Object.assign({}, newSaleDetail), { id: (0, common_1.bufferToUuid)(Buffer.from(newSaleDetail.id)), sale_id: (0, common_1.bufferToUuid)(Buffer.from(newSaleDetail.sale_id)), product_id: newSaleDetail.product_id ? (0, common_1.bufferToUuid)(Buffer.from(newSaleDetail.product_id)) : null, combo_id: newSaleDetail.combo_id ? (0, common_1.bufferToUuid)(Buffer.from(newSaleDetail.combo_id)) : null });
                res.status(200).json(formattedSaleDetail);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllSaleDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const saleDetails = yield prisma_1.default.sale_detail.findMany({
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        amount: true,
                        subtotal: true,
                        sale_id: true,
                        product_id: true,
                        combo_id: true,
                    },
                });
                const formattedSaleDetails = saleDetails.map((detail) => (Object.assign(Object.assign({}, detail), { id: (0, common_1.bufferToUuid)(Buffer.from(detail.id)), sale_id: (0, common_1.bufferToUuid)(Buffer.from(detail.sale_id)), product_id: detail.product_id ? (0, common_1.bufferToUuid)(Buffer.from(detail.product_id)) : null, combo_id: detail.combo_id ? (0, common_1.bufferToUuid)(Buffer.from(detail.combo_id)) : null })));
                res.status(200).json(formattedSaleDetails);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getSaleDetail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const saleDetails = yield prisma_1.default.sale_detail.findMany({
                    where: {
                        sale_id: (0, common_1.uuidToBuffer)(id)
                    },
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
                    },
                });
                const formattedSaleDetails = saleDetails.map((detail) => (Object.assign(Object.assign({}, detail), { id: (0, common_1.bufferToUuid)(Buffer.from(detail.id)), sale_id: (0, common_1.bufferToUuid)(Buffer.from(detail.sale_id)), product_id: detail.product_id ? (0, common_1.bufferToUuid)(Buffer.from(detail.product_id)) : null, combo_id: detail.combo_id ? (0, common_1.bufferToUuid)(Buffer.from(detail.combo_id)) : null })));
                res.status(200).json(formattedSaleDetails);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    updateSaleDetail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { amount, subtotal, sale_id, product_id, combo_id } = req.body;
            try {
                const updatedSaleDetail = yield prisma_1.default.sale_detail.update({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    },
                    data: {
                        updated_at: new Date(),
                        amount: amount,
                        subtotal: subtotal,
                        sale_id: sale_id ? (0, common_1.uuidToBuffer)(sale_id) : undefined,
                        product_id: product_id ? (0, common_1.uuidToBuffer)(product_id) : null,
                        combo_id: combo_id ? (0, common_1.uuidToBuffer)(combo_id) : null,
                    },
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        amount: true,
                        subtotal: true,
                        sale_id: true,
                        product_id: true,
                        combo_id: true,
                    },
                });
                if (!updatedSaleDetail) {
                    return res.status(404).json({ message: "Detalle de venta no encontrado" });
                }
                const formattedSaleDetail = Object.assign(Object.assign({}, updatedSaleDetail), { id: (0, common_1.bufferToUuid)(Buffer.from(updatedSaleDetail.id)), sale_id: (0, common_1.bufferToUuid)(Buffer.from(updatedSaleDetail.sale_id)), product_id: updatedSaleDetail.product_id ? (0, common_1.bufferToUuid)(Buffer.from(updatedSaleDetail.product_id)) : null, combo_id: updatedSaleDetail.combo_id ? (0, common_1.bufferToUuid)(Buffer.from(updatedSaleDetail.combo_id)) : null });
                res.status(200).json(formattedSaleDetail);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    },
    deleteSaleDetail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.body;
            try {
                // Primero obtenemos el detalle de venta para saber el subtotal y sale_id
                const saleDetail = yield prisma_1.default.sale_detail.findUnique({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    },
                    select: {
                        subtotal: true,
                        sale_id: true,
                    }
                });
                if (!saleDetail) {
                    return res.status(404).json({ message: "Detalle de venta no encontrado" });
                }
                // Eliminamos el detalle de venta
                const deletedSaleDetail = yield prisma_1.default.sale_detail.delete({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    },
                    select: {
                        id: true,
                    }
                });
                // Actualizamos el total de la venta
                yield prisma_1.default.sale.update({
                    where: {
                        id: saleDetail.sale_id
                    },
                    data: {
                        total: {
                            decrement: saleDetail.subtotal
                        },
                        updated_at: new Date()
                    }
                });
                res.status(200).json({
                    message: "Detalle de venta eliminado correctamente y total actualizado",
                    id: (0, common_1.bufferToUuid)(Buffer.from(deletedSaleDetail.id))
                });
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    },
};
