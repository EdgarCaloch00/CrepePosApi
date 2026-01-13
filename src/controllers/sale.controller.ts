import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

export const SaleController = {
    async createSale(req: any, res: any) {
        const {total, payment_method, user_id} = req.body;
        try {
            const uuid = uuidv4();
            const saleBufferId = uuidToBuffer(uuid);
            const newSale = await prisma.sale.create({
                data: {
                    id: saleBufferId,
                    created_at: new Date(),
                    updated_at: new Date(),
                    total: total,
                    payment_method: payment_method,
                    user_id: uuidToBuffer(user_id),
                },
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    total: true,
                    user_id: true,
                },
            });

            if (!newSale) {
                return res.status(400).json({ message: "Error al insertar venta" });
            }

            const formattedSale = {
                ...newSale,
                id: bufferToUuid(Buffer.from(newSale.id)),
                user_id: bufferToUuid(Buffer.from(newSale.user_id)),
            };

            res.status(200).json(formattedSale);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllSales(req: any, res: any) {
        try {
            const sales = await prisma.sale.findMany({
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    total: true,
                    payment_method: true,
                    user_id: true,
                    user:{
                        select:{
                            name:true,
                        }
                    },
                    sale_detail:{
                        select:{
                            id: true,
                            created_at: true,
                            updated_at: true,
                            amount: true,
                            subtotal: true,
                            sale_id: true,
                            product_id: true,
                            combo_id: true,
                            note: true,
                            product: {
                                select: {
                                    name: true,
                                    price: true,
                                }
                            },
                            combo: {
                                select: {
                                    name: true,
                                    price: true,
                                }
                            }
                        }
                    }
                },
            });
            
            const formattedSales = sales.map((sale) => ({
                ...sale,
                id: bufferToUuid(Buffer.from(sale.id)),
                user_id: bufferToUuid(Buffer.from(sale.user_id)),
                sale_detail: sale.sale_detail.map((detail: any) => ({
                    ...detail,
                    id: bufferToUuid(Buffer.from(detail.id)),
                    sale_id: bufferToUuid(Buffer.from(detail.sale_id)),
                    product_id: detail.product_id ? bufferToUuid(Buffer.from(detail.product_id)) : null,
                    combo_id: detail.combo_id ? bufferToUuid(Buffer.from(detail.combo_id)) : null,
                }))
            }));

            res.status(200).json(formattedSales);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async updateSale(req: any, res: any) {
        const {id, total, payment_method, user_id } = req.body;
        
        try {
            const updatedSale = await prisma.sale.update({
                where: {
                    id: uuidToBuffer(id)
                },
                data: {
                    updated_at: new Date(),
                    total: total,
                    payment_method: payment_method,
                    user_id: user_id ? uuidToBuffer(user_id) : undefined,
                },
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    total: true,
                    payment_method: true,
                    user_id: true,
                }
            });

            if (!updatedSale) {
                return res.status(404).json({ message: "Venta no encontrada" });
            }

            const formattedSale = {
                ...updatedSale,
                id: bufferToUuid(Buffer.from(updatedSale.id)),
                user_id: bufferToUuid(Buffer.from(updatedSale.user_id)),
            };

            res.status(200).json(formattedSale);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async deleteSale(req: any, res: any) {
        const { id } = req.body;
        
        try {
            // Usar una transacción para eliminar tanto la venta como sus detalles
            const deletedSale = await prisma.$transaction(async (tx) => {
                // Primero eliminamos los detalles de venta
                await tx.sale_detail.deleteMany({
                    where: {
                        sale_id: uuidToBuffer(id)
                    }
                });

                // Luego eliminamos la venta
                const deletedSale = await tx.sale.delete({
                    where: {
                        id: uuidToBuffer(id)
                    }
                });

                return deletedSale;
            });

            if (!deletedSale) {
                return res.status(404).json({ message: "Venta no encontrada" });
            }

            res.status(200).json({ message: "Venta y sus detalles eliminados correctamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async getSalesByDateAndUser(req: any, res: any) {
        const { date, user_id } = req.query;
        
        try {
            // Validate date format
            if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
                return res.status(400).json({ 
                    message: "Formato de fecha inválido. Use YYYY-MM-DD (ejemplo: 2023-10-18)" 
                });
            }

            // Crear fechas en la zona horaria de México
            const startDate = new Date(`${date}T00:00:00-06:00`);
            const endDate = new Date(`${date}T23:59:59.999-06:00`);

            console.log('Buscando ventas entre:', startDate.toISOString(), 'y', endDate.toISOString());

            const sales = await prisma.sale.findMany({
                where: {
                    created_at: {
                        gte: startDate,
                        lte: endDate
                    },
                    user_id: uuidToBuffer(user_id)
                },
                orderBy: {
                    created_at: 'asc'
                },
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    total: true,
                    payment_method: true,
                    user_id: true,
                    user: {
                        select: {
                            name: true
                        }
                    }
                }
            });

            // Calculate totals by payment method
            const totals = sales.reduce((acc: any, sale) => {
                if (!acc[sale.payment_method]) {
                    acc[sale.payment_method] = 0;
                }
                acc[sale.payment_method] += Number(sale.total);
                return acc;
            }, {});

            const formattedSales = sales.map((sale) => ({
                ...sale,
                id: bufferToUuid(Buffer.from(sale.id)),
                user_id: bufferToUuid(Buffer.from(sale.user_id)),
            }));

            res.status(200).json({
                sales: formattedSales,
                summary: {
                    totalSales: sales.length,
                    paymentMethodTotals: totals,
                    grandTotal: Object.values(totals).reduce((a: any, b: any) => a + b, 0)
                }
            });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
};