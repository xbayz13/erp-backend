import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataImportExportService } from './data-import-export.service';
import { Item } from '../../inventory/entities/item.entity';
import { Customer } from '../../sales/entities/customer.entity';
import { Supplier } from '../../purchasing/entities/supplier.entity';
import * as ExcelJS from 'exceljs';

jest.mock('exceljs');

describe('DataImportExportService', () => {
  let service: DataImportExportService;
  let itemRepository: Repository<Item>;
  let customerRepository: Repository<Customer>;
  let supplierRepository: Repository<Supplier>;

  const mockItemRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockCustomerRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockSupplierRepository = {
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DataImportExportService,
        {
          provide: getRepositoryToken(Item),
          useValue: mockItemRepository,
        },
        {
          provide: getRepositoryToken(Customer),
          useValue: mockCustomerRepository,
        },
        {
          provide: getRepositoryToken(Supplier),
          useValue: mockSupplierRepository,
        },
      ],
    }).compile();

    service = module.get<DataImportExportService>(DataImportExportService);
    itemRepository = module.get<Repository<Item>>(getRepositoryToken(Item));
    customerRepository = module.get<Repository<Customer>>(
      getRepositoryToken(Customer),
    );
    supplierRepository = module.get<Repository<Supplier>>(
      getRepositoryToken(Supplier),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('exportItemsToExcel', () => {
    it('should export items to Excel buffer', async () => {
      const items = [
        {
          id: '1',
          sku: 'ITEM001',
          name: 'Test Item',
          description: 'Test Description',
          unitCost: 10.5,
          quantityOnHand: 100,
          reorderLevel: 20,
          unitOfMeasure: 'pcs',
        },
      ];

      mockItemRepository.find.mockResolvedValue(items);

      const mockWorksheet = {
        columns: [],
        addRow: jest.fn(),
      };

      const mockWorkbook = {
        addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        xlsx: {
          writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel')),
        },
      };

      (ExcelJS.Workbook as jest.Mock).mockImplementation(() => mockWorkbook);

      const result = await service.exportItemsToExcel();

      expect(mockItemRepository.find).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportCustomersToExcel', () => {
    it('should export customers to Excel buffer', async () => {
      const customers = [
        {
          id: '1',
          code: 'CUST001',
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '123456',
          creditLimit: 1000,
          paymentTerms: 'Net 30',
        },
      ];

      mockCustomerRepository.find.mockResolvedValue(customers);

      const mockWorksheet = {
        columns: [],
        addRow: jest.fn(),
      };

      const mockWorkbook = {
        addWorksheet: jest.fn().mockReturnValue(mockWorksheet),
        xlsx: {
          writeBuffer: jest.fn().mockResolvedValue(Buffer.from('excel')),
        },
      };

      (ExcelJS.Workbook as jest.Mock).mockImplementation(() => mockWorkbook);

      const result = await service.exportCustomersToExcel();

      expect(mockCustomerRepository.find).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
    });
  });

  describe('exportTemplate', () => {
    it('should export template for items', async () => {
      const mockWorkbook = {
        addWorksheet: jest.fn().mockReturnValue({
          columns: [],
        }),
        xlsx: {
          writeBuffer: jest.fn().mockResolvedValue(Buffer.from('template')),
        },
      };

      (ExcelJS.Workbook as jest.Mock).mockImplementation(() => mockWorkbook);

      const result = await service.exportTemplate('items');

      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw error for unknown entity type', async () => {
      await expect(service.exportTemplate('unknown')).rejects.toThrow();
    });
  });
});

