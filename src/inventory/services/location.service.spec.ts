import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Warehouse } from '../entities/warehouse.entity';
import { Location } from '../entities/location.entity';
import { LocationService } from './location.service';
import { CreateLocationDto } from '../dto/create-location.dto';

describe('LocationService', () => {
  let service: LocationService;
  let locationRepository: jest.Mocked<Repository<Location>>;
  let warehouseRepository: jest.Mocked<Repository<Warehouse>>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: getRepositoryToken(Location),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Warehouse),
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

    service = module.get<LocationService>(LocationService);
    locationRepository = module.get(getRepositoryToken(Location));
    warehouseRepository = module.get(getRepositoryToken(Warehouse));
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new location', async () => {
      const dto: CreateLocationDto = {
        name: 'Zone A',
        warehouseId: 'warehouse-1',
        type: 'ZONE',
        code: 'ZONE-A',
        description: 'Main zone',
        capacity: 1000,
      };

      const mockWarehouse: Warehouse = {
        id: 'warehouse-1',
        name: 'Main Warehouse',
        location: 'Jakarta',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLocation: Location = {
        id: 'location-1',
        name: dto.name,
        warehouseId: dto.warehouseId,
        warehouse: mockWarehouse,
        type: dto.type,
        code: dto.code,
        description: dto.description,
        capacity: dto.capacity,
        isActive: true,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      warehouseRepository.findOne.mockResolvedValue(mockWarehouse);
      locationRepository.create.mockReturnValue(mockLocation as any);
      locationRepository.save.mockResolvedValue(mockLocation);

      const result = await service.create(dto, 'user-1');

      expect(result).toEqual(mockLocation);
      expect(warehouseRepository.findOne).toHaveBeenCalledWith({
        where: { id: dto.warehouseId },
      });
      expect(locationRepository.create).toHaveBeenCalled();
      expect(locationRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });

    it('should throw error if warehouse not found', async () => {
      const dto: CreateLocationDto = {
        name: 'Zone A',
        warehouseId: 'invalid-warehouse',
        type: 'ZONE',
      };

      warehouseRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'Warehouse invalid-warehouse not found',
      );
    });

    it('should throw error if parent location not found', async () => {
      const dto: CreateLocationDto = {
        name: 'Bin 1',
        warehouseId: 'warehouse-1',
        parentId: 'invalid-parent',
        type: 'BIN',
      };

      const mockWarehouse: Warehouse = {
        id: 'warehouse-1',
        name: 'Main Warehouse',
        location: 'Jakarta',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      warehouseRepository.findOne.mockResolvedValue(mockWarehouse);
      locationRepository.findOne.mockResolvedValue(null);

      await expect(service.create(dto, 'user-1')).rejects.toThrow(
        'Parent location invalid-parent not found',
      );
    });
  });

  describe('list', () => {
    it('should return all locations when no warehouseId provided', async () => {
      const mockLocations: Location[] = [
        {
          id: 'location-1',
          name: 'Zone A',
          warehouseId: 'warehouse-1',
          type: 'ZONE',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as Location,
      ];

      locationRepository.find.mockResolvedValue(mockLocations);

      const result = await service.list();

      expect(result).toEqual(mockLocations);
      expect(locationRepository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['warehouse', 'parent', 'children'],
        order: { name: 'ASC' },
      });
    });

    it('should filter by warehouseId', async () => {
      const mockWarehouse: Warehouse = {
        id: 'warehouse-1',
        name: 'Main Warehouse',
        location: 'Jakarta',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLocations: Location[] = [
        {
          id: 'location-1',
          name: 'Zone A',
          warehouseId: 'warehouse-1',
          warehouse: mockWarehouse,
          type: 'ZONE',
          isActive: true,
          children: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      locationRepository.find.mockResolvedValue(mockLocations);

      const result = await service.list('warehouse-1');

      expect(result).toEqual(mockLocations);
      expect(locationRepository.find).toHaveBeenCalledWith({
        where: { warehouseId: 'warehouse-1' },
        relations: ['warehouse', 'parent', 'children'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('getHierarchy', () => {
    it('should return location hierarchy', async () => {
      const mockLocations: Location[] = [
        {
          id: 'location-1',
          name: 'Zone A',
          warehouseId: 'warehouse-1',
          warehouse: {
            id: 'warehouse-1',
            name: 'Main Warehouse',
            location: 'Jakarta',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          parentId: undefined,
          type: 'ZONE',
          isActive: true,
          children: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      locationRepository.find.mockResolvedValue(mockLocations);

      const result = await service.getHierarchy('warehouse-1');

      expect(result).toEqual(mockLocations);
      expect(locationRepository.find).toHaveBeenCalledWith({
        where: { warehouseId: 'warehouse-1', parentId: IsNull() },
        relations: ['children', 'warehouse'],
        order: { name: 'ASC' },
      });
    });
  });

  describe('findById', () => {
    it('should find location by id', async () => {
      const mockWarehouse: Warehouse = {
        id: 'warehouse-1',
        name: 'Main Warehouse',
        location: 'Jakarta',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockLocation: Location = {
        id: 'location-1',
        name: 'Zone A',
        warehouseId: 'warehouse-1',
        warehouse: mockWarehouse,
        type: 'ZONE',
        isActive: true,
        children: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      locationRepository.findOne.mockResolvedValue(mockLocation);

      const result = await service.findById('location-1');

      expect(result).toEqual(mockLocation);
      expect(locationRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'location-1' },
        relations: ['warehouse', 'parent', 'children'],
      });
    });
  });
});

