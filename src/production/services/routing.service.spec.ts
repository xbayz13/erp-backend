import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RoutingService } from './routing.service';
import { Routing } from '../entities/routing.entity';
import { WorkCenterService } from './work-center.service';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { WorkCenter } from '../entities/work-center.entity';

describe('RoutingService', () => {
  let service: RoutingService;
  let routingRepository: Repository<Routing>;
  let workCenterService: WorkCenterService;

  const mockRoutingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockWorkCenterService = {
    list: jest.fn(),
  };

  const mockAuditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoutingService,
        {
          provide: getRepositoryToken(Routing),
          useValue: mockRoutingRepository,
        },
        {
          provide: WorkCenterService,
          useValue: mockWorkCenterService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<RoutingService>(RoutingService);
    routingRepository = module.get<Repository<Routing>>(getRepositoryToken(Routing));
    workCenterService = module.get<WorkCenterService>(WorkCenterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new routing', async () => {
      const workCenters = [
        {
          id: 'wc1',
          name: 'Work Center 1',
          hourlyRate: 50000,
        },
      ];

      const routing = {
        id: '1',
        code: 'ROU001',
        productItemId: 'product1',
        operations: [
          {
            operationNumber: 1,
            workCenterId: 'wc1',
            workCenterName: 'Work Center 1',
            operationName: 'Assembly',
            setupTime: 30,
            runTime: 10,
            queueTime: 5,
            moveTime: 2,
          },
        ],
        totalTime: 47,
        totalCost: 0,
        isActive: true,
      };

      mockWorkCenterService.list.mockResolvedValue(workCenters);
      mockRoutingRepository.create.mockReturnValue(routing);
      mockRoutingRepository.save.mockResolvedValue(routing);

      const result = await service.create(
        'ROU001',
        'product1',
        [
          {
            operationNumber: 1,
            workCenterId: 'wc1',
            operationName: 'Assembly',
            setupTime: 30,
            runTime: 10,
          },
        ],
        'actor1',
      );

      expect(mockWorkCenterService.list).toHaveBeenCalled();
      expect(result).toEqual(routing);
    });
  });

  describe('calculateProductionTime', () => {
    it('should calculate production time for given quantity', async () => {
      const routing = {
        id: '1',
        operations: [
          {
            setupTime: 30,
            runTime: 10,
            queueTime: 5,
            moveTime: 2,
          },
        ],
      };

      mockRoutingRepository.findOne.mockResolvedValue(routing);

      const result = await service.calculateProductionTime('1', 10);

      // setupTime + (runTime * quantity) + queueTime + moveTime
      // 30 + (10 * 10) + 5 + 2 = 137
      expect(result).toBe(137);
    });
  });
});
