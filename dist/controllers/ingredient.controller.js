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
exports.IngredientController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.IngredientController = {
    createIngredient(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, current_stock, min_stock, unit_measurement, cost_unit, branch_id } = req.body;
            try {
                const ingredient = yield prisma_1.default.ingredient.findFirst({
                    where: {
                        name: name,
                    },
                });
                if (ingredient) {
                    return res
                        .status(409)
                        .json({ message: "El ingrediente ya se encuentra registrado" });
                }
                const uuid = (0, uuid_1.v4)();
                const uuidBuffer = (0, common_1.uuidToBuffer)(uuid);
                const newIngredient = yield prisma_1.default.ingredient.create({
                    data: {
                        id: uuidBuffer,
                        created_at: new Date(),
                        updated_at: new Date(),
                        name: name,
                        current_stock: current_stock,
                        min_stock: min_stock,
                        unit_measurement: unit_measurement,
                        cost_unit: cost_unit,
                        branch_id: (0, common_1.uuidToBuffer)(branch_id),
                    },
                    select: {
                        id: true,
                        updated_at: true,
                        current_stock: true,
                        name: true,
                        min_stock: true,
                        unit_measurement: true,
                        cost_unit: true,
                        branch_id: true,
                    },
                });
                if (!newIngredient) {
                    return res.status(400).json({ message: "Error al insertar ingrediente" });
                }
                const formattedIngredient = Object.assign(Object.assign({}, newIngredient), { id: (0, common_1.bufferToUuid)(Buffer.from(newIngredient.id)), branch_id: (0, common_1.bufferToUuid)(Buffer.from(newIngredient.branch_id)) });
                res.status(200).json(formattedIngredient);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllIngredients(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const ingredients = yield prisma_1.default.ingredient.findMany({
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        name: true,
                        current_stock: true,
                        min_stock: true,
                        unit_measurement: true,
                        cost_unit: true,
                        branch_id: true,
                    },
                });
                const formattedIngredients = ingredients.map((ingredient) => (Object.assign(Object.assign({}, ingredient), { id: (0, common_1.bufferToUuid)(Buffer.from(ingredient.id)), branch_id: (0, common_1.bufferToUuid)(Buffer.from(ingredient.branch_id)) })));
                res.status(200).json(formattedIngredients);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    updateIngredient(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, name, current_stock, min_stock, unit_measurement, cost_unit } = req.body;
            try {
                const uuidBuffer = (0, common_1.uuidToBuffer)(id);
                const ingredient = yield prisma_1.default.ingredient.findFirst({
                    where: {
                        id: uuidBuffer,
                    },
                });
                if (!ingredient) {
                    return res.status(404).json({ message: "Ingrediente no encontrado" });
                }
                const updatedIngredient = yield prisma_1.default.ingredient.update({
                    where: {
                        id: uuidBuffer,
                    },
                    data: {
                        name,
                        current_stock,
                        min_stock,
                        unit_measurement,
                        cost_unit,
                        updated_at: new Date(),
                    },
                    select: {
                        id: true,
                        updated_at: true,
                        current_stock: true,
                        name: true,
                        min_stock: true,
                        unit_measurement: true,
                        cost_unit: true,
                    },
                });
                const formattedIngredient = Object.assign(Object.assign({}, updatedIngredient), { id: (0, common_1.bufferToUuid)(Buffer.from(updatedIngredient.id)) });
                res.status(200).json(formattedIngredient);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    deleteIngredient(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.body;
            try {
                const uuidBuffer = (0, common_1.uuidToBuffer)(id);
                const ingredient = yield prisma_1.default.ingredient.findFirst({
                    where: {
                        id: uuidBuffer,
                    },
                });
                if (!ingredient) {
                    return res.status(404).json({ message: "Ingrediente no encontrado" });
                }
                yield prisma_1.default.$transaction([
                    prisma_1.default.product_ingredient.deleteMany({
                        where: {
                            ingredient_id: uuidBuffer,
                        },
                    }),
                    prisma_1.default.ingredient.delete({
                        where: {
                            id: uuidBuffer,
                        },
                    }),
                ]);
                res.status(200).json({ message: "Ingrediente eliminado correctamente" });
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
