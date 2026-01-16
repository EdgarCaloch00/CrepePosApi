import { Request, Response } from "express";
import prisma from "../lib/prisma";

export class DashboardController {
  // Get dashboard statistics
  async getStats(req: Request, res: Response) {
    try {
      const branchId = req.query.branch_id as string | undefined;
      const filterDate = req.query.date as string | undefined; // Format: YYYY-MM-DD
      const filterHour = req.query.hour as string | undefined; // Format: 0-23
      
      // Determine current period based on filters
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date;
      let previousPeriodStart: Date;
      let previousPeriodEnd: Date;

      if (filterDate && filterHour !== undefined) {
        // Specific day and hour
        const [year, month, day] = filterDate.split('-').map(Number);
        const hour = parseInt(filterHour);
        currentPeriodStart = new Date(year, month - 1, day, hour, 0, 0);
        currentPeriodEnd = new Date(year, month - 1, day, hour, 59, 59);
        
        // Previous period: same hour previous day
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        previousPeriodEnd = new Date(currentPeriodEnd);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
      } else if (filterDate) {
        // Specific day only
        const [year, month, day] = filterDate.split('-').map(Number);
        currentPeriodStart = new Date(year, month - 1, day, 0, 0, 0);
        currentPeriodEnd = new Date(year, month - 1, day, 23, 59, 59);
        
        // Previous period: previous day
        previousPeriodStart = new Date(currentPeriodStart);
        previousPeriodStart.setDate(previousPeriodStart.getDate() - 1);
        previousPeriodEnd = new Date(currentPeriodEnd);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 1);
      } else {
        // Default: current month
        const now = new Date();
        currentPeriodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        currentPeriodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        
        // Previous month
        previousPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
      }

      const now = new Date();
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
