export interface InventoryKpi {
  totalItems: number;
  lowStockItems: number;
  totalStockValue: number;
}

export interface ProcurementKpi {
  openOrders: number;
  receivedOrders: number;
  avgLeadTimeDays: number;
}

export interface FinanceKpi {
  totalPayables: number;
  totalPayments: number;
  cashOutflow: number;
}

export interface ProductionKpi {
  activeOrders: number;
  completedOrders: number;
  throughputRate: number;
}

export interface OperationalSnapshot {
  inventory: InventoryKpi;
  procurement: ProcurementKpi;
  finance: FinanceKpi;
  production: ProductionKpi;
  generatedAt: string;
}


