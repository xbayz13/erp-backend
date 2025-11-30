import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CurrencyService } from './currency.service';
import { Currency } from '../entities/currency.entity';
import { ExchangeRate } from '../entities/exchange-rate.entity';

describe('CurrencyService', () => {
  let service: CurrencyService;
  let currencyRepository: Repository<Currency>;
  let exchangeRateRepository: Repository<ExchangeRate>;

  const mockCurrencyRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockExchangeRateRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: getRepositoryToken(Currency),
          useValue: mockCurrencyRepository,
        },
        {
          provide: getRepositoryToken(ExchangeRate),
          useValue: mockExchangeRateRepository,
        },
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
    currencyRepository = module.get<Repository<Currency>>(getRepositoryToken(Currency));
    exchangeRateRepository = module.get<Repository<ExchangeRate>>(
      getRepositoryToken(ExchangeRate),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCurrency', () => {
    it('should create a new currency', async () => {
      const currency = {
        id: '1',
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        decimalPlaces: 2,
        isBaseCurrency: false,
        isActive: true,
      };

      mockCurrencyRepository.create.mockReturnValue(currency);
      mockCurrencyRepository.save.mockResolvedValue(currency);

      const result = await service.createCurrency('USD', 'US Dollar', '$', 2, false);

      expect(mockCurrencyRepository.create).toHaveBeenCalled();
      expect(mockCurrencyRepository.save).toHaveBeenCalled();
      expect(result).toEqual(currency);
    });

    it('should unset other base currencies when creating new base currency', async () => {
      const currency = {
        id: '1',
        code: 'IDR',
        name: 'Indonesian Rupiah',
        symbol: 'Rp',
        decimalPlaces: 0,
        isBaseCurrency: true,
      };

      mockCurrencyRepository.update.mockResolvedValue({});
      mockCurrencyRepository.create.mockReturnValue(currency);
      mockCurrencyRepository.save.mockResolvedValue(currency);

      await service.createCurrency('IDR', 'Indonesian Rupiah', 'Rp', 0, true);

      expect(mockCurrencyRepository.update).toHaveBeenCalledWith(
        { isBaseCurrency: true },
        { isBaseCurrency: false },
      );
    });
  });

  describe('getExchangeRate', () => {
    it('should return exchange rate', async () => {
      const rate = {
        id: '1',
        fromCurrency: 'IDR',
        toCurrency: 'USD',
        rate: 0.000067,
        effectiveDate: new Date(Date.now() - 86400000),
        isActive: true,
      };

      mockExchangeRateRepository.findOne.mockResolvedValue(rate);

      const result = await service.getExchangeRate('IDR', 'USD');

      expect(result).toBe(0.000067);
    });

    it('should return null if rate not found', async () => {
      mockExchangeRateRepository.findOne.mockResolvedValue(null);

      const result = await service.getExchangeRate('IDR', 'EUR');

      expect(result).toBeNull();
    });
  });

  describe('convertAmount', () => {
    it('should convert amount using exchange rate', async () => {
      const rate = {
        id: '1',
        fromCurrency: 'IDR',
        toCurrency: 'USD',
        rate: 0.000067,
        effectiveDate: new Date(Date.now() - 86400000),
        isActive: true,
      };

      mockExchangeRateRepository.findOne.mockResolvedValue(rate);

      const result = await service.convertAmount(1000000, 'IDR', 'USD');

      expect(result).toBe(67);
    });

    it('should return same amount if currencies are same', async () => {
      const result = await service.convertAmount(1000, 'USD', 'USD');

      expect(result).toBe(1000);
    });
  });
});
