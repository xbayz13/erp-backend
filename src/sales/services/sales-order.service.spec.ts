import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SalesOrderService } from './sales-order.service';
import { SalesOrder, SalesOrderStatus } from '../entities/sales-order.entity';
import { Customer } from '../entities/customer.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Item } from '../../inventory/entities/item.entity';

describe('SalesOrderService', () => {
  let service: SalesOrderService;
  let salesOrderRepository: Repository<SalesOrder>;
  let customerRepository: Repository<Customer>;
  let inventoryService: InventoryService;
  let auditLogService: AuditLogService;

  const mockSalesOrderRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockCustomerRepository = {
    findOne: jest.fn(),
  };

  const mockInventoryService = {
    getItemById: jest.fn(),
    recordStockMovement: jest.fn(),
  };

  const mockAuditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalesOrderService,
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: mockSalesOrderRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
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

    service = module.get<SalesOrderService>(SalesOrderService);
    salesOrderRepository = module.get<Repository<SalesOrder>>(
      getRepositoryToken(SalesOrder),
    );
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    inventoryService = module.get<InventoryService>(InventoryService);
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new sales order', async () => {
      const dto = {
        reference: 'SO001',
        customerId: '1',
        items: [
          {
            itemId: 'item1',
            quantity: 10,
            unitPrice: 1000,
            warehouseId: 'warehouse1',
          },
        ],
      };

      const customer = { id: '1', name: 'Test Customer' };
      const item = {
        id: 'item1',
        sku: 'ITEM001',
        name: 'Test Item',
        quantityOnHand: 100,
      };

      const salesOrder = {
        id: '1',
        ...dto,
        status: SalesOrderStatus.DRAFT,
        totalAmount: 10000,
        createdBy: 'actor1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockInventoryService.getItemById.mockResolvedValue(item);
      mockSalesOrderRepository.create.mockReturnValue(salesOrder);
      mockSalesOrderRepository.save.mockResolvedValue(salesOrder);

      const result = await service.create(dto, 'actor1');

      expect(mockCustomerRepository.findOne).toHaveBeenCalled();
      expect(mockInventoryService.getItemById).toHaveBeenCalled();
      expect(result).toEqual(salesOrder);
    });
  });

  describe('confirm', () => {
    it('should confirm a sales order', async () => {
      const order = {
        id: '1',
        reference: 'SO001',
        status: SalesOrderStatus.DRAFT,
        items: [
          {
            itemId: 'item1',
            quantity: 10,
            warehouseId: 'warehouse1',
            itemSku: 'ITEM001',
            itemName: 'Test Item',
            unitPrice: 1000,
            totalPrice: 10000,
          },
        ],
      };

      const item = {
        id: 'item1',
        sku: 'ITEM001',
        name: 'Test Item',
        quantityOnHand: 100,
      };

      mockSalesOrderRepository.findOne.mockResolvedValue(order);
      mockInventoryService.getItemById.mockResolvedValue(item);
      mockInventoryService.recordStockMovement.mockResolvedValue({});
      mockSalesOrderRepository.save.mockResolvedValue({
        ...order,
        status: SalesOrderStatus.CONFIRMED,
        orderDate: new Date(),
      });

      const result = await service.confirm('1', 'actor1');

      expect(result.status).toBe(SalesOrderStatus.CONFIRMED);
      expect(mockInventoryService.recordStockMovement).toHaveBeenCalled();
    });

    it('should throw error if insufficient stock', async () => {
      const order = {
        id: '1',
        status: SalesOrderStatus.DRAFT,
        items: [{ itemId: 'item1', quantity: 100, warehouseId: 'warehouse1' }],
      };

      const item = {
        id: 'item1',
        sku: 'ITEM001',
        name: 'Test Item',
        quantityOnHand: 10,
      };

      mockSalesOrderRepository.findOne.mockResolvedValue(order);
      mockInventoryService.getItemById.mockResolvedValue(item);

      await expect(service.confirm('1', 'actor1')).rejects.toThrow('Insufficient stock');
    });
  });

  describe('ship', () => {
    it('should ship a sales order', async () => {
      const order = {
        id: '1',
        status: SalesOrderStatus.CONFIRMED,
      };

      mockSalesOrderRepository.findOne.mockResolvedValue(order);
      mockSalesOrderRepository.save.mockResolvedValue({
        ...order,
        status: SalesOrderStatus.SHIPPED,
        shippedDate: new Date(),
      });

      const result = await service.ship('1', 'actor1');

      expect(result.status).toBe(SalesOrderStatus.SHIPPED);
      expect(result.shippedDate).toBeDefined();
    });
  });

  describe('deliver', () => {
    it('should deliver a sales order', async () => {
      const order = {
        id: '1',
        status: SalesOrderStatus.SHIPPED,
      };

      mockSalesOrderRepository.findOne.mockResolvedValue(order);
      mockSalesOrderRepository.save.mockResolvedValue({
        ...order,
        status: SalesOrderStatus.DELIVERED,
        deliveredDate: new Date(),
      });

      const result = await service.deliver('1', 'actor1');

      expect(result.status).toBe(SalesOrderStatus.DELIVERED);
      expect(result.deliveredDate).toBeDefined();
    });
  });
});
