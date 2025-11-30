import { Injectable } from '@nestjs/common';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { FinancialTransactionType } from '../../finance/entities/financial-transaction.entity';
import { InvoiceStatus } from '../../finance/entities/invoice.entity';
import { FinanceService } from '../../finance/services/finance.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { ProductionStatus } from '../../production/entities/production-order.entity';
import { ProductionService } from '../../production/services/production.service';
import { PurchaseOrderStatus } from '../../purchasing/entities/purchase-order.entity';
import { PurchasingService } from '../../purchasing/services/purchasing.service';
import {
  BalanceSheetReport,
  CashFlowReport,
  ProfitLossReport,
} from '../dto/finance-report.dto';
import { OperationalSnapshot } from '../dto/operational-report.dto';
import { StockReport } from '../dto/stock-report.dto';

@Injectable()
export class ReportsService {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly purchasingService: PurchasingService,
    private readonly financeService: FinanceService,
    private readonly productionService: ProductionService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async getOperationalSnapshot(): Promise<OperationalSnapshot> {
    const [items, orders, invoices, transactions, production] =
      await Promise.all([
        this.inventoryService.listItems(),
        this.purchasingService.list(),
        this.financeService.listInvoices(),
        this.financeService.listTransactions(),
        this.productionService.list(),
      ]);

    const inventoryValue = items.reduce(
      (sum, item) => sum + item.quantityOnHand * item.unitCost,
      0,
    );
    const lowStockItems = items.filter(
      (item) => item.quantityOnHand <= item.reorderLevel,
    ).length;

    const avgLeadTime =
      orders.length === 0
        ? 0
        : orders.reduce((sum, order) => {
            const lead =
              (order.expectedDate.getTime() - order.createdAt.getTime()) /
              (1000 * 60 * 60 * 24);
            return sum + lead;
          }, 0) / orders.length;

    const financePayables = invoices
      .filter((invoice) => invoice.status !== InvoiceStatus.PAID)
      .reduce((sum, invoice) => sum + invoice.amount, 0);
    const payments = transactions.filter(
      (tx) => tx.type === FinancialTransactionType.PAYMENT,
    ).length;
    const cashOutflow = transactions
      .filter((tx) => tx.type !== FinancialTransactionType.REVENUE)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const activeProduction = production.filter(
      (order) => order.status === ProductionStatus.IN_PROGRESS,
    ).length;
    const completedProduction = production.filter(
      (order) => order.status === ProductionStatus.COMPLETED,
    ).length;

    return {
      inventory: {
        totalItems: items.length,
        lowStockItems,
        totalStockValue: inventoryValue,
      },
      procurement: {
        openOrders: orders.filter(
          (order) => order.status !== PurchaseOrderStatus.RECEIVED,
        ).length,
        receivedOrders: orders.filter(
          (order) => order.status === PurchaseOrderStatus.RECEIVED,
        ).length,
        avgLeadTimeDays: Number(avgLeadTime.toFixed(2)),
      },
      finance: {
        totalPayables: financePayables,
        totalPayments: payments,
        cashOutflow,
      },
      production: {
        activeOrders: activeProduction,
        completedOrders: completedProduction,
        throughputRate:
          production.length === 0
            ? 0
            : Number(
                (completedProduction / production.length).toFixed(2),
              ),
      },
      generatedAt: new Date().toISOString(),
    };
  }

  listAuditLogs() {
    return this.auditLogService.list();
  }

