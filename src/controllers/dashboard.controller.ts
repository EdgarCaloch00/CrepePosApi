import { Request, Response } from "express";
import prisma from "../lib/prisma";

export class DashboardController {
  // Get dashboard statistics
  async getStats(req: Request, res: Response) {
    try {
      const branchId = req.query.branch_id as string | undefined;
      const period = (req.query.period as string) || 'today'; // Default to 'today'
      const customStartDate = req.query.startDate as string | undefined;
      const customEndDate = req.query.endDate as string | undefined;
      
      // Helper function to convert CST date to UTC for database queries
      const cstToUtc = (dateStr: string, isEndOfDay: boolean = false): Date => {
        // Parse the date string as CST by appending the timezone offset
        const dateTimeStr = isEndOfDay 
          ? `${dateStr}T23:59:59.999-06:00`
          : `${dateStr}T00:00:00.000-06:00`;
        
        return new Date(dateTimeStr);
      };

      // Get current time in CST (GMT-6)
      const nowUtc = new Date();
      const nowCst = new Date(nowUtc.getTime() - (6 * 60 * 60 * 1000));
      
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'today':
          // Start of today in CST, converted to UTC
          const todayStartCst = new Date(nowCst.getFullYear(), nowCst.getMonth(), nowCst.getDate(), 0, 0, 0, 0);
          startDate = new Date(todayStartCst.getTime() + (6 * 60 * 60 * 1000));
          
          // End of today in CST, converted to UTC
          const todayEndCst = new Date(nowCst.getFullYear(), nowCst.getMonth(), nowCst.getDate(), 23, 59, 59, 999);
          endDate = new Date(todayEndCst.getTime() + (6 * 60 * 60 * 1000));
          break;
          
        case 'week':
          // Get start of week (Monday) in CST
          const dayOfWeek = nowCst.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          const weekStartCst = new Date(nowCst);
          weekStartCst.setDate(nowCst.getDate() - daysToMonday);
          weekStartCst.setHours(0, 0, 0, 0);
          startDate = new Date(weekStartCst.getTime() + (6 * 60 * 60 * 1000));
          
          // End of week (Sunday) in CST
          const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
          const weekEndCst = new Date(nowCst);
          weekEndCst.setDate(nowCst.getDate() + daysToSunday);
          weekEndCst.setHours(23, 59, 59, 999);
          endDate = new Date(weekEndCst.getTime() + (6 * 60 * 60 * 1000));
          break;
          
        case 'month':
          // Start of month in CST
          const monthStartCst = new Date(nowCst.getFullYear(), nowCst.getMonth(), 1, 0, 0, 0, 0);
          startDate = new Date(monthStartCst.getTime() + (6 * 60 * 60 * 1000));
          
          // End of month in CST
          const monthEndCst = new Date(nowCst.getFullYear(), nowCst.getMonth() + 1, 0, 23, 59, 59, 999);
          endDate = new Date(monthEndCst.getTime() + (6 * 60 * 60 * 1000));
          break;
          
        case 'custom':
          if (!customStartDate || !customEndDate) {
            return res.status(400).json({ error: 'Custom range requires startDate and endDate' });
          }
          // Convert CST dates to UTC
          startDate = cstToUtc(customStartDate, false);
          endDate = cstToUtc(customEndDate, true);
          break;
          
        default:
          return res.status(400).json({ error: 'Invalid period. Use: today, week, month, or custom' });
      }

      // Build where clause for branch filter - simplified
      const whereClause: any = {};
      // For now, don't filter by branch to debug
      // if (branchId) {
      //   whereClause.user = {
      //     user_branch: {
      //       some: {
      //         branch_id: Buffer.from(branchId, 'hex')
      //       }
      //     }
      //   };
      // }

      // Get sales for the selected period
      const sales = await prisma.sale.findMany({
        where: {
          ...whereClause,
          created_at: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      // Get sale details for the selected period
      const saleDetails = await prisma.sale_detail.findMany({
        where: {
          sale: {
            ...whereClause,
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
      });

      // Calculate stats
      const totalSales = sales.reduce((sum, sale) => sum + sale.total, 0);
      const orderCount = sales.length;
      const productsSold = saleDetails.reduce((sum, detail) => sum + detail.amount, 0);
      const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;

      // Get top 5 product types
      const saleDetailsWithProducts = await prisma.sale_detail.findMany({
        where: {
          product_id: { not: null },
          sale: {
            ...whereClause,
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        include: {
          product: {
            include: {
              type_product: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Group by type_id and sum amounts
      const typeMap = new Map<string, { name: string; sales: number }>();
      saleDetailsWithProducts.forEach(detail => {
        if (detail.product?.type_product) {
          const typeId = (detail.product.type_id as Buffer).toString('hex');
          const typeName = detail.product.type_product.name;
          const existing = typeMap.get(typeId);
          if (existing) {
            existing.sales += detail.amount;
          } else {
            typeMap.set(typeId, { name: typeName, sales: detail.amount });
          }
        }
      });

      // Sort and get top 5
      const topProducts = Array.from(typeMap.values())
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 5);

      // Get top 5 combos
      const topCombosData = await prisma.sale_detail.groupBy({
        by: ['combo_id'],
        where: {
          combo_id: { not: null },
          sale: {
            ...whereClause,
            created_at: {
              gte: startDate,
              lte: endDate,
            },
          },
        },
        _sum: {
          amount: true,
        },
        orderBy: {
          _sum: {
            amount: 'desc',
          },
        },
        take: 5,
      });

      // Get combo details
      const topCombos = await Promise.all(
        topCombosData.map(async (item) => {
          const combo = await prisma.combo.findUnique({
            where: { id: item.combo_id! },
            select: { name: true },
          });
          return {
            name: combo?.name || 'Unknown',
            sales: item._sum.amount || 0,
          };
        })
      );

      // Return dates in ISO format (they're already in UTC from our CST conversion)
      // The frontend will display them correctly
      return res.json({
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        totalSales: totalSales.toFixed(2),
        orders: orderCount,
        productsSold: productsSold,
        avgTicket: avgTicket.toFixed(2),
        topProducts,
        topCombos,
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
  }
}