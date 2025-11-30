import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetForecastService } from './budget-forecast.service';
import { Budget, BudgetType, BudgetPeriod } from '../entities/budget.entity';
import { Forecast, ForecastType } from '../entities/forecast.entity';
import { FinancialTransaction, FinancialTransactionType } from '../entities/financial-transaction.entity';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('BudgetForecastService', () => {
  let service: BudgetForecastService;
  let budgetRepository: Repository<Budget>;
  let forecastRepository: Repository<Forecast>;
  let transactionRepository: Repository<FinancialTransaction>;

  const mockBudgetRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockForecastRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockTransactionRepository = {
    find: jest.fn(),
  };

  const mockAuditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetForecastService,
        {
          provide: getRepositoryToken(Budget),
          useValue: mockBudgetRepository,
        },
        {
          provide: getRepositoryToken(Forecast),
          useValue: mockForecastRepository,
        },
        {
          provide: getRepositoryToken(FinancialTransaction),
          useValue: mockTransactionRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<BudgetForecastService>(BudgetForecastService);
    budgetRepository = module.get<Repository<Budget>>(getRepositoryToken(Budget));
    forecastRepository = module.get<Repository<Forecast>>(getRepositoryToken(Forecast));
    transactionRepository = module.get<Repository<FinancialTransaction>>(
      getRepositoryToken(FinancialTransaction),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createBudget', () => {
    it('should create a new budget', async () => {
      const budget = {
        id: '1',
        name: 'Q1 Budget',
        type: BudgetType.EXPENSE,
        period: BudgetPeriod.QUARTERLY,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        allocatedAmount: 10000000,
        actualAmount: 0,
        committedAmount: 0,
      };

      mockBudgetRepository.create.mockReturnValue(budget);
      mockBudgetRepository.save.mockResolvedValue(budget);

      const result = await service.createBudget(
        'Q1 Budget',
        BudgetType.EXPENSE,
        BudgetPeriod.QUARTERLY,
        new Date('2024-01-01'),
        new Date('2024-03-31'),
        10000000,
        'actor1',
      );

      expect(mockBudgetRepository.create).toHaveBeenCalled();
      expect(mockBudgetRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.record).toHaveBeenCalled();
      expect(result).toEqual(budget);
    });
  });

  describe('updateBudgetActual', () => {
    it('should update actual amount from transactions', async () => {
      const budget = {
        id: '1',
        type: BudgetType.EXPENSE,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        actualAmount: 0,
      };

      const transactions = [
        {
          id: '1',
          type: FinancialTransactionType.EXPENSE,
          amount: 3000000,
          createdAt: new Date('2024-02-01'),
        },
        {
          id: '2',
          type: FinancialTransactionType.EXPENSE,
          amount: 2000000,
          createdAt: new Date('2024-02-15'),
        },
      ];

      mockBudgetRepository.findOne.mockResolvedValue(budget);
      mockTransactionRepository.find.mockResolvedValue(transactions);
      mockBudgetRepository.save.mockResolvedValue({
        ...budget,
        actualAmount: 5000000,
      });

      const result = await service.updateBudgetActual('1');

      expect(result.actualAmount).toBe(5000000);
    });
  });

  describe('getBudgetVariance', () => {
    it('should calculate budget variance correctly', async () => {
      const budget = {
        id: '1',
        allocatedAmount: 10000000,
        actualAmount: 0,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
        type: BudgetType.EXPENSE,
      };

      const transactions = [
        {
          id: '1',
          type: FinancialTransactionType.EXPENSE,
          amount: 7500000,
          createdAt: new Date('2024-02-01'),
        },
      ];

      // Mock the updateBudgetActual flow
      mockBudgetRepository.findOne
        .mockResolvedValueOnce(budget) // First call in getBudgetVariance
        .mockResolvedValueOnce({ ...budget, actualAmount: 7500000 }); // After update
      mockTransactionRepository.find.mockResolvedValue(transactions);
      mockBudgetRepository.save.mockResolvedValue({
        ...budget,
        actualAmount: 7500000,
      });

      const result = await service.getBudgetVariance('1');

      expect(result.budget.actualAmount).toBe(7500000);
      expect(result.variance).toBe(2500000); // 10000000 - 7500000
      expect(result.utilizationPercentage).toBe(75);
    });
  });

  describe('createForecast', () => {
    it('should create a new forecast', async () => {
      const forecast = {
        id: '1',
        name: 'Q2 Forecast',
        type: ForecastType.REVENUE,
        forecastDate: new Date('2024-04-01'),
        forecastedAmount: 50000000,
        confidenceLevel: 85,
      };

      mockForecastRepository.create.mockReturnValue(forecast);
      mockForecastRepository.save.mockResolvedValue(forecast);

      const result = await service.createForecast(
        'Q2 Forecast',
        ForecastType.REVENUE,
        new Date('2024-04-01'),
        50000000,
        'actor1',
        85,
      );

      expect(mockForecastRepository.create).toHaveBeenCalled();
      expect(mockForecastRepository.save).toHaveBeenCalled();
      expect(result).toEqual(forecast);
    });
  });

  describe('getForecastAccuracy', () => {
    it('should calculate forecast accuracy', async () => {
      const forecast = {
        id: '1',
        forecastedAmount: 50000000,
        actualAmount: 48000000,
      };

      mockForecastRepository.findOne.mockResolvedValue(forecast);

      const result = await service.getForecastAccuracy('1');

      expect(result.variance).toBe(2000000);
      expect(result.accuracy).toBeGreaterThan(0);
    });
  });
});
