import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Item } from '../entities/item.entity';
import { Batch } from '../entities/batch.entity';
import { BatchService } from './batch.service';
import { CreateBatchDto } from '../dto/create-batch.dto';

describe('BatchService', () => {
  let service: BatchService;
  let batchRepository: jest.Mocked<Repository<Batch>>;
  let itemRepository: jest.Mocked<Repository<Item>>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BatchService,
        {
          provide: getRepositoryToken(Batch),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Item),
          useValue: {
            findOne: jest.fn(),
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

    service = module.get<BatchService>(BatchService);
    batchRepository = module.get(getRepositoryToken(Batch));
    itemRepository = module.get(getRepositoryToken(Item));
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new batch', async () => {
      const dto: CreateBatchDto = {
        batchNumber: 'BATCH-001',
        itemId: 'item-1',
        quantity: 100,
        productionDate: '2024-01-01',
        expiryDate: '2025-01-01',
        supplierBatchNumber: 'SUP-BATCH-001',
        notes: 'Test batch',
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

      const mockBatch: Batch = {
        id: 'batch-1',
        batchNumber: dto.batchNumber,
        itemId: dto.itemId,
        item: mockItem,
        quantity: dto.quantity,
        productionDate: new Date(dto.productionDate),
        expiryDate: new Date(dto.expiryDate!),
        supplierBatchNumber: dto.supplierBatchNumber,
        notes: dto.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      itemRepository.findOne.mockResolvedValue(mockItem);
      batchRepository.create.mockReturnValue(mockBatch as any);
      batchRepository.save.mockResolvedValue(mockBatch);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockBatch);
      expect(itemRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.itemId },
      });
      expect(batchRepository.create).toHaveBeenCalled();
      expect(batchRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if item not found', async () => {
      const dto: CreateBatchDto = {
        batchNumber: 'BATCH-001',
        itemId: 'invalid-item',
        quantity: 100,
        productionDate: '2024-01-01',
      };

      itemRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'Item invalid-item not found',
      );
    });
  });

  describe('list', () => {
    it('should return all batches when no itemId provided', async () => {
      const mockBatches: Batch[] = [
        {
          id: 'batch-1',
          batchNumber: 'BATCH-001',
          itemId: 'item-1',
          quantity: 100,
          productionDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Batch,
      ];

      batchRepository.find.mockResolvedValue(mockBatches);

      const result = await service.list();

      expect(result).toEqual(mockBatches);
      expect(batchRepository.find).toHaveBeenCalledWith({
        relations: ['item'],
        order: { productionDate: 'DESC' },
      });
    });

    it('should return batches filtered by itemId', async () => {
      const mockBatches: Batch[] = [
        {
          id: 'batch-1',
          batchNumber: 'BATCH-001',
          itemId: 'item-1',
          quantity: 100,
          productionDate: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Batch,
      ];

      batchRepository.find.mockResolvedValue(mockBatches);

      const result = await service.list('item-1');

      expect(result).toEqual(mockBatches);
      expect(batchRepository.find).toHaveBeenCalledWith({
        where: { itemId: 'item-1' },
        relations: ['item'],
        order: { productionDate: 'DESC' },
      });
    });
  });

  describe('findByBatchNumber', () => {
    it('should find batch by batch number', async () => {
      const mockBatch: Batch = {
        id: 'batch-1',
        batchNumber: 'BATCH-001',
        itemId: 'item-1',
        quantity: 100,
        productionDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as Batch;

      batchRepository.findOne.mockResolvedValue(mockBatch);

      const result = await service.findByBatchNumber('BATCH-001');

      expect(result).toEqual(mockBatch);
      expect(batchRepository.findOne).toHaveBeenCalledWith({
        where: { batchNumber: 'BATCH-001' },
        relations: ['item'],
      });
    });
  });

  describe('getExpiringBatches', () => {
    it('should return batches expiring within specified days', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([]),
      };

      batchRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any,
      );

      await service.getExpiringBatches(30);

      expect(batchRepository.createQueryBuilder).toHaveBeenCalledWith('batch');
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalled();
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
    });
  });
});

