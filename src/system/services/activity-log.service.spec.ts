import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLogService } from './activity-log.service';
import { AuditLog } from '../../audit/entities/audit-log.entity';

describe('ActivityLogService', () => {
  let service: ActivityLogService;
  let auditLogRepository: Repository<AuditLog>;

  const mockAuditLogRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityLogService,
        {
          provide: getRepositoryToken(AuditLog),
          useValue: mockAuditLogRepository,
        },
      ],
    }).compile();

    service = module.get<ActivityLogService>(ActivityLogService);
    auditLogRepository = module.get<Repository<AuditLog>>(getRepositoryToken(AuditLog));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserActivity', () => {
    it('should return user activity logs', async () => {
      const logs = [
        { id: '1', actorId: 'user1', action: 'CREATE', entity: 'Item' },
        { id: '2', actorId: 'user1', action: 'UPDATE', entity: 'Item' },
      ];

      mockAuditLogRepository.find.mockResolvedValue(logs);

      const result = await service.getUserActivity('user1', 100);

      expect(mockAuditLogRepository.find).toHaveBeenCalledWith({
        where: { actorId: 'user1' },
        order: { createdAt: 'DESC' },
        take: 100,
      });
      expect(result).toEqual(logs);
    });
  });

  describe('getEntityActivity', () => {
    it('should return entity activity logs', async () => {
      const logs = [
        { id: '1', entity: 'Item', entityId: 'item1', action: 'CREATE' },
        { id: '2', entity: 'Item', entityId: 'item1', action: 'UPDATE' },
      ];

      mockAuditLogRepository.find.mockResolvedValue(logs);

      const result = await service.getEntityActivity('Item', 'item1');

      expect(mockAuditLogRepository.find).toHaveBeenCalledWith({
        where: { entity: 'Item', entityId: 'item1' },
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual(logs);
    });
  });

  describe('getRecentActivity', () => {
    it('should return recent activity logs', async () => {
      const logs = [
        { id: '1', action: 'CREATE', entity: 'Item' },
        { id: '2', action: 'UPDATE', entity: 'Item' },
      ];

      mockAuditLogRepository.find.mockResolvedValue(logs);

      const result = await service.getRecentActivity(50);

      expect(mockAuditLogRepository.find).toHaveBeenCalledWith({
        order: { createdAt: 'DESC' },
        take: 50,
      });
      expect(result).toEqual(logs);
    });
  });
});
