import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ReportBuilderService } from './report-builder.service';
import { Item } from '../../inventory/entities/item.entity';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../../purchasing/entities/purchase-order.entity';
import { FinancialTransaction } from '../../finance/entities/financial-transaction.entity';

describe('ReportBuilderService', () => {
  let service: ReportBuilderService;
  let itemRepository: Repository<Item>;
  let salesOrderRepository: Repository<SalesOrder>;

  const mockItemRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockSalesOrderRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockPurchaseOrderRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockTransactionRepository = {
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportBuilderService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
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
      ],
    }).compile();

    service = module.get<ReportBuilderService>(ReportBuilderService);
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    salesOrderRepository = module.get<Repository<SalesOrder>>(
      getRepositoryToken(SalesOrder),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('buildReport', () => {
    it('should build a report for Item entity', async () => {
      const mockQueryBuilder = {
        select: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        addGroupBy: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        getRawMany: jest.fn().mockResolvedValue([
          { sku: 'ITEM001', name: 'Test Item', unitCost: 10 },
        ]),
      };

      mockItemRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      const definition = {
        name: 'Item Report',
        entity: 'Item',
        columns: [
          { field: 'sku', label: 'SKU', type: 'string' as const },
          { field: 'name', label: 'Name', type: 'string' as const },
        ],
      };

      const result = await service.buildReport(definition);

      expect(mockItemRepository.createQueryBuilder).toHaveBeenCalledWith('entity');
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should throw error for unknown entity', async () => {
      const definition = {
        name: 'Test Report',
        entity: 'UnknownEntity',
        columns: [],
      };

      await expect(service.buildReport(definition as any)).rejects.toThrow();
    });
  });

  describe('getAvailableEntities', () => {
    it('should return list of available entities', async () => {
      const result = await service.getAvailableEntities();

      expect(result).toContain('Item');
      expect(result).toContain('SalesOrder');
      expect(result).toContain('PurchaseOrder');
    });
  });

  describe('getAvailableFields', () => {
    it('should return available fields for Item entity', async () => {
      const result = await service.getAvailableFields('Item');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown entity', async () => {
      const result = await service.getAvailableFields('Unknown');

      expect(result).toEqual([]);
    });
  });
});

