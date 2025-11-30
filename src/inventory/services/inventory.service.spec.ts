import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Item } from '../entities/item.entity';
import { StockMovement } from '../entities/stock-movement.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  let service: InventoryService;
  let itemRepository: jest.Mocked<Repository<Item>>;
  let warehouseRepository: jest.Mocked<Repository<Warehouse>>;
  let movementRepository: jest.Mocked<Repository<StockMovement>>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InventoryService,
        {
          provide: getRepositoryToken(Item),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Warehouse),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
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

    service = module.get<InventoryService>(InventoryService);
    itemRepository = module.get(getRepositoryToken(Item));
    warehouseRepository = module.get(getRepositoryToken(Warehouse));
    movementRepository = module.get(getRepositoryToken(StockMovement));
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listItems', () => {
    it('should return an array of items', async () => {
      const mockItems: Item[] = [
        {
          id: '1',
          sku: 'SKU001',
          name: 'Test Item',
          warehouseId: 'warehouse-1',
          quantityOnHand: 100,
          reorderLevel: 20,
          unitCost: 10000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      itemRepository.find.mockResolvedValue(mockItems);

      const result = await service.listItems();

      expect(result).toEqual(mockItems);
      expect(itemRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
    });
  });

  describe('createItem', () => {
    it('should create a new item', async () => {
      const mockWarehouse: Warehouse = {
        id: 'warehouse-1',
        name: 'Gudang Utama',
        location: 'Jakarta',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const createDto = {
        sku: 'SKU001',
        name: 'Test Item',
        warehouseId: 'warehouse-1',
        quantityOnHand: 100,
        reorderLevel: 20,
        unitCost: 10000,
      };

      const mockItem: Item = {
        id: 'item-1',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      warehouseRepository.findOne.mockResolvedValue(mockWarehouse);
      itemRepository.create.mockReturnValue(mockItem as any);
      itemRepository.save.mockResolvedValue(mockItem);

      const result = await service.createItem(createDto, 'user-1');

      expect(result).toEqual(mockItem);
      expect(warehouseRepository.findOne).toHaveBeenCalledWith({
        where: { id: createDto.warehouseId },
      });
      expect(itemRepository.create).toHaveBeenCalled();
      expect(itemRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if warehouse not found', async () => {
      warehouseRepository.findOne.mockResolvedValue(null);

      await expect(
        service.createItem(
          {
            sku: 'SKU001',
            name: 'Test Item',
            warehouseId: 'invalid-warehouse',
            quantityOnHand: 100,
            reorderLevel: 20,
            unitCost: 10000,
          },
          'user-1',
        ),
      ).rejects.toThrow('Warehouse invalid-warehouse not found');
    });
  });

  describe('updateItem', () => {
    it('should update an existing item', async () => {
      const existingItem: Item = {
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

      const updateDto = {
        name: 'Updated Item',
        quantityOnHand: 150,
      };

      itemRepository.findOne.mockResolvedValue(existingItem);
      itemRepository.save.mockResolvedValue({
        ...existingItem,
        ...updateDto,
      });

      const result = await service.updateItem('item-1', updateDto, 'user-1');

      expect(result.name).toBe('Updated Item');
      expect(result.quantityOnHand).toBe(150);
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('transferStock', () => {
    it('should transfer stock between warehouses', async () => {
      const sourceItem: Item = {
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

      const transferDto = {
        itemId: 'item-1',
        fromWarehouseId: 'warehouse-1',
        toWarehouseId: 'warehouse-2',
        quantity: 50,
        reference: 'TRANSFER-001',
        performedBy: 'user-1',
      };

      const targetItem: Item = {
        ...sourceItem,
        id: 'item-1',
        warehouseId: 'warehouse-2',
        quantityOnHand: 0,
      };

      itemRepository.findOne
        .mockResolvedValueOnce(sourceItem)
        .mockResolvedValueOnce(null);
      warehouseRepository.findOne
        .mockResolvedValueOnce({ id: 'warehouse-1', name: 'WH1' } as Warehouse)
        .mockResolvedValueOnce({ id: 'warehouse-2', name: 'WH2' } as Warehouse);

      itemRepository.create.mockReturnValue(targetItem as any);
      itemRepository.save
        .mockResolvedValueOnce({
          ...sourceItem,
          quantityOnHand: 50,
        })
        .mockResolvedValueOnce({
          ...targetItem,
          quantityOnHand: 50,
        });

      movementRepository.create.mockReturnValue({} as any);
      movementRepository.save
        .mockResolvedValueOnce({ id: 'mov-1' } as StockMovement)
        .mockResolvedValueOnce({ id: 'mov-2' } as StockMovement);

      const result = await service.transferStock(transferDto, 'user-1');

      expect(result.outbound).toBeDefined();
      expect(result.inbound).toBeDefined();
      expect(itemRepository.save).toHaveBeenCalledTimes(2);
      expect(itemRepository.create).toHaveBeenCalled();
    });
  });
});

