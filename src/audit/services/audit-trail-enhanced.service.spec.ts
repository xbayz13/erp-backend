import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditTrailEnhancedService } from './audit-trail-enhanced.service';
import { EntityVersion } from '../entities/entity-version.entity';
import { AuditLog } from '../entities/audit-log.entity';

describe('AuditTrailEnhancedService', () => {
  let service: AuditTrailEnhancedService;
  let entityVersionRepository: Repository<EntityVersion>;
  let auditLogRepository: Repository<AuditLog>;

  const mockEntityVersionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuditLogRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditTrailEnhancedService,
        {
          provide: getRepositoryToken(EntityVersion),
          useValue: mockEntityVersionRepository,
        },
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<AuditTrailEnhancedService>(AuditTrailEnhancedService);
    entityVersionRepository = module.get<Repository<EntityVersion>>(
      getRepositoryToken(EntityVersion),
    );
    auditLogRepository = module.get<Repository<AuditLog>>(
      getRepositoryToken(AuditLog),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('saveVersion', () => {
    it('should save a new version of an entity', async () => {
      const data = { name: 'Test Item', quantity: 100 };
      const version = {
        id: '1',
        entityType: 'Item',
        entityId: 'item1',
        version: 1,
        data,
        changedBy: 'user1',
        changedAt: new Date(),
      };

      mockEntityVersionRepository.find.mockResolvedValue([]);
      mockEntityVersionRepository.create.mockReturnValue(version);
      mockEntityVersionRepository.save.mockResolvedValue(version);

      const result = await service.saveVersion(
        'Item',
        'item1',
        data,
        'user1',
      );

      expect(mockEntityVersionRepository.create).toHaveBeenCalled();
      expect(result.version).toBe(1);
    });

    it('should increment version number for existing entity', async () => {
      const existingVersion = {
        id: '1',
        entityType: 'Item',
        entityId: 'item1',
        version: 2,
        data: {},
        changedBy: 'user1',
        changedAt: new Date(),
      };

      const newVersion = {
        id: '2',
        entityType: 'Item',
        entityId: 'item1',
        version: 3,
        data: { name: 'Updated Item' },
        changedBy: 'user2',
        changedAt: new Date(),
      };

      mockEntityVersionRepository.find.mockResolvedValue([existingVersion]);
      mockEntityVersionRepository.create.mockReturnValue(newVersion);
      mockEntityVersionRepository.save.mockResolvedValue(newVersion);

      const result = await service.saveVersion(
        'Item',
        'item1',
        { name: 'Updated Item' },
        'user2',
      );

      expect(result.version).toBe(3);
    });
  });

  describe('getVersionHistory', () => {
    it('should return version history for an entity', async () => {
      const versions = [
        {
          id: '1',
          entityType: 'Item',
          entityId: 'item1',
          version: 2,
          data: {},
          changedBy: 'user1',
          changedAt: new Date(),
        },
        {
          id: '2',
          entityType: 'Item',
          entityId: 'item1',
          version: 1,
          data: {},
          changedBy: 'user1',
          changedAt: new Date(),
        },
      ];

      mockEntityVersionRepository.find.mockResolvedValue(versions);

      const result = await service.getVersionHistory('Item', 'item1');

      expect(mockEntityVersionRepository.find).toHaveBeenCalledWith({
        where: { entityType: 'Item', entityId: 'item1' },
        order: { version: 'DESC' },
      });
      expect(result).toEqual(versions);
    });
  });

  describe('getVersionAtPoint', () => {
    it('should return specific version', async () => {
      const version = {
        id: '1',
        entityType: 'Item',
        entityId: 'item1',
        version: 2,
        data: {},
        changedBy: 'user1',
        changedAt: new Date(),
      };

      mockEntityVersionRepository.findOne.mockResolvedValue(version);

      const result = await service.getVersionAtPoint('Item', 'item1', 2);

      expect(mockEntityVersionRepository.findOne).toHaveBeenCalledWith({
        where: { entityType: 'Item', entityId: 'item1', version: 2 },
      });
      expect(result).toEqual(version);
    });
  });

  describe('queryAuditTrail', () => {
    it('should query audit logs with filters', async () => {
      const logs = [
        {
          id: '1',
          actorId: 'user1',
          action: 'CREATE',
          entity: 'Item',
          entityId: 'item1',
          createdAt: new Date(),
        },
      ];

      mockAuditLogRepository.find.mockResolvedValue(logs);

      const result = await service.queryAuditTrail({
        entityType: 'Item',
        entityId: 'item1',
      });

      expect(mockAuditLogRepository.find).toHaveBeenCalled();
      expect(result).toEqual(logs);
    });
  });
});

