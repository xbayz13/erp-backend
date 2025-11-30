import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BOMService } from './bom.service';
import { BOM } from '../entities/bom.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Item } from '../../inventory/entities/item.entity';

describe('BOMService', () => {
  let service: BOMService;
  let bomRepository: Repository<BOM>;
  let inventoryService: InventoryService;

  const mockBOMRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockInventoryService = {
    getItemById: jest.fn(),
  };

  const mockAuditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BOMService,
        {
          provide: getRepositoryToken(BOM),
          useValue: mockBOMRepository,
        },
        {
          provide: InventoryService,
          useValue: mockInventoryService,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<BOMService>(BOMService);
    bomRepository = module.get<Repository<BOM>>(getRepositoryToken(BOM));
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new BOM', async () => {
      const productItem = {
        id: 'product1',
        sku: 'PROD001',
        name: 'Product 1',
        unitCost: 1000,
      };

      const materialItem = {
        id: 'material1',
        sku: 'MAT001',
        name: 'Material 1',
        unitCost: 500,
      };

      const bom = {
        id: '1',
        code: 'BOM001',
        productItemId: 'product1',
        items: [
          {
            itemId: 'material1',
            itemSku: 'MAT001',
            itemName: 'Material 1',
            quantity: 2,
            unitOfMeasure: 'pcs',
            level: 1,
          },
        ],
        totalCost: 1000,
        quantity: 1,
        level: 1,
        isActive: true,
      };

      mockInventoryService.getItemById
        .mockResolvedValueOnce(productItem)
        .mockResolvedValueOnce(materialItem);

      mockBOMRepository.create.mockReturnValue(bom);
      mockBOMRepository.save.mockResolvedValue(bom);

      const result = await service.create(
        'BOM001',
        'product1',
        [
          {
            itemId: 'material1',
            quantity: 2,
            unitOfMeasure: 'pcs',
          },
        ],
        1,
        'actor1',
      );

      // Called for product item + material item + for cost calculation
      expect(mockInventoryService.getItemById).toHaveBeenCalled();
      expect(result).toEqual(bom);
    });
  });

  describe('explodeBOM', () => {
    it('should explode BOM with quantity multiplier', async () => {
      const bom = {
        id: '1',
        items: [
          {
            itemId: 'material1',
            quantity: 2,
            unitOfMeasure: 'pcs',
          },
        ],
      };

      mockBOMRepository.findOne.mockResolvedValue(bom);

      const result = await service.explodeBOM('1', 5);

      expect(result[0].quantity).toBe(10); // 2 * 5
    });
  });

  describe('list', () => {
    it('should return list of BOMs', async () => {
      const boms = [
        { id: '1', code: 'BOM001' },
        { id: '2', code: 'BOM002' },
      ];

      mockBOMRepository.find.mockResolvedValue(boms);

      const result = await service.list();

      expect(mockBOMRepository.find).toHaveBeenCalled();
      expect(result).toEqual(boms);
    });

    it('should filter by productItemId if provided', async () => {
      const boms = [{ id: '1', code: 'BOM001', productItemId: 'product1' }];

      mockBOMRepository.find.mockResolvedValue(boms);

      const result = await service.list('product1');

      expect(mockBOMRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, productItemId: 'product1' },
        order: { code: 'ASC' },
      });
      expect(result).toEqual(boms);
    });
  });
});
