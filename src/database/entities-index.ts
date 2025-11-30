// This file exports all entities for TypeORM migration
// Used by data-source.ts to discover all entities
// Note: This file is not used in runtime, only for migration generation
// For runtime, TypeORM uses autoLoadEntities: true

// Users
export { User } from '../users/entities/user.entity';

// Audit
export { AuditLog } from '../audit/entities/audit-log.entity';
export { ErrorLog } from '../audit/entities/error-log.entity';
export { EntityVersion } from '../audit/entities/entity-version.entity';

// Inventory
export { Item } from '../inventory/entities/item.entity';
export { Warehouse } from '../inventory/entities/warehouse.entity';
export { StockMovement } from '../inventory/entities/stock-movement.entity';
export { Batch } from '../inventory/entities/batch.entity';
export { SerialNumber } from '../inventory/entities/serial-number.entity';
export { Location } from '../inventory/entities/location.entity';
export { Stocktake } from '../inventory/entities/stocktake.entity';

// Purchasing
export { Supplier } from '../purchasing/entities/supplier.entity';
export { PurchaseOrder } from '../purchasing/entities/purchase-order.entity';
export { PurchaseRequisition } from '../purchasing/entities/purchase-requisition.entity';
export { RFQ } from '../purchasing/entities/rfq.entity';
export { Quotation } from '../purchasing/entities/quotation.entity';

// Sales
export { Customer } from '../sales/entities/customer.entity';
export { SalesOrder } from '../sales/entities/sales-order.entity';
export { CustomerQuotation } from '../sales/entities/customer-quotation.entity';
export { PriceList } from '../sales/entities/price-list.entity';
export { Discount } from '../sales/entities/discount.entity';

// Finance
export { FinancialTransaction } from '../finance/entities/financial-transaction.entity';
export { Invoice } from '../finance/entities/invoice.entity';
export { Currency } from '../finance/entities/currency.entity';
export { ExchangeRate } from '../finance/entities/exchange-rate.entity';
export { TaxRate } from '../finance/entities/tax-rate.entity';
export { PaymentTerm } from '../finance/entities/payment-term.entity';
export { BankAccount } from '../finance/entities/bank-account.entity';
export { BankTransaction } from '../finance/entities/bank-transaction.entity';
export { Budget } from '../finance/entities/budget.entity';
export { Forecast } from '../finance/entities/forecast.entity';

// Production
export { ProductionOrder } from '../production/entities/production-order.entity';
export { BOM } from '../production/entities/bom.entity';
export { WorkCenter } from '../production/entities/work-center.entity';
export { Routing } from '../production/entities/routing.entity';
export { QCInspection } from '../production/entities/qc-inspection.entity';
export { Equipment } from '../production/entities/equipment.entity';
export { MaintenanceSchedule } from '../production/entities/maintenance-schedule.entity';

// System
export { Notification } from '../system/entities/notification.entity';
export { Document } from '../system/entities/document.entity';
export { UserSession } from '../system/entities/user-session.entity';
export { TwoFactorAuth } from '../system/entities/two-factor-auth.entity';
export { Workflow } from '../system/entities/workflow.entity';
export { WorkflowInstance } from '../system/entities/workflow-instance.entity';
export { SystemEventLog } from '../system/entities/system-event.entity';
export { Integration } from '../system/entities/integration.entity';
export { Webhook } from '../system/entities/webhook.entity';
export { Tenant } from '../system/entities/tenant.entity';

