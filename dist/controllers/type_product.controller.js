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
exports.TypeProductController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.TypeProductController = {
    createTypeProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, description, branch_id } = req.body;
            try {
                const typeProduct = yield prisma_1.default.type_product.findFirst({
                    where: {
                        name: name,
                    },
                });
                if (typeProduct) {
                    return res
                        .status(409)
                        .json({ message: "El tipo de producto ya se encuentra registrado" });
                }
                const uuid = (0, uuid_1.v4)();
                const uuidBuffer = (0, common_1.uuidToBuffer)(uuid);
                const newTypeProduct = yield prisma_1.default.type_product.create({
                    data: {
                        id: uuidBuffer,
                        created_at: new Date(),
                        updated_at: new Date(),
                        name: name,
                        description: description,
                        branch_id: (0, common_1.uuidToBuffer)(branch_id),
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        branch_id: true,
                    },
                });
                if (!newTypeProduct) {
                    return res.status(400).json({ message: "Error al insertar tipo de producto" });
                }
                const formattedTypeProduct = Object.assign(Object.assign({}, newTypeProduct), { id: (0, common_1.bufferToUuid)(Buffer.from(newTypeProduct.id)), branch_id: (0, common_1.bufferToUuid)(Buffer.from(newTypeProduct.branch_id)) });
                res.status(200).json(formattedTypeProduct);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getTypeProducts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const typeProducts = yield prisma_1.default.type_product.findMany({
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        created_at: true,
                        updated_at: true,
                    },
                });
                const formattedTypeProducts = typeProducts.map((typeProduct) => (Object.assign(Object.assign({}, typeProduct), { id: (0, common_1.bufferToUuid)(Buffer.from(typeProduct.id)) })));
                res.status(200).json(formattedTypeProducts);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    updateTypeProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, name, description } = req.body;
            try {
                // Verificar si existe otro tipo de producto con el mismo nombre
                const existingTypeProduct = yield prisma_1.default.type_product.findFirst({
                    where: {
                        name: name,
                        id: {
                            not: (0, common_1.uuidToBuffer)(id)
                        }
                    },
                });
                if (existingTypeProduct) {
                    return res
                        .status(409)
                        .json({ message: "Ya existe otro tipo de producto con ese nombre" });
                }
                const updatedTypeProduct = yield prisma_1.default.type_product.update({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    },
                    data: {
                        name,
                        description,
                        updated_at: new Date()
                    },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        updated_at: true
                    }
                });
                const formattedTypeProduct = Object.assign(Object.assign({}, updatedTypeProduct), { id: (0, common_1.bufferToUuid)(Buffer.from(updatedTypeProduct.id)) });
                res.status(200).json(formattedTypeProduct);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    },
    deleteTypeProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                // Verificar si el tipo de producto existe
                const typeProduct = yield prisma_1.default.type_product.findUnique({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    }
                });
                if (!typeProduct) {
                    return res.status(404).json({ message: "Tipo de producto no encontrado" });
                }
                yield prisma_1.default.type_product.delete({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    }
                });
                res.status(200).json({ message: "Tipo de producto eliminado exitosamente" });
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    }
};
