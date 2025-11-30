import { Test, TestingModule } from '@nestjs/testing';
import { SchedulerRegistry } from '@nestjs/schedule';
import { AutomationService } from './automation.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { Item } from '../../inventory/entities/item.entity';

describe('AutomationService', () => {
  let service: AutomationService;
  let inventoryService: InventoryService;
  let schedulerRegistry: SchedulerRegistry;

  const mockInventoryService = {
    listItems: jest.fn(),
  };

  const mockSchedulerRegistry = {
    addCronJob: jest.fn(),
    deleteCronJob: jest.fn(),
    getCronJobs: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationService,
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: SchedulerRegistry,
          useValue: mockSchedulerRegistry,
        },
      ],
    }).compile();

    service = module.get<AutomationService>(AutomationService);
    inventoryService = module.get<InventoryService>(InventoryService);
    schedulerRegistry = module.get<SchedulerRegistry>(SchedulerRegistry);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkReorderLevels', () => {
    it('should identify low stock items', async () => {
      const items = [
        {
          id: '1',
          sku: 'ITEM001',
          name: 'Item 1',
          quantityOnHand: 5,
          reorderLevel: 10,
        },
        {
          id: '2',
          sku: 'ITEM002',
          name: 'Item 2',
          quantityOnHand: 20,
          reorderLevel: 10,
        },
      ];

      mockInventoryService.listItems.mockResolvedValue(items);

      // Mock console.log to avoid output during tests
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.checkReorderLevels();

      expect(mockInventoryService.listItems).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('scheduleReport', () => {
    it('should schedule a report', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await service.scheduleReport('inventory', '0 0 * * *', ['user1@example.com']);

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('inventory'),
      );

      consoleSpy.mockRestore();
    });
  });
});
