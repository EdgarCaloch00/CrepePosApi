import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const ComboController = {
    async createCombo(req: any, res: any) {
        const { name, description, price, combo_day, branch_id } = req.body;
        try {
            const existingCombo = await prisma.combo.findFirst({
                where: {
                   name: name,
                   branch_id: uuidToBuffer(branch_id),
                },
            });

            if (existingCombo) {
                return res
                    .status(409)
                    .json({ message: "El combo ya se encuentra registrado" });
            }

            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newCombo = await prisma.combo.create({
                data: {
                    id: uuidBuffer,
                    created_at: new Date(),
                    updted_at: new Date(),
                    name: name,
                    description: description,
                    price: price,
                    is_active: true,
                    combo_day: combo_day,
                    branch_id: uuidToBuffer(branch_id),
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

            const formattedCombo = {
                ...newCombo,
                id: bufferToUuid(Buffer.from(newCombo.id)),
                branch_id: bufferToUuid(Buffer.from(newCombo.branch_id)),
            };

            res.status(200).json(formattedCombo);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllCombos(req: any, res: any) {
        try {

            const user = req.user;
            const userRole = user.user_role.code;

            let whereClause: any = {};
            
            // Si el usuario es admin o cashier, filtrar por su branch
            if (userRole === 'cashier') {
                // Obtener el branch_id del usuario desde user_branch
                const userBranch = await prisma.user_branch.findFirst({
                    where: {
                        user_id: uuidToBuffer(user.id)
                    },
                    select: {
                        branch_id: true
                    }
                });

                if (!userBranch) {
                    return res.status(404).json({ message: "Usuario no está asociado a ninguna sucursal" });
                }

                whereClause.branch_id = userBranch.branch_id;
            }

            const combos = await prisma.combo.findMany({
                where: whereClause,
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

            const formattedCombos = combos.map((combo) => ({
                ...combo,
                id: bufferToUuid(Buffer.from(combo.id)),
                branch_id: bufferToUuid(Buffer.from(combo.branch_id)),
            }));

            res.status(200).json(formattedCombos);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async updateCombo(req: any, res: any) {
        const { id,  name, description, price, is_active, combo_day, branch_id } = req.body;
        
        try {
            // Verificar si el combo existe
            const existingCombo = await prisma.combo.findUnique({
                where: {
                    id: uuidToBuffer(id),
                },
            });

            if (!existingCombo) {
                return res.status(404).json({ message: "Combo no encontrado" });
            }

            // // Verificar si ya existe otro combo con el mismo nombre (excluyendo el actual)
            // if (name) {
            //     const comboWithSameName = await prisma.combo.findFirst({
            //         where: {
            //             name: name,
            //             NOT: {
            //                 id: uuidToBuffer(id),
            //             },
            //         },
            //     });

            //     if (comboWithSameName) {
            //         return res.status(409).json({ 
            //             message: "Ya existe otro combo con ese nombre" 
            //         });
            //     }
            // }

            // Preparar los datos para actualizar
            const updateData: any = {
                updted_at: new Date(),
            };

            if (name !== undefined) updateData.name = name;
            if (description !== undefined) updateData.description = description;
            if (price !== undefined) updateData.price = price;
            if (is_active !== undefined) updateData.is_active = is_active;
            if (combo_day !== undefined) updateData.combo_day = combo_day;
            if (branch_id !== undefined) updateData.branch_id = uuidToBuffer(branch_id);

            const updatedCombo = await prisma.combo.update({
                where: {
                    id: uuidToBuffer(id),
                },
                data: updateData,
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

            const formattedCombo = {
                ...updatedCombo,
                id: bufferToUuid(Buffer.from(updatedCombo.id)),
                branch_id: updatedCombo.branch_id ? bufferToUuid(Buffer.from(updatedCombo.branch_id)) : null,
            };

            res.status(200).json(formattedCombo);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
};