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
exports.ComboDetailController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.ComboDetailController = {
    createComboDetail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { amount, combo_id, type_product_id } = req.body;
            try {
                const existingComboDetail = yield prisma_1.default.combo_detail.findFirst({
                    where: {
                        combo_id: (0, common_1.uuidToBuffer)(combo_id),
                        type_product_id: (0, common_1.uuidToBuffer)(type_product_id),
                    },
                });
                if (existingComboDetail) {
                    return res
                        .status(409)
                        .json({ message: "El detalle del combo ya se encuentra registrado" });
                }
                const uuid = (0, uuid_1.v4)();
                const uuidBuffer = (0, common_1.uuidToBuffer)(uuid);
                const newComboDetail = yield prisma_1.default.combo_detail.create({
                    data: {
                        id: uuidBuffer,
                        created_at: new Date(),
                        updated_at: new Date(),
                        amount: amount,
                        combo_id: (0, common_1.uuidToBuffer)(combo_id),
                        type_product_id: (0, common_1.uuidToBuffer)(type_product_id),
                    },
                    select: {
                        id: true,
                        updated_at: true,
                        amount: true,
                        combo_id: true,
                        type_product_id: true,
                    },
                });
                if (!newComboDetail) {
                    return res.status(400).json({ message: "Error al insertar detalle del combo" });
                }
                const formattedComboDetail = Object.assign(Object.assign({}, newComboDetail), { id: (0, common_1.bufferToUuid)(Buffer.from(newComboDetail.id)), combo_id: (0, common_1.bufferToUuid)(Buffer.from(newComboDetail.combo_id)), type_product_id: (0, common_1.bufferToUuid)(Buffer.from(newComboDetail.type_product_id)) });
                res.status(200).json(formattedComboDetail);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllComboDetails(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const comboDetails = yield prisma_1.default.combo_detail.findMany({
                    select: {
                        id: true,
                        updated_at: true,
                        combo_id: true,
                        type_product: {
                            select: {
                                name: true,
                                description: true,
                            }
                        }
                    },
                });
                const formattedComboDetails = comboDetails.map((detail) => (Object.assign(Object.assign({}, detail), { id: (0, common_1.bufferToUuid)(Buffer.from(detail.id)), combo_id: (0, common_1.bufferToUuid)(Buffer.from(detail.combo_id)) })));
                res.status(200).json(formattedComboDetails);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllComboDetail(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const comboDetails = yield prisma_1.default.combo_detail.findMany({
                    where: {
                        combo_id: (0, common_1.uuidToBuffer)(id),
                    },
                    select: {
                        id: true,
                        combo_id: true,
                        amount: true,
                        type_product_id: true,
                        updated_at: true,
                        created_at: true,
                        type_product: {
                            select: {
                                name: true,
                                description: true,
                            }
                        }
                    },
                });
                const formattedComboDetails = comboDetails.map((detail) => (Object.assign(Object.assign({}, detail), { id: (0, common_1.bufferToUuid)(Buffer.from(detail.id)), combo_id: (0, common_1.bufferToUuid)(Buffer.from(detail.combo_id)), type_product_id: (0, common_1.bufferToUuid)(Buffer.from(detail.type_product_id)) })));
                res.status(200).json(formattedComboDetails);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
