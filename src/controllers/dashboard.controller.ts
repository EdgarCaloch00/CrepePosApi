import { Request, Response } from "express";
import prisma from "../lib/prisma";

export class DashboardController {
  // Get dashboard statistics
  async getStats(req: Request, res: Response) {
    try {
      const branchId = req.query.branch_id as string | undefined;
      
      // Get current month start and end dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      
      // Get previous month start and end dates
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // Build where clause for branch filter
      const salesWhereClause: any = {
        created_at: {}
      };
      
      if (branchId) {
        const branchBuffer = Buffer.from(branchId, 'hex');
        salesWhereClause.user = {
          user_branch: {
            some: {
              branch_id: branchBuffer
            }
          }
        };
      }

      // Current month sales
      const currentMonthSales = await prisma.sale.findMany({
        where: {
          ...salesWhereClause,
          created_at: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
      });

      // Previous month sales
      const previousMonthSales = await prisma.sale.findMany({
        where: {
          ...salesWhereClause,
          created_at: {
            gte: previousMonthStart,
            lte: previousMonthEnd,
          },
        },
      });

      // Current month sale details
      const currentMonthDetails = await prisma.sale_detail.findMany({
        where: {
          sale: {
            ...salesWhereClause,
            created_at: {
              gte: currentMonthStart,
              lte: currentMonthEnd,
            },
          },
        },
      });

      // Previous month sale details
      const previousMonthDetails = await prisma.sale_detail.findMany({
        where: {
          sale: {
            ...salesWhereClause,
            created_at: {
              gte: previousMonthStart,
              lte: previousMonthEnd,
            },
          },
        },
      });

      // Calculate current month stats
      const currentTotalSales = currentMonthSales.reduce((sum, sale) => sum + sale.total, 0);
      const currentOrderCount = currentMonthSales.length;
      const currentProductsSold = currentMonthDetails.reduce((sum, detail) => sum + detail.amount, 0);
      const currentAvgTicket = currentOrderCount > 0 ? currentTotalSales / currentOrderCount : 0;

      // Calculate previous month stats
      const previousTotalSales = previousMonthSales.reduce((sum, sale) => sum + sale.total, 0);
      const previousOrderCount = previousMonthSales.length;
      const previousProductsSold = previousMonthDetails.reduce((sum, detail) => sum + detail.amount, 0);
      const previousAvgTicket = previousOrderCount > 0 ? previousTotalSales / previousOrderCount : 0;

      // Calculate percentage changes
      const salesChange = previousTotalSales > 0 
        ? ((currentTotalSales - previousTotalSales) / previousTotalSales * 100).toFixed(1)
        : '0.0';
      const ordersChange = previousOrderCount > 0
        ? ((currentOrderCount - previousOrderCount) / previousOrderCount * 100).toFixed(1)
        : '0.0';
      const productsSoldChange = previousProductsSold > 0
        ? ((currentProductsSold - previousProductsSold) / previousProductsSold * 100).toFixed(1)
        : '0.0';
      const avgTicketChange = previousAvgTicket > 0
        ? ((currentAvgTicket - previousAvgTicket) / previousAvgTicket * 100).toFixed(1)
        : '0.0';

      // Get last 7 days sales
      const last7DaysStart = new Date();
      last7DaysStart.setDate(last7DaysStart.getDate() - 6);
      last7DaysStart.setHours(0, 0, 0, 0);

      const last7DaysSales = await prisma.sale.findMany({
        where: {
          ...salesWhereClause,
          created_at: {
            gte: last7DaysStart,
          },
        },
        orderBy: {
          created_at: 'asc',
        },
      });

      // Group sales by day
      const salesByDay = Array(7).fill(0);
      last7DaysSales.forEach(sale => {
        const dayIndex = Math.floor((sale.created_at.getTime() - last7DaysStart.getTime()) / (1000 * 60 * 60 * 24));
        if (dayIndex >= 0 && dayIndex < 7) {
          salesByDay[dayIndex] += sale.total;
        }
      });

      // Get top 5 products
      const topProductsData = await prisma.sale_detail.groupBy({
        by: ['product_id'],
        where: {
          product_id: { not: null },
          sale: {
            ...salesWhereClause,
            created_at: {
              gte: last7DaysStart,
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

      // Get product details
      const topProducts = await Promise.all(
        topProductsData.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.product_id! },
            select: { name: true },
          });
          return {
            name: product?.name || 'Unknown',
            sales: item._sum.amount || 0,
          };
        })
      );

      res.status(200).json({
        totalSales: {
          value: currentTotalSales.toFixed(2),
          change: salesChange,
          positive: parseFloat(salesChange) >= 0,
        },
        orders: {
          value: currentOrderCount,
          change: ordersChange,
          positive: parseFloat(ordersChange) >= 0,
        },
        productsSold: {
          value: currentProductsSold,
          change: productsSoldChange,
          positive: parseFloat(productsSoldChange) >= 0,
        },
        avgTicket: {
          value: currentAvgTicket.toFixed(2),
          change: avgTicketChange,
          positive: parseFloat(avgTicketChange) >= 0,
        },
        salesByDay: salesByDay.map(v => Math.round(v)),
        topProducts,
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
  }
}
