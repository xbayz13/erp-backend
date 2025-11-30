import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxService } from './tax.service';
import { TaxRate, TaxType } from '../entities/tax-rate.entity';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('TaxService', () => {
  let service: TaxService;
  let taxRateRepository: Repository<TaxRate>;
  let auditLogService: AuditLogService;

  const mockTaxRateRepository = {
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
        TaxService,
        {
          provide: getRepositoryToken(TaxRate),
          useValue: mockTaxRateRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<TaxService>(TaxService);
    taxRateRepository = module.get<Repository<TaxRate>>(getRepositoryToken(TaxRate));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createTaxRate', () => {
    it('should create a new tax rate', async () => {
      const taxRate = {
        id: '1',
        code: 'VAT10',
        name: 'VAT 10%',
        type: TaxType.VAT,
        rate: 10,
        isActive: true,
      };

      mockTaxRateRepository.create.mockReturnValue(taxRate);
      mockTaxRateRepository.save.mockResolvedValue(taxRate);

      const result = await service.createTaxRate(
        'VAT10',
        'VAT 10%',
        TaxType.VAT,
        10,
        'actor1',
      );

      expect(mockTaxRateRepository.create).toHaveBeenCalled();
      expect(mockTaxRateRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.record).toHaveBeenCalled();
      expect(result).toEqual(taxRate);
    });
  });

  describe('calculateTax', () => {
    it('should calculate tax correctly', async () => {
      const taxRate = {
        id: '1',
        code: 'VAT10',
        rate: 10,
        isActive: true,
        validFrom: new Date(Date.now() - 86400000),
        validUntil: null,
      };

      mockTaxRateRepository.findOne.mockResolvedValue(taxRate);

      const result = await service.calculateTax(1000, 'VAT10');

      expect(result).toBe(100);
    });

    it('should throw error if tax rate not found', async () => {
      mockTaxRateRepository.findOne.mockResolvedValue(null);

      await expect(service.calculateTax(1000, 'INVALID')).rejects.toThrow(
        'Tax rate INVALID not found',
      );
    });
  });

  describe('listTaxRates', () => {
    it('should return list of tax rates', async () => {
      const taxRates = [
        { id: '1', code: 'VAT10', type: TaxType.VAT },
        { id: '2', code: 'VAT11', type: TaxType.VAT },
      ];

      mockTaxRateRepository.find.mockResolvedValue(taxRates);

      const result = await service.listTaxRates();

      expect(mockTaxRateRepository.find).toHaveBeenCalled();
      expect(result).toEqual(taxRates);
    });

    it('should filter by type if provided', async () => {
      const taxRates = [{ id: '1', code: 'VAT10', type: TaxType.VAT }];

      mockTaxRateRepository.find.mockResolvedValue(taxRates);

      const result = await service.listTaxRates(TaxType.VAT);

      expect(mockTaxRateRepository.find).toHaveBeenCalledWith({
        where: { isActive: true, type: TaxType.VAT },
        order: { code: 'ASC' },
      });
      expect(result).toEqual(taxRates);
    });
  });
});
