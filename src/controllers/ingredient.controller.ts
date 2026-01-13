import prisma from "../lib/prisma";
import { v4 as uuidv4 } from "uuid";
import { bufferToUuid, uuidToBuffer } from "../utils/common";

// Constante para la cantidad predefinida de la mezcla de harina
const VIRTUAL_INGREDIENT_DEFAULT_AMOUNT = 33;

// Helper function para convertir fecha de México Central a UTC para comparación
const mexicoToUTC = (mexicoDate: Date): Date => {
    // México Central es UTC-6 (CST) o UTC-5 (CDT durante horario de verano)
    // Para simplificar, usaremos UTC-6 como referencia
    const utcDate = new Date(mexicoDate.getTime() + (6 * 60 * 60 * 1000));
    return utcDate;
};

// Helper function para verificar si una venta ocurrió después de la última actualización del ingrediente
const isSaleAfterIngredientUpdate = (saleDate: Date, ingredientUpdatedAt: Date | null): boolean => {
    if (!ingredientUpdatedAt) return true; // Si no hay fecha de actualización, considerar todas las ventas
    
    // Las fechas de la BD están en UTC, así que comparamos directamente
    return saleDate > ingredientUpdatedAt;
};

export const IngredientController = {
    async createIngredient(req: any, res: any) {
        const {name, current_stock, min_stock, unit_measurement, cost_unit, branch_id } = req.body;
        try {
            const ingredient = await prisma.ingredient.findFirst({
                where: {
                   name: name,
                   branch_id: uuidToBuffer(branch_id),
                },
            });

            if (ingredient) {
                return res
                    .status(409)
                    .json({ message: "El ingrediente ya se encuentra registrado" });
            }

            const uuid = uuidv4();
            const uuidBuffer = uuidToBuffer(uuid);
            const newIngredient = await prisma.ingredient.create({
                data: {
                    id: uuidBuffer,
                    created_at: new Date(),
                    updated_at: new Date(),
                    name: name,
                    current_stock: current_stock,
                    min_stock: min_stock,
                    unit_measurement: unit_measurement,
                    cost_unit: cost_unit,
                    branch_id: uuidToBuffer(branch_id),
                },
                select: {
                    id: true,
                    updated_at: true,
                    current_stock: true,
                    name: true,
                    min_stock: true,
                    unit_measurement: true,
                    cost_unit: true,
                    branch_id: true,
                },
            });
            
            if (!newIngredient) {
                return res.status(400).json({ message: "Error al insertar ingrediente" });
            }

            const formattedIngredient = {
                ...newIngredient,
                id: bufferToUuid(Buffer.from(newIngredient.id)),
                branch_id: bufferToUuid(Buffer.from(newIngredient.branch_id)),
            };

            res.status(200).json(formattedIngredient);         
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async getAllIngredients(req: any, res: any) {
        try {
            console.log('\n=== INICIANDO CÁLCULO DE INGREDIENTES ===');
            
            // Obtener todos los ingredientes básicos
            const ingredients = await prisma.ingredient.findMany({
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    name: true,
                    current_stock: true,
                    min_stock: true,
                    unit_measurement: true,
                    cost_unit: true,
                    branch_id: true,
                },
            });

            // Obtener relaciones product_ingredient para calcular consumo
            const productIngredients = await prisma.product_ingredient.findMany({
                select: {
                    ingredient_id: true,
                    product_id: true,
                    amount: true,
                    product: {
                        select: {
                            name: true,
                            branch_id: true
                        }
                    }
                }
            });

            // Obtener todas las ventas de productos con sus detalles (incluyendo fecha de venta)
            const productSales = await prisma.sale_detail.findMany({
                where: {
                    product_id: { not: null }
                },
                select: {
                    amount: true,
                    product_id: true,
                    sale: {
                        select: {
                            created_at: true, // Fecha de la venta en UTC
                            user: {
                                select: {
                                    user_branch: {
                                        select: {
                                            branch_id: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Obtener todas las ventas de combos (incluyendo fecha de venta)
            const comboSales = await prisma.sale_detail.findMany({
                where: {
                    combo_id: { not: null }
                },
                select: {
                    amount: true,
                    note: true,
                    combo_id: true,
                    combo: {
                        select: {
                            name: true,
                            combo_detail: {
                                select: {
                                    amount: true,
                                    type_product: {
                                        select: {
                                            name: true,
                                            product: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                    branch_id: true,
                                                    product_ingredient: {
                                                        select: {
                                                            amount: true,
                                                            ingredient_id: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    sale: {
                        select: {
                            created_at: true, // Fecha de la venta en UTC
                            user: {
                                select: {
                                    user_branch: {
                                        select: {
                                            branch_id: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            // Crear mapas para optimizar búsquedas
            const productIngredientMap = new Map();
            productIngredients.forEach(pi => {
                const key = `${bufferToUuid(Buffer.from(pi.ingredient_id))}-${bufferToUuid(Buffer.from(pi.product_id))}`;
                productIngredientMap.set(key, pi);
            });

            const formattedIngredients = ingredients.map((ingredient) => {
                let totalConsumed = 0;
                const ingredientId = bufferToUuid(Buffer.from(ingredient.id));
                const ingredientBranchId = ingredient.branch_id ? bufferToUuid(Buffer.from(ingredient.branch_id)) : null;
                const ingredientUpdatedAt = ingredient.updated_at;

                console.log(`\n=== Calculando consumo para ingrediente: ${ingredient.name} ===`);
                console.log(`Última actualización del ingrediente: ${ingredientUpdatedAt} (UTC)`);

                // Calcular consumo directo de productos
                productSales.forEach(sale => {
                    if (!sale.product_id) return;
                    
                    // Solo considerar ventas posteriores a la última actualización del ingrediente
                    if (!isSaleAfterIngredientUpdate(sale.sale.created_at, ingredientUpdatedAt)) {
                        return; // Saltar esta venta porque ocurrió antes de la última actualización
                    }
                    
                    const productId = bufferToUuid(Buffer.from(sale.product_id));
                    const key = `${ingredientId}-${productId}`;
                    const productIngredient = productIngredientMap.get(key);
                    
                    if (productIngredient) {
                        // Verificar que la venta sea de la misma sucursal del ingrediente
                        const userBranches = sale.sale.user.user_branch;
                        const isFromSameBranch = ingredientBranchId && userBranches.some(ub => 
                            bufferToUuid(Buffer.from(ub.branch_id)) === ingredientBranchId
                        );

                        // También verificar que el producto sea de la misma sucursal
                        const productBranchId = productIngredient.product.branch_id ? 
                            bufferToUuid(Buffer.from(productIngredient.product.branch_id)) : null;
                        
                        if (isFromSameBranch && productBranchId === ingredientBranchId) {
                            const consumption = sale.amount * productIngredient.amount;
                            console.log(`Venta de producto: ${productIngredient.product.name} - Fecha: ${sale.sale.created_at} - Cantidad: ${sale.amount} x ${productIngredient.amount} = ${consumption}`);
                            totalConsumed += consumption;
                        }
                    }
                });

                // Calcular consumo de combos basado en combo_detail
                comboSales.forEach(comboSale => {
                    // Solo considerar ventas posteriores a la última actualización del ingrediente
                    if (!isSaleAfterIngredientUpdate(comboSale.sale.created_at, ingredientUpdatedAt)) {
                        return; // Saltar esta venta porque ocurrió antes de la última actualización
                    }
                    
                    const userBranches = comboSale.sale.user.user_branch;
                    const isFromSameBranch = ingredientBranchId && userBranches.some(ub => 
                        bufferToUuid(Buffer.from(ub.branch_id)) === ingredientBranchId
                    );

                    if (isFromSameBranch && comboSale.combo && comboSale.combo.combo_detail && comboSale.note) {
                        // NUEVO ENFOQUE: Usar la nota para identificar productos específicos y calcular directamente
                        // En lugar de iterar por todos los combo_detail, buscar directamente los productos mencionados
                        
                        const noteProducts = [];
                        // Obtener todos los productos mencionados en la nota de todos los combo_detail
                        comboSale.combo.combo_detail.forEach(comboDetail => {
                            comboDetail.type_product.product.forEach(product => {
                                if (comboSale.note && comboSale.note.toLowerCase().includes(product.name.toLowerCase())) {
                                    const productBranchId = product.branch_id ? 
                                        bufferToUuid(Buffer.from(product.branch_id)) : null;
                                    
                                    if (productBranchId === ingredientBranchId) {
                                        noteProducts.push({
                                            name: product.name,
                                            comboDetailAmount: comboDetail.amount,
                                            productIngredients: product.product_ingredient
                                        });
                                    }
                                }
                            });
                        });
                        
                        // Procesar cada producto único encontrado en la nota
                        const processedProducts = new Set();
                        noteProducts.forEach(noteProduct => {
                            // Evitar procesar el mismo producto múltiples veces
                            if (!processedProducts.has(noteProduct.name)) {
                                processedProducts.add(noteProduct.name);
                                
                                // Procesar los ingredientes de este producto
                                noteProduct.productIngredients.forEach(productIngredient => {
                                    const piIngredientId = bufferToUuid(Buffer.from(productIngredient.ingredient_id));
                                    
                                    if (piIngredientId === ingredientId) {
                                        // Calcular consumo: cantidad_combo * cantidad_en_combo * cantidad_ingrediente_por_producto
                                        const consumption = comboSale.amount * noteProduct.comboDetailAmount * productIngredient.amount;
                                        console.log(`Venta de combo: ${comboSale.combo.name} -> ${noteProduct.name} - Cantidad: ${comboSale.amount} x ${noteProduct.comboDetailAmount} x ${productIngredient.amount} = ${consumption}`);
                                        totalConsumed += consumption;
                                    }
                                });
                            }
                        });
                    }
                });

                // Calcular stock disponible
                const availableStock = Math.max(0, ingredient.current_stock - totalConsumed);
                
                console.log(`Stock original: ${ingredient.current_stock}`);
                console.log(`Total consumido (solo ventas posteriores a ${ingredientUpdatedAt}): ${totalConsumed}`);
                console.log(`Stock disponible: ${availableStock}`);
                console.log(`=== Fin cálculo para ${ingredient.name} ===\n`);

                return {
                    ...ingredient,
                    id: ingredientId,
                    branch_id: ingredientBranchId,
                    current_stock: availableStock,
                    consumed_stock: totalConsumed,
                    available_stock: availableStock,
                    is_low_stock: availableStock <= ingredient.min_stock,
                    last_updated: ingredientUpdatedAt // Incluir la fecha de última actualización para referencia
                };
            });

            res.status(200).json(formattedIngredients);
        } catch (error) {
            console.error('Error in getAllIngredients:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async getIngredientsByBranch(req: any, res: any) {
        const { branch_id } = req.params;
        
        try {
            const branchBuffer = uuidToBuffer(branch_id);
            
            // Obtener ingredientes de la sucursal específica
            const ingredients = await prisma.ingredient.findMany({
                where: {
                    branch_id: branchBuffer
                },
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    name: true,
                    current_stock: true,
                    min_stock: true,
                    unit_measurement: true,
                    cost_unit: true,
                    branch_id: true,
                    product_ingredient: {
                        select: {
                            amount: true,
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    sale_detail: {
                                        select: {
                                            amount: true,
                                            sale: {
                                                select: {
                                                    created_at: true,
                                                    user: {
                                                        select: {
                                                            user_branch: {
                                                                where: {
                                                                    branch_id: branchBuffer
                                                                },
                                                                select: {
                                                                    branch_id: true
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
            });

            // Obtener ventas de combos de usuarios de esta sucursal
            const comboSales = await prisma.sale_detail.findMany({
                where: {
                    combo_id: {
                        not: null
                    },
                    sale: {
                        user: {
                            user_branch: {
                                some: {
                                    branch_id: branchBuffer
                                }
                            }
                        }
                    }
                },
                select: {
                    amount: true,
                    note: true,
                    combo_id: true,
                    combo: {
                        select: {
                            name: true,
                            combo_detail: {
                                select: {
                                    amount: true,
                                    type_product: {
                                        select: {
                                            name: true,
                                            product: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                    branch_id: true,
                                                    product_ingredient: {
                                                        select: {
                                                            amount: true,
                                                            ingredient_id: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    sale: {
                        select: {
                            created_at: true // Fecha de la venta para filtrar
                        }
                    }
                }
            });



            const formattedIngredients = ingredients.map((ingredient) => {
                let totalConsumed = 0;
                const ingredientId = Buffer.from(ingredient.id);
                const ingredientUpdatedAt = ingredient.updated_at;

                // Calcular consumo directo de productos
                for (const productIngredient of ingredient.product_ingredient) {
                    const product = productIngredient.product;
                    
                    for (const saleDetail of product.sale_detail) {
                        // Solo considerar ventas posteriores a la última actualización del ingrediente
                        if (!isSaleAfterIngredientUpdate(saleDetail.sale.created_at, ingredientUpdatedAt)) {
                            continue; // Saltar esta venta
                        }
                        
                        // Solo considerar ventas de usuarios de esta sucursal
                        if (saleDetail.sale.user.user_branch.length > 0) {
                            totalConsumed += saleDetail.amount * productIngredient.amount;
                        }
                    }
                }

                // Calcular consumo de combos basado en combo_detail
                for (const comboSale of comboSales) {
                    // Solo considerar ventas posteriores a la última actualización del ingrediente
                    if (!isSaleAfterIngredientUpdate(comboSale.sale.created_at, ingredientUpdatedAt)) {
                        continue; // Saltar esta venta
                    }
                    
                    if (comboSale.combo && comboSale.combo.combo_detail && comboSale.note) {
                        // NUEVO ENFOQUE: Usar la nota para identificar productos específicos y calcular directamente
                        const noteProducts = [];
                        const branchIdStr = bufferToUuid(Buffer.from(branchBuffer));
                        
                        // Obtener todos los productos mencionados en la nota de todos los combo_detail
                        comboSale.combo.combo_detail.forEach(comboDetail => {
                            comboDetail.type_product.product.forEach(product => {
                                if (comboSale.note && comboSale.note.toLowerCase().includes(product.name.toLowerCase())) {
                                    const productBranchId = product.branch_id ? 
                                        bufferToUuid(Buffer.from(product.branch_id)) : null;
                                    
                                    if (productBranchId === branchIdStr) {
                                        noteProducts.push({
                                            name: product.name,
                                            comboDetailAmount: comboDetail.amount,
                                            productIngredients: product.product_ingredient
                                        });
                                    }
                                }
                            });
                        });
                        
                        // Procesar cada producto único encontrado en la nota
                        const processedProducts = new Set();
                        noteProducts.forEach(noteProduct => {
                            // Evitar procesar el mismo producto múltiples veces
                            if (!processedProducts.has(noteProduct.name)) {
                                processedProducts.add(noteProduct.name);
                                
                                // Procesar los ingredientes de este producto
                                noteProduct.productIngredients.forEach(productIngredient => {
                                    // Verificar que sea el ingrediente correcto
                                    if (Buffer.compare(Buffer.from(productIngredient.ingredient_id), ingredientId) === 0) {
                                        // Calcular consumo: cantidad_combo * cantidad_en_combo * cantidad_ingrediente_por_producto
                                        const consumption = comboSale.amount * noteProduct.comboDetailAmount * productIngredient.amount;
                                        totalConsumed += consumption;
                                    }
                                });
                            }
                        });
                    }
                }

                // Calcular stock disponible
                const availableStock = Math.max(0, ingredient.current_stock - totalConsumed);

                return {
                    ...ingredient,
                    id: bufferToUuid(Buffer.from(ingredient.id)),
                    branch_id: bufferToUuid(Buffer.from(ingredient.branch_id)),
                    current_stock: ingredient.current_stock,
                    consumed_stock: totalConsumed,
                    available_stock: availableStock,
                    is_low_stock: availableStock <= ingredient.min_stock,
                    last_updated: ingredientUpdatedAt
                };
            });

            res.status(200).json(formattedIngredients);
        } catch (error) {
            console.error('Error in getIngredientsByBranch:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async getIngredientConsumptionReport(req: any, res: any) {
        const { ingredient_id, start_date, end_date } = req.query;
        
        try {
            const ingredientBuffer = uuidToBuffer(ingredient_id);
            
            // Validar fechas
            const startDate = start_date ? new Date(start_date as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 días atrás por defecto
            const endDate = end_date ? new Date(end_date as string) : new Date();
            
            // Obtener el ingrediente
            const ingredient = await prisma.ingredient.findUnique({
                where: { id: ingredientBuffer },
                select: {
                    id: true,
                    name: true,
                    current_stock: true,
                    unit_measurement: true,
                    branch_id: true
                }
            });
            
            if (!ingredient) {
                return res.status(404).json({ message: "Ingrediente no encontrado" });
            }
            
            const branchBuffer = ingredient.branch_id ? Buffer.from(ingredient.branch_id) : null;
            
            // Obtener consumo por productos directos
            const productConsumption = await prisma.sale_detail.findMany({
                where: {
                    product: {
                        product_ingredient: {
                            some: {
                                ingredient_id: ingredientBuffer
                            }
                        },
                        branch_id: branchBuffer
                    },
                    sale: {
                        created_at: {
                            gte: startDate,
                            lte: endDate
                        },
                        user: {
                            user_branch: branchBuffer ? {
                                some: {
                                    branch_id: branchBuffer
                                }
                            } : undefined
                        }
                    }
                },
                select: {
                    amount: true,
                    created_at: true,
                    product: {
                        select: {
                            name: true,
                            product_ingredient: {
                                where: {
                                    ingredient_id: ingredientBuffer
                                },
                                select: {
                                    amount: true
                                }
                            }
                        }
                    },
                    sale: {
                        select: {
                            created_at: true,
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            
            // Obtener consumo por combos
            const comboConsumption = await prisma.sale_detail.findMany({
                where: {
                    combo_id: { not: null },
                    sale: {
                        created_at: {
                            gte: startDate,
                            lte: endDate
                        },
                        user: {
                            user_branch: branchBuffer ? {
                                some: {
                                    branch_id: branchBuffer
                                }
                            } : undefined
                        }
                    }
                },
                select: {
                    amount: true,
                    note: true,
                    created_at: true,
                    combo: {
                        select: {
                            name: true,
                            combo_detail: {
                                select: {
                                    amount: true,
                                    type_product: {
                                        select: {
                                            name: true,
                                            product: {
                                                select: {
                                                    id: true,
                                                    name: true,
                                                    branch_id: true,
                                                    product_ingredient: {
                                                        where: {
                                                            ingredient_id: ingredientBuffer
                                                        },
                                                        select: {
                                                            amount: true,
                                                            ingredient_id: true
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    sale: {
                        select: {
                            created_at: true,
                            user: {
                                select: {
                                    name: true
                                }
                            }
                        }
                    }
                }
            });
            

            
            // Procesar consumo de productos directos
            const directConsumption = productConsumption.map(sale => {
                const consumedAmount = sale.amount * (sale.product?.product_ingredient[0]?.amount || 0);
                return {
                    date: sale.sale.created_at,
                    type: 'product',
                    item_name: sale.product?.name || 'Producto desconocido',
                    quantity_sold: sale.amount,
                    ingredient_consumed: consumedAmount,
                    user: sale.sale.user.name
                };
            });
            
            // Procesar consumo de combos basado en combo_detail
            const comboConsumptionProcessed = [];
            for (const comboSale of comboConsumption) {
                if (comboSale.combo && comboSale.combo.combo_detail && comboSale.note) {
                    // NUEVO ENFOQUE: Usar la nota para identificar productos específicos y calcular directamente
                    const noteProducts = [];
                    const targetBranchId = branchBuffer ? bufferToUuid(Buffer.from(branchBuffer)) : null;
                    
                    // Obtener todos los productos mencionados en la nota de todos los combo_detail
                    comboSale.combo.combo_detail.forEach(comboDetail => {
                        comboDetail.type_product.product.forEach(product => {
                            if (comboSale.note && comboSale.note.toLowerCase().includes(product.name.toLowerCase())) {
                                const productBranchId = product.branch_id ? 
                                    bufferToUuid(Buffer.from(product.branch_id)) : null;
                                
                                // Verificar que el producto sea de la misma sucursal (o sin filtro de sucursal)
                                if (!branchBuffer || productBranchId === targetBranchId) {
                                    noteProducts.push({
                                        name: product.name,
                                        comboDetailAmount: comboDetail.amount,
                                        productIngredients: product.product_ingredient
                                    });
                                }
                            }
                        });
                    });
                    
                    // Procesar cada producto único encontrado en la nota
                    const processedProducts = new Set();
                    noteProducts.forEach(noteProduct => {
                        // Evitar procesar el mismo producto múltiples veces
                        if (!processedProducts.has(noteProduct.name)) {
                            processedProducts.add(noteProduct.name);
                            
                            // Procesar los ingredientes de este producto (ya filtrado por ingredient_id en la consulta)
                            noteProduct.productIngredients.forEach(productIngredient => {
                                // Calcular consumo: cantidad_combo * cantidad_en_combo * cantidad_ingrediente_por_producto
                                const consumedAmount = comboSale.amount * noteProduct.comboDetailAmount * productIngredient.amount;
                                comboConsumptionProcessed.push({
                                    date: comboSale.sale.created_at,
                                    type: 'combo',
                                    item_name: `${comboSale.combo.name} -> ${noteProduct.name} (único)`,
                                    quantity_sold: comboSale.amount,
                                    combo_detail_amount: noteProduct.comboDetailAmount,
                                    ingredient_per_product: productIngredient.amount,
                                    ingredient_consumed: consumedAmount,
                                    user: comboSale.sale.user.name,
                                    note: comboSale.note
                                });
                            });
                        }
                    });
                }
            }
            
            // Combinar y ordenar por fecha
            const allConsumption = [...directConsumption, ...comboConsumptionProcessed]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            // Calcular totales
            const totalConsumed = allConsumption.reduce((sum, item) => sum + item.ingredient_consumed, 0);
            const availableStock = Math.max(0, ingredient.current_stock - totalConsumed);
            
            const report = {
                ingredient: {
                    id: bufferToUuid(Buffer.from(ingredient.id)),
                    name: ingredient.name,
                    current_stock: ingredient.current_stock,
                    unit_measurement: ingredient.unit_measurement
                },
                period: {
                    start_date: startDate,
                    end_date: endDate
                },
                summary: {
                    total_consumed: totalConsumed,
                    available_stock: availableStock,
                    consumption_by_type: {
                        direct_products: directConsumption.reduce((sum, item) => sum + item.ingredient_consumed, 0),
                        combos: comboConsumptionProcessed.reduce((sum, item) => sum + item.ingredient_consumed, 0)
                    }
                },
                consumption_details: allConsumption
            };
            
            res.status(200).json(report);
        } catch (error) {
            console.error('Error in getIngredientConsumptionReport:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async updateIngredient(req: any, res: any) {
        const {id, name, current_stock, min_stock, unit_measurement, cost_unit } = req.body;
        
        try {
            const uuidBuffer = uuidToBuffer(id);
            
            const ingredient = await prisma.ingredient.findFirst({
                where: {
                    id: uuidBuffer,
                },
            });

            if (!ingredient) {
                return res.status(404).json({ message: "Ingrediente no encontrado" });
            }

            const updatedIngredient = await prisma.ingredient.update({
                where: {
                    id: uuidBuffer,
                },
                data: {
                    name,
                    current_stock,
                    min_stock,
                    unit_measurement,
                    cost_unit,
                    updated_at: new Date(),
                },
                select: {
                    id: true,
                    updated_at: true,
                    current_stock: true,
                    name: true,
                    min_stock: true,
                    unit_measurement: true,
                    cost_unit: true,
                },
            });

            const formattedIngredient = {
                ...updatedIngredient,
                id: bufferToUuid(Buffer.from(updatedIngredient.id)),
            };

            res.status(200).json(formattedIngredient);
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
    async resetIngredientConsumption(req: any, res: any) {
        const { id } = req.body;
        
        try {
            const uuidBuffer = uuidToBuffer(id);
            
            const ingredient = await prisma.ingredient.findFirst({
                where: {
                    id: uuidBuffer,
                },
            });

            if (!ingredient) {
                return res.status(404).json({ message: "Ingrediente no encontrado" });
            }

            // Actualizar solo el campo updated_at para resetear el punto de cálculo de consumo
            const updatedIngredient = await prisma.ingredient.update({
                where: {
                    id: uuidBuffer,
                },
                data: {
                    updated_at: new Date(), // Actualizar a la fecha/hora actual
                },
                select: {
                    id: true,
                    name: true,
                    updated_at: true,
                    current_stock: true,
                },
            });

            const formattedIngredient = {
                ...updatedIngredient,
                id: bufferToUuid(Buffer.from(updatedIngredient.id)),
            };

            res.status(200).json({ 
                message: "Punto de cálculo de consumo resetado correctamente",
                ingredient: formattedIngredient
            });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    async getInventorySummary(req: any, res: any) {
        const { branch_id } = req.query;
        
        try {
            const branchBuffer = branch_id ? uuidToBuffer(branch_id as string) : null;
            
            // Obtener ingredientes (filtrados por sucursal si se especifica)
            const ingredients = await prisma.ingredient.findMany({
                where: branchBuffer ? { branch_id: branchBuffer } : {},
                select: {
                    id: true,
                    name: true,
                    current_stock: true,
                    min_stock: true,
                    unit_measurement: true,
                    updated_at: true,
                    branch_id: true,
                }
            });

            // Obtener estadísticas de ventas desde la última actualización de cada ingrediente
            const summaryData = await Promise.all(ingredients.map(async (ingredient) => {
                const ingredientBuffer = Buffer.from(ingredient.id);
                const ingredientBranchBuffer = ingredient.branch_id ? Buffer.from(ingredient.branch_id) : null;
                
                // Contar ventas de productos desde la última actualización
                const productSalesCount = await prisma.sale_detail.count({
                    where: {
                        product: {
                            product_ingredient: {
                                some: {
                                    ingredient_id: ingredientBuffer
                                }
                            },
                            branch_id: ingredientBranchBuffer
                        },
                        sale: {
                            created_at: ingredient.updated_at ? {
                                gt: ingredient.updated_at
                            } : undefined,
                            user: ingredientBranchBuffer ? {
                                user_branch: {
                                    some: {
                                        branch_id: ingredientBranchBuffer
                                    }
                                }
                            } : undefined
                        }
                    }
                });

                // Contar ventas de combos desde la última actualización
                const comboSalesCount = await prisma.sale_detail.count({
                    where: {
                        combo_id: { not: null },
                        note: { not: null },
                        sale: {
                            created_at: ingredient.updated_at ? {
                                gt: ingredient.updated_at
                            } : undefined,
                            user: ingredientBranchBuffer ? {
                                user_branch: {
                                    some: {
                                        branch_id: ingredientBranchBuffer
                                    }
                                }
                            } : undefined
                        }
                    }
                });

                const now = new Date();
                const daysSinceUpdate = ingredient.updated_at ? 
                    Math.floor((now.getTime() - ingredient.updated_at.getTime()) / (1000 * 60 * 60 * 24)) : null;

                return {
                    id: bufferToUuid(Buffer.from(ingredient.id)),
                    name: ingredient.name,
                    current_stock: ingredient.current_stock,
                    min_stock: ingredient.min_stock,
                    unit_measurement: ingredient.unit_measurement,
                    branch_id: ingredient.branch_id ? bufferToUuid(Buffer.from(ingredient.branch_id)) : null,
                    last_updated: ingredient.updated_at,
                    days_since_update: daysSinceUpdate,
                    sales_since_update: {
                        product_sales: productSalesCount,
                        combo_sales: comboSalesCount,
                        total_sales: productSalesCount + comboSalesCount
                    },
                    needs_update: daysSinceUpdate !== null && (daysSinceUpdate > 7 || productSalesCount + comboSalesCount > 50)
                };
            }));

            // Estadísticas generales
            const totalIngredients = summaryData.length;
            const ingredientsNeedingUpdate = summaryData.filter(item => item.needs_update).length;
            const lowStockIngredients = summaryData.filter(item => item.current_stock <= item.min_stock).length;
            const neverUpdatedIngredients = summaryData.filter(item => !item.last_updated).length;

            const summary = {
                overview: {
                    total_ingredients: totalIngredients,
                    ingredients_needing_update: ingredientsNeedingUpdate,
                    low_stock_ingredients: lowStockIngredients,
                    never_updated_ingredients: neverUpdatedIngredients
                },
                ingredients: summaryData.sort((a, b) => {
                    // Ordenar por ingredientes que necesitan actualización primero
                    if (a.needs_update && !b.needs_update) return -1;
                    if (!a.needs_update && b.needs_update) return 1;
                    // Luego por cantidad de ventas desde la última actualización
                    return b.sales_since_update.total_sales - a.sales_since_update.total_sales;
                })
            };

            res.status(200).json(summary);
        } catch (error) {
            console.error('Error in getInventorySummary:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },
    // Método para obtener solo ingredientes básicos (sin incluir virtuales como "Mezcla de harina")
    async getAllBasicIngredients(req: any, res: any) {
        try {
            // Obtener todos los ingredientes básicos
            const ingredients = await prisma.ingredient.findMany({
                where: {
                    // Excluir el ingrediente virtual "Mezcla de harina"
                    name: {
                        not: "Mezcla de harina"
                    }
                },
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    name: true,
                    current_stock: true,
                    min_stock: true,
                    unit_measurement: true,
                    cost_unit: true,
                    branch_id: true,
                },
            });

            const formattedIngredients = ingredients.map((ingredient) => {
                return {
                    ...ingredient,
                    id: bufferToUuid(Buffer.from(ingredient.id)),
                    branch_id: ingredient.branch_id ? bufferToUuid(Buffer.from(ingredient.branch_id)) : null,
                };
            });

            res.status(200).json(formattedIngredients);
        } catch (error) {
            console.error('Error in getAllBasicIngredients:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },

    // Método para obtener todos los ingredientes incluyendo virtuales
    async getAllIngredientsWithVirtual(req: any, res: any) {
        
        try {
            // Definir la configuración del ingrediente virtual
            const VIRTUAL_INGREDIENT_CONFIG = {
                name: "Mezcla de harina",
                recipe: [
                    { name: "Leche", amount: 94.77 },
                    { name: "Mantequilla", amount: 2.84 },
                    { name: "Harina", amount:  47.39 }
                ],
                unit_measurement: "G"
            };
            
            const ingredients = await prisma.ingredient.findMany({
                select: {
                    id: true,
                    created_at: true,
                    updated_at: true,
                    name: true,
                    current_stock: true,
                    min_stock: true,
                    unit_measurement: true,
                    cost_unit: true,
                    branch_id: true,
                },
            });

            const formattedIngredients = ingredients.map((ingredient) => {
                return {
                    ...ingredient,
                    id: bufferToUuid(Buffer.from(ingredient.id)),
                    branch_id: ingredient.branch_id ? bufferToUuid(Buffer.from(ingredient.branch_id)) : null,
                    is_virtual: false
                };
            });

            // Agrupar ingredientes por sucursal para crear ingredientes virtuales
            const ingredientsByBranch = formattedIngredients.reduce((acc, ingredient) => {
                const branchId = ingredient.branch_id || 'no-branch';
                if (!acc[branchId]) {
                    acc[branchId] = [];
                }
                acc[branchId].push(ingredient);
                return acc;
            }, {} as Record<string, typeof formattedIngredients>);

            // Crear ingredientes virtuales para cada sucursal que tenga todos los ingredientes necesarios
            Object.entries(ingredientsByBranch).forEach(([branchId, branchIngredients]) => {
                // Buscar los ingredientes de la receta en esta sucursal específica
                const recipeIngredients = VIRTUAL_INGREDIENT_CONFIG.recipe.map(recipeItem => 
                    branchIngredients.find(ing => ing.name === recipeItem.name)
                ).filter(Boolean);

                // Solo crear el ingrediente virtual si están todos los ingredientes de la receta
                if (recipeIngredients.length === VIRTUAL_INGREDIENT_CONFIG.recipe.length) {
                    // Calcular el stock disponible basado en la receta
                    const availableVirtualStock = Math.floor(Math.min(
                        ...VIRTUAL_INGREDIENT_CONFIG.recipe.map((recipeItem, index) => {
                            const ingredient = recipeIngredients[index];
                            return ingredient ? ingredient.current_stock / recipeItem.amount : 0;
                        })
                    ));

                    // Calcular el costo unitario promedio
                    const averageCost = recipeIngredients.reduce((sum, ing) => sum + ing.cost_unit, 0) / recipeIngredients.length;

                    const virtualIngredient = {
                        id: `virtual-mezcla-harina-${branchId}`, // ID único por sucursal
                        created_at: new Date(),
                        updated_at: new Date(),
                        name: VIRTUAL_INGREDIENT_CONFIG.name,
                        current_stock: VIRTUAL_INGREDIENT_DEFAULT_AMOUNT, // Cantidad predefinida fija
                        min_stock: 1,
                        unit_measurement: VIRTUAL_INGREDIENT_CONFIG.unit_measurement,
                        cost_unit: averageCost,
                        branch_id: branchId === 'no-branch' ? null : branchId,
                        is_virtual: true,
                        recipe_ingredients: VIRTUAL_INGREDIENT_CONFIG.recipe,
                        recipe_details: recipeIngredients.map(ing => ({
                            id: ing.id,
                            name: ing.name,
                            current_stock: ing.current_stock,
                            unit_measurement: ing.unit_measurement
                        })),
                        actual_stock_calculation: availableVirtualStock // Guardamos el cálculo real para referencia
                    };

                    formattedIngredients.push(virtualIngredient);
                }
            });

            res.status(200).json(formattedIngredients);
        } catch (error) {
            console.error('Error in getAllIngredientsWithVirtual:', error);
            return res.status(500).json({ message: "Error de servidor: " + error });
        }
    },

    async deleteIngredient(req: any, res: any) {
        const { id } = req.body;
        
        try {
            const uuidBuffer = uuidToBuffer(id);
            
            const ingredient = await prisma.ingredient.findFirst({
                where: {
                    id: uuidBuffer,
                },
            });

            if (!ingredient) {
                return res.status(404).json({ message: "Ingrediente no encontrado" });
            }

            await prisma.$transaction([
                prisma.product_ingredient.deleteMany({
                    where: {
                        ingredient_id: uuidBuffer,
                    },
                }),
                prisma.ingredient.delete({
                    where: {
                        id: uuidBuffer,
                    },
                }),
            ]);

            res.status(200).json({ message: "Ingrediente eliminado correctamente" });
        } catch (error) {
            return res.status(500).json({ message: "Error de servidor" + error });
        }
    },
};