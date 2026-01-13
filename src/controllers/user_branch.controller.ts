import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";


export const UserBranchController = {
    async createUserBranch(req: any, res: any) {
        const { user_id, branch_id } = req.body;
        try {
            const uuid = uuidv4();
            const userBranchBufferId = uuidToBuffer(uuid);
            const newUserBranch = await prisma.user_branch.create({
                data: {
                    id: userBranchBufferId,
                    created_at: new Date(),
                    updated_at: new Date(),
                    user_id: uuidToBuffer(user_id),
                    branch_id: uuidToBuffer(branch_id),
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

            const formattedUserBranch = {
                ...newUserBranch,
                id: bufferToUuid(Buffer.from(newUserBranch.id)),
                user_id: bufferToUuid(Buffer.from(newUserBranch.user_id)),
                branch_id: bufferToUuid(Buffer.from(newUserBranch.branch_id)),
            };

            res.status(200).json(formattedUserBranch);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllUserBranches(req: any, res: any) {
        try {
            const userBranches = await prisma.user_branch.findMany({
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    user_id: true,
                    branch_id: true,
                },
            });

            const formattedUserBranches = userBranches.map((userBranch) => ({
                ...userBranch,
                id: bufferToUuid(Buffer.from(userBranch.id)),
                user_id: bufferToUuid(Buffer.from(userBranch.user_id)),
                branch_id: bufferToUuid(Buffer.from(userBranch.branch_id)),
            }));

            res.status(200).json(formattedUserBranches);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
};