import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotationPricingService } from './quotation-pricing.service';
import { CustomerQuotation } from '../entities/customer-quotation.entity';
import { PriceList, PriceListType } from '../entities/price-list.entity';
import { Discount } from '../entities/discount.entity';
import { Customer } from '../entities/customer.entity';
import { InventoryService } from '../../inventory/services/inventory.service';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('QuotationPricingService', () => {
  let service: QuotationPricingService;
  let quotationRepository: Repository<CustomerQuotation>;
  let priceListRepository: Repository<PriceList>;
  let discountRepository: Repository<Discount>;
  let inventoryService: InventoryService;

  const mockQuotationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockPriceListRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDiscountRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  const mockCustomerRepository = {
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
        QuotationPricingService,
        {
          provide: getRepositoryToken(CustomerQuotation),
          useValue: mockQuotationRepository,
        },
        {
          provide: getRepositoryToken(PriceList),
          useValue: mockPriceListRepository,
        },
        {
          provide: getRepositoryToken(Discount),
          useValue: mockDiscountRepository,
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

    service = module.get<QuotationPricingService>(QuotationPricingService);
    quotationRepository = module.get<Repository<CustomerQuotation>>(
      getRepositoryToken(CustomerQuotation),
    );
    priceListRepository = module.get<Repository<PriceList>>(
      getRepositoryToken(PriceList),
    );
    discountRepository = module.get<Repository<Discount>>(getRepositoryToken(Discount));
    inventoryService = module.get<InventoryService>(InventoryService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createQuotation', () => {
    it('should create a new quotation', async () => {
      const dto = {
        reference: 'QT001',
        customerId: '1',
        items: [
          {
            itemId: 'item1',
            quantity: 10,
            unitPrice: 1000,
          },
        ],
        validUntil: new Date().toISOString(),
      };

      const customer = { id: '1', name: 'Test Customer' };
      const item = {
        id: 'item1',
        sku: 'ITEM001',
        name: 'Test Item',
      };

      const quotation = {
        id: '1',
        ...dto,
        status: 'DRAFT',
        totalAmount: 10000,
        createdBy: 'actor1',
      };

      mockCustomerRepository.findOne.mockResolvedValue(customer);
      mockInventoryService.getItemById.mockResolvedValue(item);
      mockQuotationRepository.create.mockReturnValue(quotation);
      mockQuotationRepository.save.mockResolvedValue(quotation);

      const result = await service.createQuotation(dto, 'actor1');

      expect(mockCustomerRepository.findOne).toHaveBeenCalled();
      expect(mockInventoryService.getItemById).toHaveBeenCalled();
      expect(result).toEqual(quotation);
    });
  });

  describe('getPriceForItem', () => {
    it('should return price from customer-specific price list', async () => {
      const priceList = {
        id: '1',
        type: PriceListType.CUSTOMER_SPECIFIC,
        customerId: '1',
        items: [
          {
            itemId: 'item1',
            unitPrice: 900,
          },
        ],
        isActive: true,
      };

      mockPriceListRepository.findOne.mockResolvedValue(priceList);

      const result = await service.getPriceForItem('item1', '1', 10);

      expect(result).toBe(900);
    });

    it('should return price from standard price list if no customer-specific', async () => {
      const priceList = {
        id: '1',
        type: PriceListType.STANDARD,
        items: [
          {
            itemId: 'item1',
            unitPrice: 1000,
          },
        ],
        isActive: true,
      };

      mockPriceListRepository.findOne
        .mockResolvedValueOnce(null) // Customer-specific not found
        .mockResolvedValueOnce(priceList); // Standard found

      const result = await service.getPriceForItem('item1', '1', 10);

      expect(result).toBe(1000);
    });
  });

  describe('applyDiscount', () => {
    it('should apply percentage discount', async () => {
      const discount = {
        id: '1',
        code: 'DISCOUNT10',
        type: 'PERCENTAGE',
        value: 10,
        isActive: true,
        validFrom: new Date(Date.now() - 86400000),
        validUntil: new Date(Date.now() + 86400000),
      };

      mockDiscountRepository.findOne.mockResolvedValue(discount);

      const result = await service.applyDiscount('DISCOUNT10', 1000);

      expect(result).toBe(100);
    });

    it('should apply fixed amount discount', async () => {
      const discount = {
        id: '1',
        code: 'DISCOUNT50',
        type: 'FIXED_AMOUNT',
        value: 50,
        isActive: true,
        validFrom: new Date(Date.now() - 86400000),
        validUntil: new Date(Date.now() + 86400000),
      };

      mockDiscountRepository.findOne.mockResolvedValue(discount);

      const result = await service.applyDiscount('DISCOUNT50', 1000);

      expect(result).toBe(50);
    });

    it('should throw error if discount not found', async () => {
      mockDiscountRepository.findOne.mockResolvedValue(null);

      await expect(service.applyDiscount('INVALID', 1000)).rejects.toThrow(
        'Discount INVALID not found',
      );
    });
  });
});
