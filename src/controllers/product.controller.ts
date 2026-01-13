import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";
import { BranchController } from './branch.controller';

export const ProductController = {
    async createProduct(req: any, res: any) {
        const { name, price, image, type_id, branch_id } = req.body;
        try {
            const product = await prisma.product.findFirst({
                where: {
                   name: name,
                   branch_id: uuidToBuffer(branch_id),
                },
            });

            if (product) {
                return res
                    .status(409)
                    .json({ message: "El producto ya se encuentra registrado" });
            }

            const typeProduct = await prisma.type_product.findUnique({
                where: {
                    id: uuidToBuffer(type_id),
                },
            });

            if (!typeProduct) {
                return res
                    .status(404)
                    .json({ message: "El tipo de producto no existe" });
            }

            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newProduct = await prisma.product.create({
                data: {
                    id: uuidBuffer,
                    created_at: new Date(),
                    updated_at: new Date(),
                    name: name,
                    price: price,
                    image: image,
                    is_active: true,
                    type_id: uuidToBuffer(type_id),
                    branch_id: uuidToBuffer(branch_id),
                },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    type_id: true,
                    branch_id: true,
                },
            });
            
            if (!newProduct) {
                return res.status(400).json({ message: "Error al insertar producto" });
            }

            const formattedProduct = {
                ...newProduct,
                id: bufferToUuid(Buffer.from(newProduct.id)),
                type_id: bufferToUuid(Buffer.from(newProduct.type_id)),
                branch_id: bufferToUuid(Buffer.from(newProduct.branch_id)),
            };

            res.status(200).json(formattedProduct);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getProducts(req: any, res: any) {
        try {
            // Obtener información del usuario desde el token
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
            // Si es super_admin u otro rol, no aplicar filtro de branch (mostrar todos)

            const products = await prisma.product.findMany({
                where: whereClause,
                select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                    type_id: true,
                    branch_id: true,
                    is_active: true,
                    created_at: true,
                    updated_at: true,
                    type_product: {
                        select: {
                            name: true,
                        },
                    },
                },
            });

            const formattedProducts = products.map((product) => ({
                ...product,
                id: bufferToUuid(Buffer.from(product.id)),
                type_id: bufferToUuid(Buffer.from(product.type_id)),
                branch_id: bufferToUuid(Buffer.from(product.branch_id)),
            }));

            res.status(200).json(formattedProducts);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async updateProduct(req: any, res: any) {
        const { id, name, price, image, type_id, is_active } = req.body;
        
        try {
            // Verificar si el producto existe
            const existingProduct = await prisma.product.findUnique({
                where: {
                    id: uuidToBuffer(id)
                }
            });

            if (!existingProduct) {
                return res.status(404).json({ message: "Producto no encontrado" });
            }

            // Si se proporciona type_id, verificar que existe
            if (type_id) {
                const typeProduct = await prisma.type_product.findUnique({
                    where: {
                        id: uuidToBuffer(type_id),
                    },
                });

                if (!typeProduct) {
                    return res.status(404).json({ message: "El tipo de producto no existe" });
                }
            }

            // Actualizar el producto
            const updatedProduct = await prisma.product.update({
                where: {
                    id: uuidToBuffer(id)
                },
                data: {
                    name: name,
                    price: price,
                    image: image,
                    type_id: type_id ? uuidToBuffer(type_id) : undefined,
                    is_active: is_active,
                    updated_at: new Date()
                },
                select: {
                    id: true,
                    name: true,
                    price: true,
                    image: true,
                    type_id: true,
                    is_active: true,
                    updated_at: true
                }
            });

            const formattedProduct = {
                ...updatedProduct,
                id: bufferToUuid(Buffer.from(updatedProduct.id)),
                type_id: bufferToUuid(Buffer.from(updatedProduct.type_id))
            };

            res.status(200).json(formattedProduct);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async deleteProduct(req: any, res: any) {
        const { id } = req.body;
        
        try {
            // Verificar si el producto existe
            const existingProduct = await prisma.product.findUnique({
                where: {
                    id: uuidToBuffer(id)
                }
            });

            if (!existingProduct) {
                return res.status(404).json({ message: "Producto no encontrado" });
            }

            // Eliminar los products_ingredient asociados y luego el producto en una transacción
            await prisma.$transaction([
                prisma.product_ingredient.deleteMany({
                    where: {
                        product_id: uuidToBuffer(id)
                    }
                }),
                prisma.product.delete({
                    where: {
                        id: uuidToBuffer(id)
                    }
                })
            ]);

            res.status(200).json({ message: "Producto y sus ingredientes asociados eliminados exitosamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    }
};