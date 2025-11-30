import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankReconciliationService } from './bank-reconciliation.service';
import { BankAccount } from '../entities/bank-account.entity';
import { BankTransaction, ReconciliationStatus, BankTransactionType } from '../entities/bank-transaction.entity';
import { FinancialTransaction } from '../entities/financial-transaction.entity';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('BankReconciliationService', () => {
  let service: BankReconciliationService;
  let bankAccountRepository: Repository<BankAccount>;
  let bankTransactionRepository: Repository<BankTransaction>;
  let auditLogService: AuditLogService;

  const mockBankAccountRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockBankTransactionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockFinancialTransactionRepository = {
    findOne: jest.fn(),
  };

  const mockAuditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BankReconciliationService,
        {
          provide: getRepositoryToken(BankAccount),
          useValue: mockBankAccountRepository,
        },
        {
          provide: getRepositoryToken(BankTransaction),
          useValue: mockBankTransactionRepository,
        },
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockFinancialTransactionRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<BankReconciliationService>(BankReconciliationService);
    bankAccountRepository = module.get<Repository<BankAccount>>(
      getRepositoryToken(BankAccount),
    );
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBankAccount', () => {
    it('should create a new bank account', async () => {
      const account = {
        id: '1',
        accountNumber: '1234567890',
        accountName: 'Main Account',
        bankName: 'Bank ABC',
        currency: 'IDR',
        balance: 0,
        isActive: true,
      };

      mockBankAccountRepository.create.mockReturnValue(account);
      mockBankAccountRepository.save.mockResolvedValue(account);

      const result = await service.createBankAccount(
        '1234567890',
        'Main Account',
        'Bank ABC',
        'IDR',
        'actor1',
      );

      expect(mockBankAccountRepository.create).toHaveBeenCalled();
      expect(mockBankAccountRepository.save).toHaveBeenCalled();
      expect(result).toEqual(account);
    });
  });

  describe('recordBankTransaction', () => {
    it('should record deposit transaction and update balance', async () => {
      const account = {
        id: '1',
        balance: 1000000,
      };

      const transaction = {
        id: '1',
        bankAccountId: '1',
        type: BankTransactionType.DEPOSIT,
        amount: 500000,
        transactionDate: new Date(),
      };

      mockBankAccountRepository.findOne.mockResolvedValue(account);
      mockBankTransactionRepository.create.mockReturnValue(transaction);
      mockBankTransactionRepository.save.mockResolvedValue(transaction);
      mockBankAccountRepository.save.mockResolvedValue({
        ...account,
        balance: 1500000,
      });

      const result = await service.recordBankTransaction(
        '1',
        'DEPOSIT',
        500000,
        new Date(),
        undefined,
        undefined,
        'actor1',
      );

      expect(result).toEqual(transaction);
      expect(mockBankAccountRepository.save).toHaveBeenCalledWith({
        ...account,
        balance: 1500000,
      });
    });

    it('should record withdrawal transaction and update balance', async () => {
      const account = {
        id: '1',
        balance: 1000000,
      };

      const transaction = {
        id: '1',
        bankAccountId: '1',
        type: BankTransactionType.WITHDRAWAL,
        amount: 200000,
        transactionDate: new Date(),
      };

      mockBankAccountRepository.findOne.mockResolvedValue(account);
      mockBankTransactionRepository.create.mockReturnValue(transaction);
      mockBankTransactionRepository.save.mockResolvedValue(transaction);
      mockBankAccountRepository.save.mockResolvedValue({
        ...account,
        balance: 800000,
      });

      const result = await service.recordBankTransaction(
        '1',
        'WITHDRAWAL',
        200000,
        new Date(),
      );

      expect(result).toEqual(transaction);
      expect(mockBankAccountRepository.save).toHaveBeenCalledWith({
        ...account,
        balance: 800000,
      });
    });
  });

  describe('matchTransaction', () => {
    it('should match bank transaction with financial transaction', async () => {
      const bankTx = {
        id: '1',
        bankAccountId: '1',
        amount: 1000000,
        reconciliationStatus: ReconciliationStatus.PENDING,
      };

      const financialTx = {
        id: 'fin1',
        amount: 1000000,
      };

      mockBankTransactionRepository.findOne.mockResolvedValue(bankTx);
      mockFinancialTransactionRepository.findOne.mockResolvedValue(financialTx);
      mockBankTransactionRepository.save.mockResolvedValue({
        ...bankTx,
        matchedTransactionId: 'fin1',
        reconciliationStatus: ReconciliationStatus.MATCHED,
      });

      const result = await service.matchTransaction('1', 'fin1', 'actor1');

      expect(result.reconciliationStatus).toBe(ReconciliationStatus.MATCHED);
      expect(result.matchedTransactionId).toBe('fin1');
      expect(mockAuditLogService.record).toHaveBeenCalled();
    });
  });

  describe('reconcile', () => {
    it('should return reconciliation summary', async () => {
      const transactions = [
        {
          id: '1',
          reconciliationStatus: ReconciliationStatus.MATCHED,
        },
        {
          id: '2',
          reconciliationStatus: ReconciliationStatus.PENDING,
        },
        {
          id: '3',
          reconciliationStatus: ReconciliationStatus.PENDING,
        },
      ];

      mockBankTransactionRepository.find.mockResolvedValue(transactions);

      const result = await service.reconcile(
        '1',
        new Date('2024-01-01'),
        new Date('2024-01-31'),
      );

      expect(result.matched).toBe(1);
      expect(result.unmatched).toBe(2);
      expect(result.total).toBe(3);
    });
  });

  describe('listBankAccounts', () => {
    it('should return list of bank accounts', async () => {
      const accounts = [
        { id: '1', accountName: 'Account 1' },
        { id: '2', accountName: 'Account 2' },
      ];

      mockBankAccountRepository.find.mockResolvedValue(accounts);

      const result = await service.listBankAccounts();

      expect(mockBankAccountRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { accountName: 'ASC' },
      });
      expect(result).toEqual(accounts);
    });
  });
});