  async getCashFlowReport(startDate?: Date, endDate?: Date): Promise<CashFlowReport> {
    const end = endDate ?? new Date();
    const start = startDate ?? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [transactions, invoices] = await Promise.all([
      this.financeService.listTransactions(),
      this.financeService.listInvoices(),
    ]);

    const periodTransactions = transactions.filter(
      (tx) =>
        tx.createdAt >= start &&
        tx.createdAt <= end &&
        tx.currency === 'IDR',
    );

    const revenue = periodTransactions
      .filter((tx) => tx.type === FinancialTransactionType.REVENUE)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const expenses = periodTransactions
      .filter((tx) => tx.type === FinancialTransactionType.EXPENSE)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const payments = periodTransactions
      .filter((tx) => tx.type === FinancialTransactionType.PAYMENT)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const openingBalance = 0;
    const inflows = {
      revenue,
      other: 0,
      total: revenue,
    };
    const outflows = {
      expenses,
      payments,
      other: 0,
      total: expenses + payments,
    };
    const closingBalance = openingBalance + inflows.total - outflows.total;

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      openingBalance,
      inflows,
      outflows,
      closingBalance,
      transactions: periodTransactions
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map((tx) => ({
          date: tx.createdAt.toISOString(),
          type: tx.type,
          description: tx.description,
          amount: Number(tx.amount),
        })),
    };
  }

  async getProfitLossReport(startDate?: Date, endDate?: Date): Promise<ProfitLossReport> {
    const end = endDate ?? new Date();
    const start = startDate ?? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const transactions = await this.financeService.listTransactions();
    const periodTransactions = transactions.filter(
      (tx) =>
        tx.createdAt >= start &&
        tx.createdAt <= end &&
        tx.currency === 'IDR',
    );

    const revenue = periodTransactions
      .filter((tx) => tx.type === FinancialTransactionType.REVENUE)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const expenses = periodTransactions
      .filter((tx) => tx.type === FinancialTransactionType.EXPENSE)
      .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const costOfGoodsSold = 0;
    const operatingExpenses = expenses;
    const grossProfit = revenue - costOfGoodsSold;
    const operatingProfit = grossProfit - operatingExpenses;
    const netIncome = operatingProfit;

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      revenue: {
        sales: revenue,
        other: 0,
        total: revenue,
      },
      expenses: {
        costOfGoodsSold,
        operating: operatingExpenses,
        other: 0,
        total: expenses,
      },
      grossProfit,
      operatingProfit,
      netIncome,
    };
  }

  async getBalanceSheetReport(asOf?: Date): Promise<BalanceSheetReport> {
    const date = asOf ?? new Date();

    const [items, invoices, transactions] = await Promise.all([
      this.inventoryService.listItems(),
      this.financeService.listInvoices(),
      this.financeService.listTransactions(),
    ]);

    const inventoryValue = items.reduce(
      (sum, item) => sum + item.quantityOnHand * item.unitCost,
      0,
    );

    const payables = invoices
      .filter((inv) => inv.status !== InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + Number(inv.amount), 0);

    const cash = transactions
      .filter((tx) => tx.type === FinancialTransactionType.REVENUE)
      .reduce((sum, tx) => sum + Number(tx.amount), 0) -
      transactions
        .filter(
          (tx) =>
            tx.type === FinancialTransactionType.EXPENSE ||
            tx.type === FinancialTransactionType.PAYMENT,
        )
        .reduce((sum, tx) => sum + Number(tx.amount), 0);

    const receivables = 0;
    const equipment = 0;
    const property = 0;
    const shortTermDebt = 0;
    const longTermDebt = 0;
    const capital = 0;
    const retainedEarnings = 0;

    return {
      asOf: date.toISOString(),
      assets: {
        current: {
          cash: Math.max(0, cash),
          inventory: inventoryValue,
          receivables,
          total: Math.max(0, cash) + inventoryValue + receivables,
        },
        fixed: {
          equipment,
          property,
          total: equipment + property,
        },
        total:
          Math.max(0, cash) +
          inventoryValue +
          receivables +
          equipment +
          property,
      },
      liabilities: {
        current: {
          payables,
          shortTermDebt,
          total: payables + shortTermDebt,
        },
        longTerm: {
          longTermDebt,
          total: longTermDebt,
        },
        total: payables + shortTermDebt + longTermDebt,
      },
      equity: {
        capital,
        retainedEarnings,
        total: capital + retainedEarnings,
      },
    };
  }

  async getStockReport(startDate?: Date, endDate?: Date): Promise<StockReport> {
    const end = endDate ?? new Date();
    const start = startDate ?? new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [items, warehouses, movements] = await Promise.all([
      this.inventoryService.listItems(),
      this.inventoryService.listWarehouses(),
      this.inventoryService.listMovements(),
    ]);

    const warehouseMap = new Map(
      warehouses.map((wh) => [wh.id, wh.name]),
    );

    const periodMovements = movements.filter(
      (movement) =>
        movement.createdAt >= start && movement.createdAt <= end,
    );

    const itemsByWarehouse = new Map<string, { count: number; value: number }>();
    warehouses.forEach((wh) => {
      itemsByWarehouse.set(wh.id, { count: 0, value: 0 });
    });

    const reportItems = items.map((item) => {
      const stockValue = item.quantityOnHand * item.unitCost;
      const status: 'LOW' | 'OK' =
        item.quantityOnHand <= item.reorderLevel ? 'LOW' : 'OK';

      const whData = itemsByWarehouse.get(item.warehouseId);
      if (whData) {
        whData.count += 1;
        whData.value += stockValue;
      }

      return {
        id: item.id,
        sku: item.sku,
        name: item.name,
        warehouseId: item.warehouseId,
        warehouseName: warehouseMap.get(item.warehouseId) ?? 'Unknown',
        quantityOnHand: item.quantityOnHand,
        reorderLevel: item.reorderLevel,
        unitCost: Number(item.unitCost),
        stockValue,
        status,
      };
    });

    const totalStockValue = reportItems.reduce(
      (sum, item) => sum + item.stockValue,
      0,
    );
    const lowStockItems = reportItems.filter((item) => item.status === 'LOW')
      .length;

    const itemsByWarehouseArray = Array.from(itemsByWarehouse.entries()).map(
      ([warehouseId, data]) => ({
        warehouseId,
        warehouseName: warehouseMap.get(warehouseId) ?? 'Unknown',
        itemCount: data.count,
        totalValue: data.value,
      }),
    );

    const itemMap = new Map(items.map((item) => [item.id, item]));

    const reportMovements = periodMovements.map((movement) => {
      const item = itemMap.get(movement.itemId);
      return {
        date: movement.createdAt.toISOString(),
        itemId: movement.itemId,
        itemName: item?.name ?? 'Unknown',
        type: movement.type,
        quantity: movement.quantity,
        warehouseId: movement.warehouseId,
        warehouseName: warehouseMap.get(movement.warehouseId) ?? 'Unknown',
      };
    });

    return {
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      summary: {
        totalItems: items.length,
        totalStockValue,
        lowStockItems,
        itemsByWarehouse: itemsByWarehouseArray,
      },
      items: reportItems,
      movements: reportMovements.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    };
  }
}


