import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Item } from '../entities/item.entity';
import { SerialNumber } from '../entities/serial-number.entity';
import { SerialNumberService } from './serial-number.service';
import { CreateSerialNumberDto } from '../dto/create-serial-number.dto';

describe('SerialNumberService', () => {
  let service: SerialNumberService;
  let serialNumberRepository: jest.Mocked<Repository<SerialNumber>>;
  let itemRepository: jest.Mocked<Repository<Item>>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SerialNumberService,
        {
          provide: getRepositoryToken(SerialNumber),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
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

    service = module.get<SerialNumberService>(SerialNumberService);
    serialNumberRepository = module.get(getRepositoryToken(SerialNumber));
    itemRepository = module.get(getRepositoryToken(Item));
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new serial number', async () => {
      const dto: CreateSerialNumberDto = {
        serialNumber: 'SN-001',
        itemId: 'item-1',
        warehouseId: 'warehouse-1',
        warrantyStartDate: '2024-01-01',
        warrantyEndDate: '2025-01-01',
        status: 'AVAILABLE',
        notes: 'Test serial number',
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

      const mockSerialNumber: SerialNumber = {
        id: 'sn-1',
        serialNumber: dto.serialNumber,
        itemId: dto.itemId,
        item: mockItem,
        warehouseId: dto.warehouseId,
        warrantyStartDate: new Date(dto.warrantyStartDate!),
        warrantyEndDate: new Date(dto.warrantyEndDate!),
        status: dto.status,
        notes: dto.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      itemRepository.findOne.mockResolvedValue(mockItem);
      serialNumberRepository.findOne.mockResolvedValue(null);
      serialNumberRepository.create.mockReturnValue(mockSerialNumber as any);
      serialNumberRepository.save.mockResolvedValue(mockSerialNumber);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockSerialNumber);
      expect(itemRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.itemId },
      });
      expect(serialNumberRepository.findOne).toHaveBeenCalledWith({
        where: { serialNumber: dto.serialNumber },
      });
      expect(serialNumberRepository.create).toHaveBeenCalled();
      expect(serialNumberRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if item not found', async () => {
      const dto: CreateSerialNumberDto = {
        serialNumber: 'SN-001',
        itemId: 'invalid-item',
        warehouseId: 'warehouse-1',
      };

      itemRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'Item invalid-item not found',
      );
    });

    it('should throw error if serial number already exists', async () => {
      const dto: CreateSerialNumberDto = {
        serialNumber: 'SN-001',
        itemId: 'item-1',
        warehouseId: 'warehouse-1',
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

      const existingSerial: SerialNumber = {
        id: 'sn-existing',
        serialNumber: 'SN-001',
        itemId: 'item-1',
        item: mockItem,
        warehouseId: 'warehouse-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      itemRepository.findOne.mockResolvedValue(mockItem);
      serialNumberRepository.findOne.mockResolvedValue(existingSerial);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'Serial number SN-001 already exists',
      );
    });
  });

  describe('list', () => {
    it('should return all serial numbers when no filters provided', async () => {
      const mockSerialNumbers: SerialNumber[] = [
        {
          id: 'sn-1',
          serialNumber: 'SN-001',
          itemId: 'item-1',
          warehouseId: 'warehouse-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as SerialNumber,
      ];

      serialNumberRepository.find.mockResolvedValue(mockSerialNumbers);

      const result = await service.list();

      expect(result).toEqual(mockSerialNumbers);
      expect(serialNumberRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['item'],
        order: { createdAt: 'DESC' },
      });
    });

    it('should filter by itemId and warehouseId', async () => {
      const mockSerialNumbers: SerialNumber[] = [
        {
          id: 'sn-1',
          serialNumber: 'SN-001',
          itemId: 'item-1',
          warehouseId: 'warehouse-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        } as SerialNumber,
      ];

      serialNumberRepository.find.mockResolvedValue(mockSerialNumbers);

      const result = await service.list('item-1', 'warehouse-1');

      expect(result).toEqual(mockSerialNumbers);
      expect(serialNumberRepository.find).toHaveBeenCalledWith({
        where: { itemId: 'item-1', warehouseId: 'warehouse-1' },
        relations: ['item'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findBySerialNumber', () => {
    it('should find serial number by serial number', async () => {
      const mockSerialNumber: SerialNumber = {
        id: 'sn-1',
        serialNumber: 'SN-001',
        itemId: 'item-1',
        warehouseId: 'warehouse-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SerialNumber;

      serialNumberRepository.findOne.mockResolvedValue(mockSerialNumber);

      const result = await service.findBySerialNumber('SN-001');

      expect(result).toEqual(mockSerialNumber);
      expect(serialNumberRepository.findOne).toHaveBeenCalledWith({
        where: { serialNumber: 'SN-001' },
        relations: ['item'],
      });
    });
  });

  describe('updateStatus', () => {
    it('should update serial number status', async () => {
      const mockSerialNumber: SerialNumber = {
        id: 'sn-1',
        serialNumber: 'SN-001',
        itemId: 'item-1',
        warehouseId: 'warehouse-1',
        status: 'AVAILABLE',
        createdAt: new Date(),
        updatedAt: new Date(),
      } as SerialNumber;

      const updatedSerialNumber = {
        ...mockSerialNumber,
        status: 'IN_USE',
      };

      serialNumberRepository.findOne.mockResolvedValue(mockSerialNumber);
      serialNumberRepository.save.mockResolvedValue(
        updatedSerialNumber as SerialNumber,
      );

      const result = await service.updateStatus('sn-1', 'IN_USE', 'user-1');

      expect(result.status).toBe('IN_USE');
      expect(serialNumberRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'sn-1' },
      });
      expect(serialNumberRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if serial number not found', async () => {
      serialNumberRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateStatus('invalid-id', 'IN_USE', 'user-1'),
      ).rejects.toThrow('Serial number invalid-id not found');
    });
  });
});

