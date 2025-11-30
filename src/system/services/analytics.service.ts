import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../../purchasing/entities/purchase-order.entity';
import { FinancialTransaction } from '../../finance/entities/financial-transaction.entity';
import { Item } from '../../inventory/entities/item.entity';
import { ProductionOrder } from '../../production/entities/production-order.entity';

export interface AnalyticsMetric {
  label: string;
  value: number;
  previousValue?: number;
  changePercentage?: number;
  trend?: 'up' | 'down' | 'stable';
}

export interface AnalyticsDashboard {
  metrics: AnalyticsMetric[];
  charts: Array<{
    type: string;
    data: any;
    config: any;
  }>;
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepository: Repository<FinancialTransaction>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(ProductionOrder)
    private readonly productionOrderRepository: Repository<ProductionOrder>,
  ) {}

  async getDashboardData(
    startDate?: Date,
    endDate?: Date,
  ): Promise<AnalyticsDashboard> {
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate || new Date();

    const metrics = await Promise.all([
      this.getSalesRevenueMetric(start, end),
      this.getPurchaseExpenseMetric(start, end),
      this.getInventoryValueMetric(),
      this.getProductionThroughputMetric(start, end),
      this.getGrossProfitMetric(start, end),
    ]);

    const charts = await Promise.all([
      this.getSalesTrendChart(start, end),
      this.getInventoryDistributionChart(),
      this.getTopCustomersChart(start, end),
      this.getTopSuppliersChart(start, end),
    ]);

    return {
      metrics: metrics.filter((m) => m !== null) as AnalyticsMetric[],
      charts: charts.filter((c) => c !== null),
    };
  }

  private async getSalesRevenueMetric(
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsMetric | null> {
    const orders = await this.salesOrderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const currentRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);

    // Previous period
    const prevStart = new Date(startDate);
    prevStart.setMonth(prevStart.getMonth() - 1);
    const prevEnd = new Date(endDate);
    prevEnd.setMonth(prevEnd.getMonth() - 1);

    const prevOrders = await this.salesOrderRepository.find({
      where: {
        createdAt: Between(prevStart, prevEnd),
      },
    });

    const previousRevenue = prevOrders.reduce((sum, o) => sum + o.totalAmount, 0);

    const changePercentage =
      previousRevenue > 0
        ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
        : 0;

    return {
      label: 'Sales Revenue',
      value: currentRevenue,
      previousValue: previousRevenue,
      changePercentage,
      trend:
        changePercentage > 5
          ? 'up'
          : changePercentage < -5
            ? 'down'
            : 'stable',
    };
  }

  private async getPurchaseExpenseMetric(
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsMetric | null> {
    const orders = await this.purchaseOrderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const currentExpense = orders.reduce((sum, o) => sum + (o.totalCost || 0), 0);

    return {
      label: 'Purchase Expenses',
      value: currentExpense,
    };
  }

  private async getInventoryValueMetric(): Promise<AnalyticsMetric | null> {
    const items = await this.itemRepository.find();

    const totalValue = items.reduce(
      (sum, item) => sum + item.quantityOnHand * item.unitCost,
      0,
    );

    return {
      label: 'Inventory Value',
      value: totalValue,
    };
  }

  private async getProductionThroughputMetric(
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsMetric | null> {
    const orders = await this.productionOrderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const completed = orders.filter((o) => o.status === 'COMPLETED').length;
    const totalUnits = orders.reduce((sum, o) => sum + o.quantityCompleted, 0);

    return {
      label: 'Production Throughput',
      value: totalUnits,
    };
  }

  private async getGrossProfitMetric(
    startDate: Date,
    endDate: Date,
  ): Promise<AnalyticsMetric | null> {
    const revenueMetric = await this.getSalesRevenueMetric(startDate, endDate);
    const expenseMetric = await this.getPurchaseExpenseMetric(startDate, endDate);

    if (!revenueMetric || !expenseMetric) return null;

    const grossProfit = revenueMetric.value - expenseMetric.value;
    const profitMargin =
      revenueMetric.value > 0
        ? (grossProfit / revenueMetric.value) * 100
        : 0;

    return {
      label: 'Gross Profit',
      value: grossProfit,
      changePercentage: profitMargin,
    };
  }

  private async getSalesTrendChart(
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const orders = await this.salesOrderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    // Group by date
    const dailySales: Record<string, number> = {};
    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0];
      dailySales[dateKey] = (dailySales[dateKey] || 0) + order.totalAmount;
    });

    return {
      type: 'line',
      data: {
        labels: Object.keys(dailySales).sort(),
        datasets: [
          {
            label: 'Daily Sales',
            data: Object.keys(dailySales)
              .sort()
              .map((key) => dailySales[key]),
          },
        ],
      },
      config: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
          },
        },
      },
    };
  }

  private async getInventoryDistributionChart(): Promise<any> {
    const items = await this.itemRepository.find({
      order: { quantityOnHand: 'DESC' },
      take: 10,
    });

    return {
      type: 'bar',
      data: {
        labels: items.map((item) => item.name),
        datasets: [
          {
            label: 'Quantity',
            data: items.map((item) => item.quantityOnHand),
          },
        ],
      },
      config: {
        responsive: true,
      },
    };
  }

  private async getTopCustomersChart(
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const orders = await this.salesOrderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const customerSales: Record<string, number> = {};
    orders.forEach((order) => {
      customerSales[order.customerId] =
        (customerSales[order.customerId] || 0) + order.totalAmount;
    });

    const topCustomers = Object.entries(customerSales)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      type: 'doughnut',
      data: {
        labels: topCustomers.map(([customerId]) => customerId),
        datasets: [
          {
            label: 'Sales by Customer',
            data: topCustomers.map(([, amount]) => amount),
          },
        ],
      },
      config: {
        responsive: true,
      },
    };
  }

  private async getTopSuppliersChart(
    startDate: Date,
    endDate: Date,
  ): Promise<any> {
    const orders = await this.purchaseOrderRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const supplierPurchases: Record<string, number> = {};
    orders.forEach((order) => {
      const supplierKey = order.supplierName || 'Unknown';
      supplierPurchases[supplierKey] =
        (supplierPurchases[supplierKey] || 0) + (order.totalCost || 0);
    });

    const topSuppliers = Object.entries(supplierPurchases)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    return {
      type: 'bar',
      data: {
        labels: topSuppliers.map(([supplierName]) => supplierName),
        datasets: [
          {
            label: 'Purchases by Supplier',
            data: topSuppliers.map(([, amount]) => amount),
          },
        ],
      },
      config: {
        responsive: true,
      },
    };
  }
}

