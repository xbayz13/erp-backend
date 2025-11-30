import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Item } from '../../inventory/entities/item.entity';
import { SalesOrder } from '../../sales/entities/sales-order.entity';
import { PurchaseOrder } from '../../purchasing/entities/purchase-order.entity';
import { FinancialTransaction } from '../../finance/entities/financial-transaction.entity';

export interface ReportColumn {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
}

export interface ReportFilter {
  field: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';
  value: any;
}

export interface ReportDefinition {
  name: string;
  entity: string;
  columns: ReportColumn[];
  filters?: ReportFilter[];
  groupBy?: string[];
  orderBy?: { field: string; direction: 'ASC' | 'DESC' };
  limit?: number;
}

@Injectable()
export class ReportBuilderService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(SalesOrder)
    private readonly salesOrderRepository: Repository<SalesOrder>,
    @InjectRepository(PurchaseOrder)
    private readonly purchaseOrderRepository: Repository<PurchaseOrder>,
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepository: Repository<FinancialTransaction>,
  ) {}

  async buildReport(definition: ReportDefinition): Promise<any[]> {
    let queryBuilder: SelectQueryBuilder<any>;

    switch (definition.entity) {
      case 'Item':
        queryBuilder = this.itemRepository.createQueryBuilder('entity');
        break;
      case 'SalesOrder':
        queryBuilder = this.salesOrderRepository.createQueryBuilder('entity');
        break;
      case 'PurchaseOrder':
        queryBuilder = this.purchaseOrderRepository.createQueryBuilder('entity');
        break;
      case 'FinancialTransaction':
        queryBuilder = this.transactionRepository.createQueryBuilder('entity');
        break;
      default:
        throw new Error(`Unknown entity: ${definition.entity}`);
    }

    // Select columns
    const selects = definition.columns.map((col) => `entity.${col.field}`);
    queryBuilder.select(selects);

    // Apply filters
    if (definition.filters) {
      definition.filters.forEach((filter, index) => {
        const paramName = `filter${index}`;
        switch (filter.operator) {
          case 'equals':
            queryBuilder.andWhere(`entity.${filter.field} = :${paramName}`, {
              [paramName]: filter.value,
            });
            break;
          case 'contains':
            queryBuilder.andWhere(`entity.${filter.field} LIKE :${paramName}`, {
              [paramName]: `%${filter.value}%`,
            });
            break;
          case 'greaterThan':
            queryBuilder.andWhere(`entity.${filter.field} > :${paramName}`, {
              [paramName]: filter.value,
            });
            break;
          case 'lessThan':
            queryBuilder.andWhere(`entity.${filter.field} < :${paramName}`, {
              [paramName]: filter.value,
            });
            break;
          case 'between':
            queryBuilder.andWhere(
              `entity.${filter.field} BETWEEN :${paramName}Start AND :${paramName}End`,
              {
                [`${paramName}Start`]: filter.value[0],
                [`${paramName}End`]: filter.value[1],
              },
            );
            break;
        }
      });
    }

    // Group by
    if (definition.groupBy) {
      definition.groupBy.forEach((field) => {
        queryBuilder.addGroupBy(`entity.${field}`);
      });
    }

    // Order by
    if (definition.orderBy) {
      queryBuilder.orderBy(
        `entity.${definition.orderBy.field}`,
        definition.orderBy.direction,
      );
    }

    // Limit
    if (definition.limit) {
      queryBuilder.limit(definition.limit);
    }

    return queryBuilder.getRawMany();
  }

  async getAvailableEntities(): Promise<string[]> {
    return ['Item', 'SalesOrder', 'PurchaseOrder', 'FinancialTransaction'];
  }

  async getAvailableFields(entity: string): Promise<ReportColumn[]> {
    switch (entity) {
      case 'Item':
        return [
          { field: 'sku', label: 'SKU', type: 'string' },
          { field: 'name', label: 'Name', type: 'string' },
          { field: 'unitCost', label: 'Unit Cost', type: 'number' },
          { field: 'quantityOnHand', label: 'Quantity On Hand', type: 'number' },
          { field: 'reorderLevel', label: 'Reorder Level', type: 'number' },
        ];
      case 'SalesOrder':
        return [
          { field: 'reference', label: 'Reference', type: 'string' },
          { field: 'totalAmount', label: 'Total Amount', type: 'number' },
          { field: 'status', label: 'Status', type: 'string' },
          { field: 'createdAt', label: 'Created At', type: 'date' },
        ];
      case 'PurchaseOrder':
        return [
          { field: 'reference', label: 'Reference', type: 'string' },
          { field: 'totalAmount', label: 'Total Amount', type: 'number' },
          { field: 'status', label: 'Status', type: 'string' },
          { field: 'createdAt', label: 'Created At', type: 'date' },
        ];
      case 'FinancialTransaction':
        return [
          { field: 'type', label: 'Type', type: 'string' },
          { field: 'amount', label: 'Amount', type: 'number' },
          { field: 'description', label: 'Description', type: 'string' },
          { field: 'createdAt', label: 'Created At', type: 'date' },
        ];
      default:
        return [];
    }
  }
}

