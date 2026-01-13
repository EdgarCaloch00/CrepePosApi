import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const TypeProductController = {
    async createTypeProduct(req: any, res: any) {
        const { name, description, branch_id} = req.body;
        try {
            const typeProduct = await prisma.type_product.findFirst({
                where: {
                   name: name,
                },
            });

            if (typeProduct) {
                return res
                    .status(409)
                    .json({ message: "El tipo de producto ya se encuentra registrado" });
            }

            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newTypeProduct = await prisma.type_product.create({
                data: {
                    id: uuidBuffer,
                    created_at: new Date(),
                    updated_at: new Date(),
                    name: name,
                    description: description,
                    branch_id: uuidToBuffer(branch_id),
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    branch_id: true,
                },
            });
            
            if (!newTypeProduct) {
                return res.status(400).json({ message: "Error al insertar tipo de producto" });
            }

            const formattedTypeProduct = {
                ...newTypeProduct,
                id: bufferToUuid(Buffer.from(newTypeProduct.id)),
                branch_id: bufferToUuid(Buffer.from(newTypeProduct.branch_id)),
            };

            res.status(200).json(formattedTypeProduct);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },

    async getTypeProducts(req: any, res: any) {
        try {
            const typeProducts = await prisma.type_product.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    created_at: true,
                    updated_at: true,
                },
            });

            const formattedTypeProducts = typeProducts.map((typeProduct) => ({
                ...typeProduct,
                id: bufferToUuid(Buffer.from(typeProduct.id)),
            }));

            res.status(200).json(formattedTypeProducts);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },

    async updateTypeProduct(req: any, res: any) {
        const { id, name, description } = req.body;

        try {
            // Verificar si existe otro tipo de producto con el mismo nombre
            const existingTypeProduct = await prisma.type_product.findFirst({
                where: {
                    name: name,
                    id: {
                        not: uuidToBuffer(id)
                    }
                },
            });

            if (existingTypeProduct) {
                return res
                    .status(409)
                    .json({ message: "Ya existe otro tipo de producto con ese nombre" });
            }

            const updatedTypeProduct = await prisma.type_product.update({
                where: {
                    id: uuidToBuffer(id)
                },
                data: {
                    name,
                    description,
                    updated_at: new Date()
                },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    updated_at: true
                }
            });

            const formattedTypeProduct = {
                ...updatedTypeProduct,
                id: bufferToUuid(Buffer.from(updatedTypeProduct.id))
            };

            res.status(200).json(formattedTypeProduct);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },

    async deleteTypeProduct(req: any, res: any) {
        const { id } = req.params;

        try {
            // Verificar si el tipo de producto existe
            const typeProduct = await prisma.type_product.findUnique({
                where: {
                    id: uuidToBuffer(id)
                }
            });

            if (!typeProduct) {
                return res.status(404).json({ message: "Tipo de producto no encontrado" });
            }

            await prisma.type_product.delete({
                where: {
                    id: uuidToBuffer(id)
                }
            });

            res.status(200).json({ message: "Tipo de producto eliminado exitosamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    }
};

