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
exports.UserRoleController = void 0;
const prisma_1 = __importDefault(require("../lib/prisma"));
const uuid_1 = require("uuid");
const common_1 = require("../utils/common");
exports.UserRoleController = {
    createUserRole(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { code, name } = req.body;
            try {
                const role = yield prisma_1.default.user_role.findFirst({
                    where: {
                        code: code,
                    },
                });
                if (role) {
                    return res
                        .status(409)
                        .json({ message: "El rol ya se encuentra registrado" });
                }
                const uuid = (0, uuid_1.v4)();
                const uuidBuffer = (0, common_1.uuidToBuffer)(uuid);
                const newRole = yield prisma_1.default.user_role.create({
                    data: {
                        id: uuidBuffer,
                        is_active: true,
                        created_at: new Date(),
                        updated_at: new Date(),
                        name: name,
                        code: code,
                    },
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                });
                if (!newRole) {
                    return res.status(400).json({ message: "Error al insertar rol" });
                }
                const formattedNewRole = Object.assign(Object.assign({}, newRole), { id: (0, common_1.bufferToUuid)(Buffer.from(newRole.id)) });
                res.status(200).json(formattedNewRole);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
    getUserRoles(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const roles = yield prisma_1.default.user_role.findMany({
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        is_active: true,
                        created_at: true,
                        updated_at: true,
                    },
                });
                const formattedRoles = roles.map((role) => (Object.assign(Object.assign({}, role), { id: (0, common_1.bufferToUuid)(Buffer.from(role.id)) })));
                res.status(200).json(formattedRoles);
            }
            catch (error) {
                return res.status(500).json({ message: "Error de servidor" + error });
            }
        });
    },
};
