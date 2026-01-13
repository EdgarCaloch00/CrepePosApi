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
exports.UserBranchController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.UserBranchController = {
    createUserBranch(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { user_id, branch_id } = req.body;
            try {
                const uuid = (0, uuid_1.v4)();
                const userBranchBufferId = (0, common_1.uuidToBuffer)(uuid);
                const newUserBranch = yield prisma_1.default.user_branch.create({
                    data: {
                        id: userBranchBufferId,
                        created_at: new Date(),
                        updated_at: new Date(),
                        user_id: (0, common_1.uuidToBuffer)(user_id),
                        branch_id: (0, common_1.uuidToBuffer)(branch_id),
                    },
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        user_id: true,
                        branch_id: true,
                    },
                });
                if (!newUserBranch) {
                    return res.status(400).json({ message: "Error al insertar usuario_sucursal" });
                }
                const formattedUserBranch = Object.assign(Object.assign({}, newUserBranch), { id: (0, common_1.bufferToUuid)(Buffer.from(newUserBranch.id)), user_id: (0, common_1.bufferToUuid)(Buffer.from(newUserBranch.user_id)), branch_id: (0, common_1.bufferToUuid)(Buffer.from(newUserBranch.branch_id)) });
                res.status(200).json(formattedUserBranch);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getAllUserBranches(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const userBranches = yield prisma_1.default.user_branch.findMany({
                    select: {
                        id: true,
                        created_at: true,
                        updated_at: true,
                        user_id: true,
                        branch_id: true,
                    },
                });
                const formattedUserBranches = userBranches.map((userBranch) => (Object.assign(Object.assign({}, userBranch), { id: (0, common_1.bufferToUuid)(Buffer.from(userBranch.id)), user_id: (0, common_1.bufferToUuid)(Buffer.from(userBranch.user_id)), branch_id: (0, common_1.bufferToUuid)(Buffer.from(userBranch.branch_id)) })));
                res.status(200).json(formattedUserBranches);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
