import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkCenterService } from './work-center.service';
import { WorkCenter } from '../entities/work-center.entity';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('WorkCenterService', () => {
  let service: WorkCenterService;
  let workCenterRepository: Repository<WorkCenter>;
  let auditLogService: AuditLogService;

  const mockWorkCenterRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkCenterService,
        {
          provide: getRepositoryToken(WorkCenter),
          useValue: mockWorkCenterRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<WorkCenterService>(WorkCenterService);
    workCenterRepository = module.get<Repository<WorkCenter>>(
      getRepositoryToken(WorkCenter),
    );
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new work center', async () => {
      const workCenter = {
        id: '1',
        code: 'WC001',
        name: 'Assembly Line 1',
        capacity: 8,
        efficiency: 90,
        hourlyRate: 50000,
        isActive: true,
      };

      mockWorkCenterRepository.create.mockReturnValue(workCenter);
      mockWorkCenterRepository.save.mockResolvedValue(workCenter);

      const result = await service.create('WC001', 'Assembly Line 1', 8, 50000, 'actor1', 90);

      expect(mockWorkCenterRepository.create).toHaveBeenCalled();
      expect(mockWorkCenterRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.record).toHaveBeenCalled();
      expect(result).toEqual(workCenter);
    });
  });

  describe('list', () => {
    it('should return list of work centers', async () => {
      const workCenters = [
        { id: '1', code: 'WC001', name: 'Work Center 1' },
        { id: '2', code: 'WC002', name: 'Work Center 2' },
      ];

      mockWorkCenterRepository.find.mockResolvedValue(workCenters);

      const result = await service.list();

      expect(mockWorkCenterRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { code: 'ASC' },
      });
      expect(result).toEqual(workCenters);
    });
  });

  describe('calculateCapacity', () => {
    it('should calculate effective capacity based on efficiency', async () => {
      const workCenter = {
        id: '1',
        capacity: 8,
        efficiency: 90,
      };

      mockWorkCenterRepository.findOne.mockResolvedValue(workCenter);

      const result = await service.calculateCapacity('1', new Date());

      expect(result).toBe(7.2); // 8 * 0.9
    });
  });
});
