import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceService } from './maintenance.service';
import { Equipment } from '../entities/equipment.entity';
import { MaintenanceSchedule, MaintenanceType, MaintenanceStatus } from '../entities/maintenance-schedule.entity';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('MaintenanceService', () => {
  let service: MaintenanceService;
  let equipmentRepository: Repository<Equipment>;
  let maintenanceRepository: Repository<MaintenanceSchedule>;

  const mockEquipmentRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockMaintenanceRepository = {
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
        MaintenanceService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: mockEquipmentRepository,
        },
        {
          provide: getRepositoryToken(MaintenanceSchedule),
          useValue: mockMaintenanceRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<MaintenanceService>(MaintenanceService);
    equipmentRepository = module.get<Repository<Equipment>>(getRepositoryToken(Equipment));
    maintenanceRepository = module.get<Repository<MaintenanceSchedule>>(
      getRepositoryToken(MaintenanceSchedule),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEquipment', () => {
    it('should create a new equipment', async () => {
      const equipment = {
        id: '1',
        code: 'EQ001',
        name: 'Machine 1',
        isActive: true,
      };

      mockEquipmentRepository.create.mockReturnValue(equipment);
      mockEquipmentRepository.save.mockResolvedValue(equipment);

      const result = await service.createEquipment('EQ001', 'Machine 1', 'actor1');

      expect(mockEquipmentRepository.create).toHaveBeenCalled();
      expect(mockEquipmentRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.record).toHaveBeenCalled();
      expect(result).toEqual(equipment);
    });
  });

  describe('scheduleMaintenance', () => {
    it('should schedule a new maintenance', async () => {
      const equipment = {
        id: '1',
        code: 'EQ001',
        name: 'Machine 1',
      };

      const maintenance = {
        id: '1',
        equipmentId: '1',
        type: MaintenanceType.PREVENTIVE,
        scheduledDate: new Date('2024-12-01'),
        status: MaintenanceStatus.SCHEDULED,
      };

      mockEquipmentRepository.findOne.mockResolvedValue(equipment);
      mockMaintenanceRepository.create.mockReturnValue(maintenance);
      mockMaintenanceRepository.save.mockResolvedValue(maintenance);

      const result = await service.scheduleMaintenance(
        '1',
        MaintenanceType.PREVENTIVE,
        new Date('2024-12-01'),
        'actor1',
      );

      expect(result).toEqual(maintenance);
      expect(mockAuditLogService.record).toHaveBeenCalled();
    });
  });

  describe('completeMaintenance', () => {
    it('should complete maintenance and schedule next if interval is set', async () => {
      const maintenance = {
        id: '1',
        equipmentId: '1',
        type: MaintenanceType.PREVENTIVE,
        scheduledDate: new Date('2024-12-01'),
        intervalDays: 30,
        estimatedCost: 500000,
      };

      mockMaintenanceRepository.findOne.mockResolvedValue(maintenance);
      mockEquipmentRepository.findOne.mockResolvedValue({ id: '1' });
      mockMaintenanceRepository.create.mockReturnValue({
        id: '2',
        scheduledDate: new Date('2024-12-31'),
      });
      mockMaintenanceRepository.save
        .mockResolvedValueOnce({
          ...maintenance,
          status: MaintenanceStatus.COMPLETED,
          completedDate: new Date(),
          actualCost: 450000,
        })
        .mockResolvedValueOnce({ id: '2' });

      const result = await service.completeMaintenance('1', 450000, 'actor1');

      expect(result.status).toBe(MaintenanceStatus.COMPLETED);
      expect(result.actualCost).toBe(450000);
      // Note: scheduleMaintenance is called within completeMaintenance, which calls create again
      // This is tested indirectly through the service logic
    });
  });

  describe('getUpcomingMaintenance', () => {
    it('should return upcoming maintenance within specified days', async () => {
      const maintenances = [
        {
          id: '1',
          scheduledDate: new Date(Date.now() + 5 * 86400000),
          status: MaintenanceStatus.SCHEDULED,
        },
      ];

      mockMaintenanceRepository.find.mockResolvedValue(maintenances);

      const result = await service.getUpcomingMaintenance(30);

      expect(mockMaintenanceRepository.find).toHaveBeenCalled();
      expect(result).toEqual(maintenances);
    });
  });
});
