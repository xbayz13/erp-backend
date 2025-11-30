import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AnalyticsService } from './analytics.service';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../../purchasing/entities/purchase-order.entity';
import { FinancialTransaction } from '../../finance/entities/financial-transaction.entity';
import { Item } from '../../inventory/entities/item.entity';
import { ProductionOrder } from '../../production/entities/production-order.entity';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let salesOrderRepository: Repository<SalesOrder>;
  let purchaseOrderRepository: Repository<PurchaseOrder>;
  let itemRepository: Repository<Item>;
  let productionOrderRepository: Repository<ProductionOrder>;

  const mockSalesOrderRepository = {
    find: jest.fn(),
  };

  const mockPurchaseOrderRepository = {
    find: jest.fn(),
  };

  const mockTransactionRepository = {
    find: jest.fn(),
  };

  const mockItemRepository = {
    find: jest.fn(),
  };

  const mockProductionOrderRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: mockSalesOrderRepository,
        },
        {
          provide: getRepositoryToken(PurchaseOrder),
          useValue: mockPurchaseOrderRepository,
        },
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
        {
          provide: getRepositoryToken(ProductionOrder),
          useValue: mockProductionOrderRepository,
        },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
    salesOrderRepository = module.get<Repository<SalesOrder>>(
      getRepositoryToken(SalesOrder),
    );
    purchaseOrderRepository = module.get<Repository<PurchaseOrder>>(
      getRepositoryToken(PurchaseOrder),
    );
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    productionOrderRepository = module.get<Repository<ProductionOrder>>(
      getRepositoryToken(ProductionOrder),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboardData', () => {
    it('should return dashboard data with metrics and charts', async () => {
      mockSalesOrderRepository.find.mockResolvedValue([]);
      mockPurchaseOrderRepository.find.mockResolvedValue([]);
      mockItemRepository.find.mockResolvedValue([]);
      mockProductionOrderRepository.find.mockResolvedValue([]);

      const result = await service.getDashboardData();

      expect(result).toBeDefined();
      expect(result.metrics).toBeInstanceOf(Array);
      expect(result.charts).toBeInstanceOf(Array);
    });
  });

  describe('getInventoryValueMetric', () => {
    it('should calculate total inventory value', async () => {
      const items = [
        { id: '1', quantityOnHand: 100, unitCost: 10 },
        { id: '2', quantityOnHand: 50, unitCost: 20 },
      ] as Item[];

      mockItemRepository.find.mockResolvedValue(items);

      // Access private method via any cast
      const result = await (service as any).getInventoryValueMetric();

      expect(result).toBeDefined();
      expect(result.value).toBe(2000); // (100 * 10) + (50 * 20)
    });
  });
});

