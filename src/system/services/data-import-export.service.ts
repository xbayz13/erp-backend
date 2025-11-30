import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Item } from '../../inventory/entities/item.entity';
import { Customer } from '../../sales/entities/customer.entity';
import { Supplier } from '../../purchasing/entities/supplier.entity';

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
}

@Injectable()
export class DataImportExportService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
    @InjectRepository(Supplier)
    private readonly supplierRepository: Repository<Supplier>,
  ) {}

  async exportItemsToExcel(): Promise<Buffer> {
    const items = await this.itemRepository.find({
      order: { sku: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Items');

    worksheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Description', key: 'description', width: 40 },
      { header: 'Unit Cost', key: 'unitCost', width: 12 },
      { header: 'Quantity On Hand', key: 'quantityOnHand', width: 15 },
      { header: 'Reorder Level', key: 'reorderLevel', width: 12 },
    ];

    items.forEach((item) => {
      worksheet.addRow({
        sku: item.sku,
        name: item.name,
        description: item.description,
        unitCost: item.unitCost,
        quantityOnHand: item.quantityOnHand,
        reorderLevel: item.reorderLevel,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async exportCustomersToExcel(): Promise<Buffer> {
    const customers = await this.customerRepository.find({
      order: { code: 'ASC' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Customers');

    worksheet.columns = [
      { header: 'Code', key: 'code', width: 15 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Credit Limit', key: 'creditLimit', width: 15 },
      { header: 'Payment Terms', key: 'paymentTerms', width: 15 },
    ];

    customers.forEach((customer) => {
      worksheet.addRow({
        code: customer.code,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        creditLimit: customer.creditLimit,
        paymentTerms: customer.paymentTerms,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  async importItemsFromExcel(fileBuffer: Buffer): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Worksheet not found');
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    let rowNumber = 2; // Skip header
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return; // Skip header

      try {
        const sku = row.getCell(1).value?.toString();
        const name = row.getCell(2).value?.toString();
        const unitCost = parseFloat(row.getCell(4).value?.toString() || '0');
        const quantityOnHand = parseInt(
          row.getCell(5).value?.toString() || '0',
          10,
        );
        const reorderLevel = parseInt(
          row.getCell(6).value?.toString() || '0',
          10,
        );

        if (!sku || !name) {
          throw new Error('SKU and Name are required');
        }

        const item = this.itemRepository.create({
          sku,
          name,
          description: row.getCell(3).value?.toString(),
          unitCost,
          quantityOnHand,
          reorderLevel,
        });

        this.itemRepository.save(item).then(() => {
          result.success++;
        });
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
        });
      }
      rowNumber++;
    });

    return result;
  }

  async importCustomersFromExcel(fileBuffer: Buffer): Promise<ImportResult> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(fileBuffer as any);

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('Worksheet not found');
    }

    const result: ImportResult = {
      success: 0,
      failed: 0,
      errors: [],
    };

    let rowNumber = 2;
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) return;

      try {
        const code = row.getCell(1).value?.toString();
        const name = row.getCell(2).value?.toString();

        if (!code || !name) {
          throw new Error('Code and Name are required');
        }

        const customer = this.customerRepository.create({
          code,
          name,
          email: row.getCell(3).value?.toString(),
          phone: row.getCell(4).value?.toString(),
          creditLimit: parseFloat(row.getCell(5).value?.toString() || '0'),
          paymentTerms: row.getCell(6).value?.toString(),
        });

        this.customerRepository.save(customer).then(() => {
          result.success++;
        });
      } catch (error: any) {
        result.failed++;
        result.errors.push({
          row: rowNumber,
          error: error.message || 'Unknown error',
        });
      }
      rowNumber++;
    });

    return result;
  }

  async exportTemplate(entityType: string): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template');

    switch (entityType) {
      case 'items':
        worksheet.columns = [
          { header: 'SKU', key: 'sku', width: 15 },
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Description', key: 'description', width: 40 },
          { header: 'Unit Cost', key: 'unitCost', width: 12 },
          { header: 'Quantity On Hand', key: 'quantityOnHand', width: 15 },
          { header: 'Reorder Level', key: 'reorderLevel', width: 12 },
        ];
        break;
      case 'customers':
        worksheet.columns = [
          { header: 'Code', key: 'code', width: 15 },
          { header: 'Name', key: 'name', width: 30 },
          { header: 'Email', key: 'email', width: 30 },
          { header: 'Phone', key: 'phone', width: 15 },
          { header: 'Credit Limit', key: 'creditLimit', width: 15 },
          { header: 'Payment Terms', key: 'paymentTerms', width: 15 },
        ];
        break;
      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}

