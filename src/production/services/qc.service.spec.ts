import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QCService } from './qc.service';
import { QCInspection, QCStatus } from '../entities/qc-inspection.entity';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('QCService', () => {
  let service: QCService;
  let qcRepository: Repository<QCInspection>;
  let auditLogService: AuditLogService;

  const mockQCRepository = {
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
        QCService,
        {
          provide: getRepositoryToken(QCInspection),
          useValue: mockQCRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<QCService>(QCService);
    qcRepository = module.get<Repository<QCInspection>>(getRepositoryToken(QCInspection));
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new QC inspection with PASSED status if all checks pass', async () => {
      const qc = {
        id: '1',
        reference: 'QC001',
        productionOrderId: 'po1',
        itemId: 'item1',
        quantityInspected: 10,
        quantityPassed: 10,
        quantityFailed: 0,
        status: QCStatus.PASSED,
        checks: [
          { checkName: 'Weight', result: 'PASS' },
          { checkName: 'Size', result: 'PASS' },
        ],
      };

      mockQCRepository.create.mockReturnValue(qc);
      mockQCRepository.save.mockResolvedValue(qc);

      const result = await service.create(
        'QC001',
        'po1',
        'item1',
        10,
        [
          { checkName: 'Weight', standard: '100g', actual: '100g', result: 'PASS' },
          { checkName: 'Size', standard: '10cm', actual: '10cm', result: 'PASS' },
        ],
        'actor1',
      );

      expect(result.status).toBe(QCStatus.PASSED);
      expect(result.quantityPassed).toBe(10);
      expect(result.quantityFailed).toBe(0);
    });

    it('should create QC inspection with FAILED status if any check fails', async () => {
      const qc = {
        id: '1',
        status: QCStatus.FAILED,
        quantityPassed: 5,
        quantityFailed: 5,
      };

      mockQCRepository.create.mockReturnValue(qc);
      mockQCRepository.save.mockResolvedValue(qc);

      const result = await service.create(
        'QC001',
        'po1',
        'item1',
        10,
        [
          { checkName: 'Weight', standard: '100g', actual: '100g', result: 'PASS' },
          { checkName: 'Size', standard: '10cm', actual: '12cm', result: 'FAIL' },
        ],
        'actor1',
      );

      expect(result.status).toBe(QCStatus.FAILED);
    });
  });

  describe('approve', () => {
    it('should approve a passed QC inspection', async () => {
      const qc = {
        id: '1',
        status: QCStatus.PASSED,
      };

      mockQCRepository.findOne.mockResolvedValue(qc);
      mockQCRepository.save.mockResolvedValue({
        ...qc,
        approvedBy: 'approver1',
        approvedAt: new Date(),
      });

      const result = await service.approve('1', 'approver1');

      expect(result.approvedBy).toBe('approver1');
      expect(result.approvedAt).toBeDefined();
    });

    it('should throw error if trying to approve non-passed inspection', async () => {
      const qc = {
        id: '1',
        status: QCStatus.FAILED,
      };

      mockQCRepository.findOne.mockResolvedValue(qc);

      await expect(service.approve('1', 'approver1')).rejects.toThrow(
        'Only passed inspections can be approved',
      );
    });
  });

  describe('reject', () => {
    it('should reject a QC inspection', async () => {
      const qc = {
        id: '1',
        status: QCStatus.PASSED,
      };

      mockQCRepository.findOne.mockResolvedValue(qc);
      mockQCRepository.save.mockResolvedValue({
        ...qc,
        status: QCStatus.REJECTED,
        rejectionReason: 'Quality issues found',
      });

      const result = await service.reject('1', 'approver1', 'Quality issues found');

      expect(result.status).toBe(QCStatus.REJECTED);
      expect(result.rejectionReason).toBe('Quality issues found');
    });
  });
});
