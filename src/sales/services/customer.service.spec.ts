import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CustomerService } from './customer.service';
import { Customer } from '../entities/customer.entity';
import { SalesOrder, SalesOrderStatus } from '../entities/sales-order.entity';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('CustomerService', () => {
  let service: CustomerService;
  let customerRepository: Repository<Customer>;
  let salesOrderRepository: Repository<SalesOrder>;
  let auditLogService: AuditLogService;

  const mockCustomerRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSalesOrderRepository = {
    find: jest.fn(),
  };

  const mockAuditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomerService,
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(SalesOrder),
          useValue: mockSalesOrderRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<CustomerService>(CustomerService);
    customerRepository = module.get<Repository<Customer>>(getRepositoryToken(Customer));
    salesOrderRepository = module.get<Repository<SalesOrder>>(getRepositoryToken(SalesOrder));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new customer', async () => {
      const dto = {
        code: 'CUST001',
        name: 'Test Customer',
        email: 'test@example.com',
        creditLimit: 1000000,
      };

      const customer = {
        id: '1',
        ...dto,
        outstandingBalance: 0,
        totalOrders: 0,
        rating: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockCustomerRepository.findOne.mockResolvedValue(null);
      mockCustomerRepository.create.mockReturnValue(customer);
      mockCustomerRepository.save.mockResolvedValue(customer);

      const result = await service.create(dto, 'actor1');

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { code: dto.code },
      });
      expect(mockCustomerRepository.create).toHaveBeenCalled();
      expect(mockCustomerRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.record).toHaveBeenCalled();
      expect(result).toEqual(customer);
    });

    it('should throw error if customer code already exists', async () => {
      const dto = {
        code: 'CUST001',
        name: 'Test Customer',
      };

      mockCustomerRepository.findOne.mockResolvedValue({ id: '1', code: 'CUST001' });

      await expect(service.create(dto, 'actor1')).rejects.toThrow(
        'Customer with code CUST001 already exists',
      );
    });
  });

  describe('list', () => {
    it('should return list of customers', async () => {
      const customers = [
        { id: '1', name: 'Customer 1' },
        { id: '2', name: 'Customer 2' },
      ];

      mockCustomerRepository.find.mockResolvedValue(customers);

      const result = await service.list();

      expect(mockCustomerRepository.find).toHaveBeenCalledWith({
        order: { name: 'ASC' },
      });
      expect(result).toEqual(customers);
    });
  });

  describe('updateCreditLimit', () => {
    it('should update credit limit', async () => {
      const customer = {
        id: '1',
        code: 'CUST001',
        name: 'Test Customer',
        creditLimit: 1000000,
      };

      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockCustomerRepository.save.mockResolvedValue({
        ...customer,
        creditLimit: 2000000,
      });

      const result = await service.updateCreditLimit('1', 2000000, 'actor1');

      expect(mockCustomerRepository.findOne).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result.creditLimit).toBe(2000000);
      expect(mockAuditLogService.record).toHaveBeenCalled();
    });
  });

  describe('getCustomerAnalytics', () => {
    it('should return customer analytics', async () => {
      const customer = {
        id: '1',
        code: 'CUST001',
        name: 'Test Customer',
        creditLimit: 1000000,
        outstandingBalance: 0,
        totalOrders: 0,
      };

      const orders = [
        {
          id: '1',
          customerId: '1',
          status: SalesOrderStatus.DELIVERED,
          totalAmount: 500000,
        },
      ];

      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockSalesOrderRepository.find.mockResolvedValue(orders);
      mockCustomerRepository.save.mockResolvedValue({
        ...customer,
        totalOrders: 1,
        outstandingBalance: 0,
      });

      const result = await service.getCustomerAnalytics('1');

      expect(result.customer).toBeDefined();
      expect(result.metrics.totalOrders).toBe(1);
      expect(result.metrics.totalRevenue).toBe(500000);
    });
  });
});
