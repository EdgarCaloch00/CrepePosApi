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
exports.BranchController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.BranchController = {
    createBranch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name } = req.body;
            try {
                const uuid = (0, uuid_1.v4)();
                const branchBufferId = (0, common_1.uuidToBuffer)(uuid);
                const newBranch = yield prisma_1.default.branch.create({
                    data: {
                        id: branchBufferId,
                        created_at: new Date(),
                        updated_at: new Date(),
                        name: name,
                    },
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        name: true,
                    },
                });
                if (!newBranch) {
                    return res.status(400).json({ message: "Error al insertar sucursal" });
                }
                const formattedBranch = Object.assign(Object.assign({}, newBranch), { id: (0, common_1.bufferToUuid)(Buffer.from(newBranch.id)) });
                res.status(200).json(formattedBranch);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllBranches(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const branches = yield prisma_1.default.branch.findMany({
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        name: true,
                    },
                });
                const formattedBranches = branches.map((branch) => (Object.assign(Object.assign({}, branch), { id: (0, common_1.bufferToUuid)(Buffer.from(branch.id)) })));
                res.status(200).json(formattedBranches);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    updateBranchReferences(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const branchBufferId = (0, common_1.uuidToBuffer)(id);
                // Verify if branch exists
                const branch = yield prisma_1.default.branch.findUnique({
                    where: { id: branchBufferId }
                });
                if (!branch) {
                    return res.status(404).json({ message: "Sucursal no encontrada" });
                }
                // Update all related records in a transaction
                const result = yield prisma_1.default.$transaction((tx) => __awaiter(this, void 0, void 0, function* () {
                    // Update products
                    yield tx.product.updateMany({
                        where: { branch_id: null },
                        data: { branch_id: branchBufferId }
                    });
                    // Update ingredients
                    yield tx.ingredient.updateMany({
                        where: { branch_id: null },
                        data: { branch_id: branchBufferId }
                    });
                    // Update combos
                    yield tx.combo.updateMany({
                        where: { branch_id: null },
                        data: { branch_id: branchBufferId }
                    });
                    // Update product types
                    yield tx.type_product.updateMany({
                        where: { branch_id: null },
                        data: { branch_id: branchBufferId }
                    });
                    // Get counts of updated records
                    const productsCount = yield tx.product.count({ where: { branch_id: branchBufferId } });
                    const ingredientsCount = yield tx.ingredient.count({ where: { branch_id: branchBufferId } });
                    const combosCount = yield tx.combo.count({ where: { branch_id: branchBufferId } });
                    const productTypesCount = yield tx.type_product.count({ where: { branch_id: branchBufferId } });
                    return {
                        productsCount,
                        ingredientsCount,
                        combosCount,
                        productTypesCount
                    };
                }));
                res.status(200).json({
                    message: "Referencias actualizadas exitosamente",
                    updatedCounts: result
                });
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor: " + error });
            }
        });
    },
};
