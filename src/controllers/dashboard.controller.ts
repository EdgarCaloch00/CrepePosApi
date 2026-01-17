import { Request, Response } from "express";
import prisma from "../lib/prisma";

export class DashboardController {
  // Get dashboard statistics
  async getStats(req: Request, res: Response) {
    try {
      const branchId = req.query.branch_id as string | undefined;
      const startDateStr = req.query.start_date as string | undefined; // Format: YYYY-MM-DD
      const endDateStr = req.query.end_date as string | undefined; // Format: YYYY-MM-DD
      
      // Determine current period based on filters
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date;
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;

      if (startDateStr && endDateStr) {
        // Custom date range
        const [startYear, startMonth, startDay] = startDateStr.split('-').map(Number);
        const [endYear, endMonth, endDay] = endDateStr.split('-').map(Number);
        
        currentPeriodStart = new Date(startYear, startMonth - 1, startDay, 0, 0, 0);
        currentPeriodEnd = new Date(endYear, endMonth - 1, endDay, 23, 59, 59);
        
        // Calculate previous period with same duration
        const durationMs = currentPeriodEnd.getTime() - currentPeriodStart.getTime();
        previousPeriodEnd = new Date(currentPeriodStart.getTime() - 1); // 1ms before current period
        previousPeriodStart = new Date(previousPeriodEnd.getTime() - durationMs);
      } else {
        // Default: current month
        const now = new Date();
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        // Previous month
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      }

      const currentMonthStart = currentPeriodStart;
      const currentMonthEnd = currentPeriodEnd;
      const previousMonthStart = previousPeriodStart;
      const previousMonthEnd = previousPeriodEnd;

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

      // Current month sales
      const currentMonthSales = await prisma.sale.findMany({
        where: {
          ...whereClause,
          created_at: {
            gte: currentMonthStart,
            lte: currentMonthEnd,
          },
        },
      });

      // Previous month sales
      const previousMonthSales = await prisma.sale.findMany({
        where: {
          ...whereClause,
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
            ...whereClause,
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
            ...whereClause,
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

      // Get top 5 products for the current period
      const topProductsData = await prisma.sale_detail.groupBy({
        by: ['product_id'],
        where: {
          product_id: { not: null },
          sale: {
            ...whereClause,
            created_at: {
              gte: currentPeriodStart,
              lte: currentPeriodEnd,
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
        topProducts,
      });
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      res.status(500).json({ error: 'Failed to get dashboard stats' });
    }
  }
}
