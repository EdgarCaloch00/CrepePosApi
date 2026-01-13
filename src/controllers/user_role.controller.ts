import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const UserRoleController = {
    async createUserRole(req: any, res: any) {
        const { code, name} = req.body;
        try {
            const role = await prisma.user_role.findFirst({
                where: {
                    code: code,
                },
            });

            if (role) {
                return res
                    .status(409)
                    .json({ message: "El rol ya se encuentra registrado" });
            }

            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newRole = await prisma.user_role.create({
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

            const formattedNewRole = {...newRole, id: bufferToUuid(Buffer.from(newRole.id)) };

            res.status(200).json(formattedNewRole);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getUserRoles(req: any, res: any) {
        try {
            const roles = await prisma.user_role.findMany({
                select: {
                    id: true,
                    name: true,
                    code: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                },
            });
            const formattedRoles = roles.map((role) => ({
                ...role,
                id: bufferToUuid(Buffer.from(role.id)),
            }));

            res.status(200).json(formattedRoles);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
}
