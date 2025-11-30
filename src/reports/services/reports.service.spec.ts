import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { FinanceService } from '../../finance/services/finance.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { ProductionService } from '../../production/services/production.service';
import { PurchasingService } from '../../purchasing/services/purchasing.service';
import { ReportsService } from './reports.service';

describe('ReportsService', () => {
  let service: ReportsService;
  let inventoryService: jest.Mocked<InventoryService>;
  let purchasingService: jest.Mocked<PurchasingService>;
  let financeService: jest.Mocked<FinanceService>;
  let productionService: jest.Mocked<ProductionService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: InventoryService,
          useValue: {
            listItems: jest.fn(),
            listWarehouses: jest.fn(),
            listMovements: jest.fn(),
          },
        },
        {
          provide: PurchasingService,
          useValue: {
            list: jest.fn(),
          },
        },
        {
          provide: FinanceService,
          useValue: {
            listInvoices: jest.fn(),
            listTransactions: jest.fn(),
          },
        },
        {
          provide: ProductionService,
          useValue: {
            list: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            list: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    inventoryService = module.get(InventoryService);
    purchasingService = module.get(PurchasingService);
    financeService = module.get(FinanceService);
    productionService = module.get(ProductionService);
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getOperationalSnapshot', () => {
    it('should return operational snapshot', async () => {
      inventoryService.listItems.mockResolvedValue([
        {
          id: 'item-1',
          sku: 'SKU001',
          name: 'Test Item',
          warehouseId: 'warehouse-1',
          quantityOnHand: 100,
          reorderLevel: 20,
          unitCost: 10000,
        } as any,
      ]);

      purchasingService.list.mockResolvedValue([]);
      financeService.listInvoices.mockResolvedValue([]);
      financeService.listTransactions.mockResolvedValue([]);
      productionService.list.mockResolvedValue([]);

      const result = await service.getOperationalSnapshot();

      expect(result).toBeDefined();
      expect(result.inventory).toBeDefined();
      expect(result.procurement).toBeDefined();
      expect(result.finance).toBeDefined();
      expect(result.production).toBeDefined();
    });
  });

  describe('getCashFlowReport', () => {
    it('should return cash flow report', async () => {
      financeService.listTransactions.mockResolvedValue([
        {
          id: 'tx-1',
          type: 'REVENUE',
          amount: 1000000,
          currency: 'IDR',
          description: 'Test',
          createdBy: 'user-1',
          createdAt: new Date(),
        } as any,
      ]);
      financeService.listInvoices.mockResolvedValue([]);

      const result = await service.getCashFlowReport();

      expect(result).toBeDefined();
      expect(result.period).toBeDefined();
      expect(result.inflows).toBeDefined();
      expect(result.outflows).toBeDefined();
    });
  });

  describe('getStockReport', () => {
    it('should return stock report', async () => {
      inventoryService.listItems.mockResolvedValue([
        {
          id: 'item-1',
          sku: 'SKU001',
          name: 'Test Item',
          warehouseId: 'warehouse-1',
          quantityOnHand: 100,
          reorderLevel: 20,
          unitCost: 10000,
        } as any,
      ]);
      inventoryService.listWarehouses.mockResolvedValue([
        {
          id: 'warehouse-1',
          name: 'Gudang Utama',
          location: 'Jakarta',
        } as any,
      ]);
      inventoryService.listMovements.mockResolvedValue([]);

      const result = await service.getStockReport();

      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
      expect(result.items).toBeDefined();
      expect(result.movements).toBeDefined();
    });
  });
});

