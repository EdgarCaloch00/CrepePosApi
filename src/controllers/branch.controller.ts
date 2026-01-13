import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const BranchController = {
    async createBranch(req: any, res: any) {
        const { name } = req.body;
        try {
            const uuid = uuidv4();
            const branchBufferId = uuidToBuffer(uuid);
            const newBranch = await prisma.branch.create({
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

            const formattedBranch = {
                ...newBranch,
                id: bufferToUuid(Buffer.from(newBranch.id)),
            };

            res.status(200).json(formattedBranch);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllBranches(req: any, res: any) {
        try {
            const branches = await prisma.branch.findMany({
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    name: true,
                },
            });

            const formattedBranches = branches.map((branch) => ({
                ...branch,
                id: bufferToUuid(Buffer.from(branch.id)),
            }));

            res.status(200).json(formattedBranches);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async updateBranchReferences(req: any, res: any) {
        const { id } = req.params;
        
        try {
            const branchBufferId = uuidToBuffer(id);
            
            // Verify if branch exists
            const branch = await prisma.branch.findUnique({
                where: { id: branchBufferId }
            });

            if (!branch) {
                return res.status(404).json({ message: "Sucursal no encontrada" });
            }

            // Update all related records in a transaction
            const result = await prisma.$transaction(async (tx) => {
                // Update products
                await tx.product.updateMany({
                    where: { branch_id: null },
                    data: { branch_id: branchBufferId }
                });

                // Update ingredients
                await tx.ingredient.updateMany({
                    where: { branch_id: null },
                    data: { branch_id: branchBufferId }
                });

                // Update combos
                await tx.combo.updateMany({
                    where: { branch_id: null },
                    data: { branch_id: branchBufferId }
                });

                // Update product types
                await tx.type_product.updateMany({
                    where: { branch_id: null },
                    data: { branch_id: branchBufferId }
                });

                // Get counts of updated records
                const productsCount = await tx.product.count({ where: { branch_id: branchBufferId } });
                const ingredientsCount = await tx.ingredient.count({ where: { branch_id: branchBufferId } });
                const combosCount = await tx.combo.count({ where: { branch_id: branchBufferId } });
                const productTypesCount = await tx.type_product.count({ where: { branch_id: branchBufferId } });

                return {
                    productsCount,
                    ingredientsCount,
                    combosCount,
                    productTypesCount
                };
            });

            res.status(200).json({
                message: "Referencias actualizadas exitosamente",
                updatedCounts: result
            });

        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
};