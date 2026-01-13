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
exports.ProductController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.ProductController = {
    createProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, price, image, type_id, branch_id } = req.body;
            try {
                const product = yield prisma_1.default.product.findFirst({
                    where: {
                        name: name,
                    },
                });
                if (product) {
                    return res
                        .status(409)
                        .json({ message: "El producto ya se encuentra registrado" });
                }
                const typeProduct = yield prisma_1.default.type_product.findUnique({
                    where: {
                        id: (0, common_1.uuidToBuffer)(type_id),
                    },
                });
                if (!typeProduct) {
                    return res
                        .status(404)
                        .json({ message: "El tipo de producto no existe" });
                }
                const uuid = (0, uuid_1.v4)();
                const uuidBuffer = (0, common_1.uuidToBuffer)(uuid);
                const newProduct = yield prisma_1.default.product.create({
                    data: {
                        id: uuidBuffer,
                        created_at: new Date(),
                        updated_at: new Date(),
                        name: name,
                        price: price,
                        image: image,
                        is_active: true,
                        type_id: (0, common_1.uuidToBuffer)(type_id),
                        branch_id: (0, common_1.uuidToBuffer)(branch_id),
                    },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        type_id: true,
                        branch_id: true,
                    },
                });
                if (!newProduct) {
                    return res.status(400).json({ message: "Error al insertar producto" });
                }
                const formattedProduct = Object.assign(Object.assign({}, newProduct), { id: (0, common_1.bufferToUuid)(Buffer.from(newProduct.id)), type_id: (0, common_1.bufferToUuid)(Buffer.from(newProduct.type_id)), branch_id: (0, common_1.bufferToUuid)(Buffer.from(newProduct.branch_id)) });
                res.status(200).json(formattedProduct);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getProducts(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const products = yield prisma_1.default.product.findMany({
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                        type_id: true,
                        branch_id: true,
                        is_active: true,
                        created_at: true,
                        updated_at: true,
                        type_product: {
                            select: {
                                name: true,
                            },
                        },
                    },
                });
                const formattedProducts = products.map((product) => (Object.assign(Object.assign({}, product), { id: (0, common_1.bufferToUuid)(Buffer.from(product.id)), type_id: (0, common_1.bufferToUuid)(Buffer.from(product.type_id)), branch_id: (0, common_1.bufferToUuid)(Buffer.from(product.branch_id)) })));
                res.status(200).json(formattedProducts);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    updateProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, name, price, image, type_id, is_active } = req.body;
            try {
                // Verificar si el producto existe
                const existingProduct = yield prisma_1.default.product.findUnique({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    }
                });
                if (!existingProduct) {
                    return res.status(404).json({ message: "Producto no encontrado" });
                }
                // Si se proporciona type_id, verificar que existe
                if (type_id) {
                    const typeProduct = yield prisma_1.default.type_product.findUnique({
                        where: {
                            id: (0, common_1.uuidToBuffer)(type_id),
                        },
                    });
                    if (!typeProduct) {
                        return res.status(404).json({ message: "El tipo de producto no existe" });
                    }
                }
                // Actualizar el producto
                const updatedProduct = yield prisma_1.default.product.update({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    },
                    data: {
                        name: name,
                        price: price,
                        image: image,
                        type_id: type_id ? (0, common_1.uuidToBuffer)(type_id) : undefined,
                        is_active: is_active,
                        updated_at: new Date()
                    },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        image: true,
                        type_id: true,
                        is_active: true,
                        updated_at: true
                    }
                });
                const formattedProduct = Object.assign(Object.assign({}, updatedProduct), { id: (0, common_1.bufferToUuid)(Buffer.from(updatedProduct.id)), type_id: (0, common_1.bufferToUuid)(Buffer.from(updatedProduct.type_id)) });
                res.status(200).json(formattedProduct);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    },
    deleteProduct(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.body;
            try {
                // Verificar si el producto existe
                const existingProduct = yield prisma_1.default.product.findUnique({
                    where: {
                        id: (0, common_1.uuidToBuffer)(id)
                    }
                });
                if (!existingProduct) {
                    return res.status(404).json({ message: "Producto no encontrado" });
                }
                // Eliminar los products_ingredient asociados y luego el producto en una transacción
                yield prisma_1.default.$transaction([
                    prisma_1.default.product_ingredient.deleteMany({
                        where: {
                            product_id: (0, common_1.uuidToBuffer)(id)
                        }
                    }),
                    prisma_1.default.product.delete({
                        where: {
                            id: (0, common_1.uuidToBuffer)(id)
                        }
                    })
                ]);
                res.status(200).json({ message: "Producto y sus ingredientes asociados eliminados exitosamente" });
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    }
};
