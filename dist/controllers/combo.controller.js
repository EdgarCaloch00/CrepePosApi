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
exports.ComboController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.ComboController = {
    createCombo(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, description, price, combo_day, branch_id } = req.body;
            try {
                const existingCombo = yield prisma_1.default.combo.findFirst({
                    where: {
                        name: name,
                    },
                });
                if (existingCombo) {
                    return res
                        .status(409)
                        .json({ message: "El combo ya se encuentra registrado" });
                }
                const uuid = (0, uuid_1.v4)();
                const uuidBuffer = (0, common_1.uuidToBuffer)(uuid);
                const newCombo = yield prisma_1.default.combo.create({
                    data: {
                        id: uuidBuffer,
                        created_at: new Date(),
                        updted_at: new Date(),
                        name: name,
                        description: description,
                        price: price,
                        is_active: true,
                        combo_day: combo_day,
                        branch_id: (0, common_1.uuidToBuffer)(branch_id),
                    },
                    select: {
                        id: true,
                        updted_at: true,
                        name: true,
                        description: true,
                        price: true,
                        branch_id: true,
                    },
                });
                if (!newCombo) {
                    return res.status(400).json({ message: "Error al insertar combo" });
                }
                const formattedCombo = Object.assign(Object.assign({}, newCombo), { id: (0, common_1.bufferToUuid)(Buffer.from(newCombo.id)), branch_id: (0, common_1.bufferToUuid)(Buffer.from(newCombo.branch_id)) });
                res.status(200).json(formattedCombo);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllCombos(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const combos = yield prisma_1.default.combo.findMany({
                    select: {
                        id: true,
                        updted_at: true,
                        name: true,
                        description: true,
                        price: true,
                        is_active: true,
                        combo_day: true,
                        branch_id: true,
                    },
                });
                const formattedCombos = combos.map((combo) => (Object.assign(Object.assign({}, combo), { id: (0, common_1.bufferToUuid)(Buffer.from(combo.id)), branch_id: (0, common_1.bufferToUuid)(Buffer.from(combo.branch_id)) })));
                res.status(200).json(formattedCombos);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
