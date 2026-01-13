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
exports.ComboDayController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const common_1 = require("../utils/common");
exports.ComboDayController = {
    createComboDay(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { combo_id, day } = req.body;
            try {
                const combo = yield prisma_1.default.combo.findUnique({
                    where: {
                        id: (0, common_1.uuidToBuffer)(combo_id),
                    },
                });
                if (!combo) {
                    return res.status(404).json({ message: "Combo no encontrado" });
                }
                const existingComboDay = yield prisma_1.default.combo_day.findFirst({
                    where: {
                        combo_id: (0, common_1.uuidToBuffer)(combo_id),
                        day: day,
                    },
                });
                if (existingComboDay) {
                    return res
                        .status(409)
                        .json({ message: "El combo ya se encuentra registrado para este día" + day });
                }
                const newComboDay = yield prisma_1.default.combo_day.create({
                    data: {
                        combo_id: (0, common_1.uuidToBuffer)(combo_id),
                        day: day,
                    },
                    select: {
                        combo_id: true,
                        day: true,
                    },
                });
                if (!newComboDay) {
                    return res.status(400).json({ message: "Error al insertar combo del día" });
                }
                const formattedComboDay = Object.assign(Object.assign({}, newComboDay), { combo_id: (0, common_1.bufferToUuid)(Buffer.from(newComboDay.combo_id)) });
                res.status(200).json(formattedComboDay);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllComboDays(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const comboDays = yield prisma_1.default.combo_day.findMany({
                    select: {
                        combo_id: true,
                        day: true,
                    },
                });
                const formattedComboDays = comboDays.map((comboDay) => (Object.assign(Object.assign({}, comboDay), { combo_id: (0, common_1.bufferToUuid)(Buffer.from(comboDay.combo_id)) })));
                res.status(200).json(formattedComboDays);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
