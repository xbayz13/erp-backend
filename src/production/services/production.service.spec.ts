import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { InventoryService } from '../../inventory/services/inventory.service';
import { ProductionOrder, ProductionStatus } from '../entities/production-order.entity';
import { ProductionService } from './production.service';

describe('ProductionService', () => {
  let service: ProductionService;
  let productionOrderRepository: jest.Mocked<Repository<ProductionOrder>>;
  let inventoryService: jest.Mocked<InventoryService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductionService,
        {
          provide: getRepositoryToken(ProductionOrder),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: InventoryService,
          useValue: {
            recordStockMovement: jest.fn(),
            createItem: jest.fn(),
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

    service = module.get<ProductionService>(ProductionService);
    productionOrderRepository = module.get(getRepositoryToken(ProductionOrder));
    inventoryService = module.get(InventoryService);
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new production order', async () => {
      const createDto = {
        code: 'PO-001',
        productItemId: 'item-1',
        quantityPlanned: 100,
        scheduledStart: new Date().toISOString(),
        scheduledEnd: new Date().toISOString(),
        supervisorId: 'user-1',
        outputWarehouseId: 'warehouse-1',
        materials: [
          {
            itemId: 'material-1',
            warehouseId: 'warehouse-1',
            quantity: 50,
          },
        ],
        notes: 'Test production',
      };

      const mockPO: ProductionOrder = {
        id: 'prod-1',
        code: createDto.code,
        productItemId: createDto.productItemId,
        quantityPlanned: createDto.quantityPlanned,
        quantityCompleted: 0,
        scheduledStart: new Date(createDto.scheduledStart),
        scheduledEnd: new Date(createDto.scheduledEnd),
        supervisorId: createDto.supervisorId,
        outputWarehouseId: createDto.outputWarehouseId,
        status: ProductionStatus.PLANNED,
        notes: createDto.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        materials: [],
      };

      productionOrderRepository.create.mockReturnValue(mockPO as any);
      productionOrderRepository.save.mockResolvedValue(mockPO);

      const result = await service.create(createDto, 'user-1');

      expect(result).toBeDefined();
      expect(result.code).toBe(createDto.code);
      expect(result.status).toBe(ProductionStatus.PLANNED);
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return an array of production orders', async () => {
      const mockPOs: ProductionOrder[] = [
        {
          id: 'prod-1',
          code: 'PO-001',
          productItemId: 'item-1',
          quantityPlanned: 100,
          quantityCompleted: 0,
          scheduledStart: new Date(),
          scheduledEnd: new Date(),
          supervisorId: 'user-1',
          outputWarehouseId: 'warehouse-1',
          status: ProductionStatus.PLANNED,
          createdAt: new Date(),
          updatedAt: new Date(),
          materials: [],
        },
      ];

      productionOrderRepository.find.mockResolvedValue(mockPOs);

      const result = await service.list();

      expect(result).toEqual(mockPOs);
    });
  });
});

