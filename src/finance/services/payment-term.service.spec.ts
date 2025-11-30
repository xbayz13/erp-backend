import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaymentTermService } from './payment-term.service';
import { PaymentTerm } from '../entities/payment-term.entity';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('PaymentTermService', () => {
  let service: PaymentTermService;
  let paymentTermRepository: Repository<PaymentTerm>;
  let auditLogService: AuditLogService;

  const mockPaymentTermRepository = {
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
        PaymentTermService,
        {
          provide: getRepositoryToken(PaymentTerm),
          useValue: mockPaymentTermRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<PaymentTermService>(PaymentTermService);
    paymentTermRepository = module.get<Repository<PaymentTerm>>(
      getRepositoryToken(PaymentTerm),
    );
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new payment term', async () => {
      const paymentTerm = {
        id: '1',
        code: 'NET30',
        name: 'Net 30',
        days: 30,
        isActive: true,
      };

      mockPaymentTermRepository.create.mockReturnValue(paymentTerm);
      mockPaymentTermRepository.save.mockResolvedValue(paymentTerm);

      const result = await service.create('NET30', 'Net 30', 30, 'actor1');

      expect(mockPaymentTermRepository.create).toHaveBeenCalled();
      expect(mockPaymentTermRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.record).toHaveBeenCalled();
      expect(result).toEqual(paymentTerm);
    });
  });

  describe('calculateDueDate', () => {
    it('should calculate due date correctly', async () => {
      const paymentTerm = {
        id: '1',
        code: 'NET30',
        days: 30,
        isActive: true,
      };

      mockPaymentTermRepository.findOne.mockResolvedValue(paymentTerm);

      const invoiceDate = new Date('2024-01-01');
      const result = await service.calculateDueDate(invoiceDate, 'NET30');

      const expectedDate = new Date('2024-01-31');
      expect(result.getTime()).toBe(expectedDate.getTime());
    });
  });

  describe('getAgingReport', () => {
    it('should calculate aging report correctly', async () => {
      const paymentTerm = {
        id: '1',
        code: 'NET30',
        days: 30,
        isActive: true,
      };

      mockPaymentTermRepository.findOne.mockResolvedValue(paymentTerm);

      const invoiceDate = new Date('2024-01-01');
      const currentDate = new Date('2024-02-15');
      const result = await service.getAgingReport(invoiceDate, 'NET30', currentDate);

      expect(result.daysOverdue).toBeGreaterThan(0);
      expect(result.isOverdue).toBe(true);
    });
  });
});
