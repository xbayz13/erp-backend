import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from './inventory.service';
import { Stocktake, StocktakeStatus } from '../entities/stocktake.entity';
import { StocktakeService } from './stocktake.service';
import { CreateStocktakeDto } from '../dto/create-stocktake.dto';
import { Item } from '../entities/item.entity';

describe('StocktakeService', () => {
  let service: StocktakeService;
  let stocktakeRepository: jest.Mocked<Repository<Stocktake>>;
  let inventoryService: jest.Mocked<InventoryService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StocktakeService,
        {
          provide: getRepositoryToken(Stocktake),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: InventoryService,
          useValue: {
            getItemById: jest.fn(),
            recordStockMovement: jest.fn(),
          },
        },
        {
          provide: AuditLogService,
          useValue: {
            record: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StocktakeService>(StocktakeService);
    stocktakeRepository = module.get(getRepositoryToken(Stocktake));
    inventoryService = module.get(InventoryService);
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new stocktake', async () => {
      const dto: CreateStocktakeDto = {
        reference: 'ST-001',
        warehouseId: 'warehouse-1',
        scheduledDate: '2024-01-01',
        items: [
          {
            itemId: 'item-1',
            expectedQuantity: 100,
            countedQuantity: 95,
            notes: 'Missing 5 units',
          },
        ],
        notes: 'Monthly stocktake',
      };

      const mockItem: Item = {
        id: 'item-1',
        sku: 'SKU001',
        name: 'Test Item',
        warehouseId: 'warehouse-1',
        quantityOnHand: 100,
        reorderLevel: 20,
        unitCost: 10000,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockStocktake: Stocktake = {
        id: 'stocktake-1',
        reference: dto.reference,
        warehouseId: dto.warehouseId,
        status: StocktakeStatus.PLANNED,
        scheduledDate: new Date(dto.scheduledDate),
        items: [
          {
            itemId: 'item-1',
            itemSku: 'SKU001',
            itemName: 'Test Item',
            expectedQuantity: 100,
            countedQuantity: 95,
            variance: -5,
            notes: 'Missing 5 units',
          },
        ],
        notes: dto.notes,
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      inventoryService.getItemById.mockResolvedValue(mockItem);
      stocktakeRepository.create.mockReturnValue(mockStocktake as any);
      stocktakeRepository.save.mockResolvedValue(mockStocktake);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockStocktake);
      expect(inventoryService.getItemById).toHaveBeenCalledWith('item-1');
      expect(stocktakeRepository.create).toHaveBeenCalled();
      expect(stocktakeRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if item not found', async () => {
      const dto: CreateStocktakeDto = {
        reference: 'ST-001',
        warehouseId: 'warehouse-1',
        scheduledDate: '2024-01-01',
        items: [
          {
            itemId: 'invalid-item',
            expectedQuantity: 100,
            countedQuantity: 100,
          },
        ],
      };

      inventoryService.getItemById.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'Item invalid-item not found',
      );
    });
  });

  describe('start', () => {
    it('should start a stocktake', async () => {
      const mockStocktake: Stocktake = {
        id: 'stocktake-1',
        reference: 'ST-001',
        warehouseId: 'warehouse-1',
        status: StocktakeStatus.PLANNED,
        scheduledDate: new Date(),
        items: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedStocktake = {
        ...mockStocktake,
        status: StocktakeStatus.IN_PROGRESS,
        startedAt: new Date(),
      };

      stocktakeRepository.findOne.mockResolvedValue(mockStocktake);
      stocktakeRepository.save.mockResolvedValue(updatedStocktake as Stocktake);

      const result = await service.start('stocktake-1', 'user-1');

      expect(result.status).toBe(StocktakeStatus.IN_PROGRESS);
      expect(result.startedAt).toBeDefined();
      expect(stocktakeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'stocktake-1' },
      });
      expect(stocktakeRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if stocktake not found', async () => {
      stocktakeRepository.findOne.mockResolvedValue(null);

      await expect(service.start('invalid-id', 'user-1')).rejects.toThrow(
        'Stocktake invalid-id not found',
      );
    });

    it('should throw error if stocktake is not in PLANNED status', async () => {
      const mockStocktake: Stocktake = {
        id: 'stocktake-1',
        reference: 'ST-001',
        warehouseId: 'warehouse-1',
        status: StocktakeStatus.IN_PROGRESS,
        scheduledDate: new Date(),
        items: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      stocktakeRepository.findOne.mockResolvedValue(mockStocktake);

      await expect(service.start('stocktake-1', 'user-1')).rejects.toThrow(
        'Stocktake can only be started from PLANNED status',
      );
    });
  });

  describe('complete', () => {
    it('should complete a stocktake and adjust inventory', async () => {
      const mockStocktake: Stocktake = {
        id: 'stocktake-1',
        reference: 'ST-001',
        warehouseId: 'warehouse-1',
        status: StocktakeStatus.IN_PROGRESS,
        scheduledDate: new Date(),
        startedAt: new Date(),
        items: [
          {
            itemId: 'item-1',
            itemSku: 'SKU001',
            itemName: 'Test Item',
            expectedQuantity: 100,
            countedQuantity: 95,
            variance: -5,
          },
        ],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedStocktake = {
        ...mockStocktake,
        status: StocktakeStatus.COMPLETED,
        completedAt: new Date(),
      };

      stocktakeRepository.findOne.mockResolvedValue(mockStocktake);
      stocktakeRepository.save.mockResolvedValue(updatedStocktake as Stocktake);
      inventoryService.recordStockMovement.mockResolvedValue({} as any);

      const result = await service.complete('stocktake-1', 'user-1');

      expect(result.status).toBe(StocktakeStatus.COMPLETED);
      expect(result.completedAt).toBeDefined();
      expect(inventoryService.recordStockMovement).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should not adjust inventory if variance is zero', async () => {
      const mockStocktake: Stocktake = {
        id: 'stocktake-1',
        reference: 'ST-001',
        warehouseId: 'warehouse-1',
        status: StocktakeStatus.IN_PROGRESS,
        scheduledDate: new Date(),
        startedAt: new Date(),
        items: [
          {
            itemId: 'item-1',
            itemSku: 'SKU001',
            itemName: 'Test Item',
            expectedQuantity: 100,
            countedQuantity: 100,
            variance: 0,
          },
        ],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedStocktake = {
        ...mockStocktake,
        status: StocktakeStatus.COMPLETED,
        completedAt: new Date(),
      };

      stocktakeRepository.findOne.mockResolvedValue(mockStocktake);
      stocktakeRepository.save.mockResolvedValue(updatedStocktake as Stocktake);

      await service.complete('stocktake-1', 'user-1');

      expect(inventoryService.recordStockMovement).not.toHaveBeenCalled();
    });

    it('should throw error if stocktake is not in IN_PROGRESS status', async () => {
      const mockStocktake: Stocktake = {
        id: 'stocktake-1',
        reference: 'ST-001',
        warehouseId: 'warehouse-1',
        status: StocktakeStatus.PLANNED,
        scheduledDate: new Date(),
        items: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      stocktakeRepository.findOne.mockResolvedValue(mockStocktake);

      await expect(service.complete('stocktake-1', 'user-1')).rejects.toThrow(
        'Stocktake can only be completed from IN_PROGRESS status',
      );
    });
  });

  describe('list', () => {
    it('should return all stocktakes when no warehouseId provided', async () => {
      const mockStocktakes: Stocktake[] = [
        {
          id: 'stocktake-1',
          reference: 'ST-001',
          warehouseId: 'warehouse-1',
          status: StocktakeStatus.COMPLETED,
          scheduledDate: new Date(),
          items: [],
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      stocktakeRepository.find.mockResolvedValue(mockStocktakes);

      const result = await service.list();

      expect(result).toEqual(mockStocktakes);
      expect(stocktakeRepository.find).toHaveBeenCalledWith({
        where: {},
        order: { scheduledDate: 'DESC' },
      });
    });

    it('should filter by warehouseId', async () => {
      const mockStocktakes: Stocktake[] = [
        {
          id: 'stocktake-1',
          reference: 'ST-001',
          warehouseId: 'warehouse-1',
          status: StocktakeStatus.COMPLETED,
          scheduledDate: new Date(),
          items: [],
          createdBy: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      stocktakeRepository.find.mockResolvedValue(mockStocktakes);

      const result = await service.list('warehouse-1');

      expect(result).toEqual(mockStocktakes);
      expect(stocktakeRepository.find).toHaveBeenCalledWith({
        where: { warehouseId: 'warehouse-1' },
        order: { scheduledDate: 'DESC' },
      });
    });
  });

  describe('findById', () => {
    it('should find stocktake by id', async () => {
      const mockStocktake: Stocktake = {
        id: 'stocktake-1',
        reference: 'ST-001',
        warehouseId: 'warehouse-1',
        status: StocktakeStatus.PLANNED,
        scheduledDate: new Date(),
        items: [],
        createdBy: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      stocktakeRepository.findOne.mockResolvedValue(mockStocktake);

      const result = await service.findById('stocktake-1');

      expect(result).toEqual(mockStocktake);
      expect(stocktakeRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'stocktake-1' },
      });
    });
  });
});

