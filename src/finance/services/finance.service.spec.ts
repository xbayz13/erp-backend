import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { PurchasingService } from '../../purchasing/services/purchasing.service';
import { FinancialTransaction, FinancialTransactionType } from '../entities/financial-transaction.entity';
import { Invoice, InvoiceStatus } from '../entities/invoice.entity';
import { FinanceService } from './finance.service';

describe('FinanceService', () => {
  let service: FinanceService;
  let transactionRepository: jest.Mocked<Repository<FinancialTransaction>>;
  let invoiceRepository: jest.Mocked<Repository<Invoice>>;
  let purchasingService: jest.Mocked<PurchasingService>;
  let auditLogService: jest.Mocked<AuditLogService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinanceService,
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Invoice),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: PurchasingService,
          useValue: {
            findById: jest.fn(),
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

    service = module.get<FinanceService>(FinanceService);
    transactionRepository = module.get(getRepositoryToken(FinancialTransaction));
    invoiceRepository = module.get(getRepositoryToken(Invoice));
    purchasingService = module.get(PurchasingService);
    auditLogService = module.get(AuditLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('recordTransaction', () => {
    it('should record a new financial transaction', async () => {
      const dto = {
        type: FinancialTransactionType.EXPENSE,
        amount: 100000,
        currency: 'IDR',
        description: 'Test expense',
        reference: 'REF-001',
      };

      const mockTransaction: FinancialTransaction = {
        id: 'tx-1',
        ...dto,
        createdBy: 'user-1',
        createdAt: new Date(),
      };

      transactionRepository.create.mockReturnValue(mockTransaction as any);
      transactionRepository.save.mockResolvedValue(mockTransaction);

      const result = await service.recordTransaction(dto, 'user-1');

      expect(result).toEqual(mockTransaction);
      expect(transactionRepository.create).toHaveBeenCalled();
      expect(transactionRepository.save).toHaveBeenCalled();
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('issueInvoice', () => {
    it('should issue a new invoice', async () => {
      const dto = {
        purchaseOrderId: 'po-1',
        amount: 1000000,
        currency: 'IDR',
        dueDate: new Date().toISOString(),
        notes: 'Test invoice',
      };

      const mockInvoice: Invoice = {
        id: 'inv-1',
        purchaseOrderId: dto.purchaseOrderId,
        amount: dto.amount,
        currency: dto.currency,
        issuedAt: new Date(),
        dueDate: new Date(dto.dueDate),
        status: InvoiceStatus.ISSUED,
        notes: dto.notes,
        createdBy: 'user-1',
        updatedAt: new Date(),
      };

      purchasingService.findById.mockResolvedValue({
        id: 'po-1',
        supplierName: 'Supplier ABC',
        reference: 'PO-001',
        status: 'DRAFT',
        totalCost: 1000000,
        expectedDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        items: [],
        createdBy: 'user-1',
      } as any);
      invoiceRepository.create.mockReturnValue(mockInvoice as any);
      invoiceRepository.save.mockResolvedValue(mockInvoice);

      const result = await service.issueInvoice(dto, 'user-1');

      expect(result).toEqual(mockInvoice);
      expect(result.status).toBe(InvoiceStatus.ISSUED);
      expect(auditLogService.record).toHaveBeenCalled();
    });
  });

  describe('listTransactions', () => {
    it('should return an array of transactions', async () => {
      const mockTransactions: FinancialTransaction[] = [
        {
          id: 'tx-1',
          type: FinancialTransactionType.EXPENSE,
          amount: 100000,
          currency: 'IDR',
          description: 'Test',
          createdBy: 'user-1',
          createdAt: new Date(),
        },
      ];

      transactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.listTransactions();

      expect(result).toEqual(mockTransactions);
    });
  });

  describe('listInvoices', () => {
    it('should return an array of invoices', async () => {
      const mockInvoices: Invoice[] = [
        {
          id: 'inv-1',
          purchaseOrderId: 'po-1',
          amount: 1000000,
          currency: 'IDR',
          issuedAt: new Date(),
          dueDate: new Date(),
          status: InvoiceStatus.ISSUED,
          createdBy: 'user-1',
          updatedAt: new Date(),
        },
      ];

      invoiceRepository.find.mockResolvedValue(mockInvoices);

      const result = await service.listInvoices();

      expect(result).toEqual(mockInvoices);
    });
  });
});

