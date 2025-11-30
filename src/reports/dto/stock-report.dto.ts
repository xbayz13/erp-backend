export interface StockReport {
  period: {
    start: string;
    end: string;
  };
  summary: {
    totalItems: number;
    totalStockValue: number;
    lowStockItems: number;
    itemsByWarehouse: Array<{
      warehouseId: string;
      warehouseName: string;
      itemCount: number;
      totalValue: number;
    }>;
  };
  items: Array<{
    id: string;
    sku: string;
    name: string;
    warehouseId: string;
    warehouseName: string;
    quantityOnHand: number;
    reorderLevel: number;
    unitCost: number;
    stockValue: number;
    status: 'LOW' | 'OK';
  }>;
  movements: Array<{
    date: string;
    itemId: string;
    itemName: string;
    type: string;
    quantity: number;
    warehouseId: string;
    warehouseName: string;
  }>;
}

