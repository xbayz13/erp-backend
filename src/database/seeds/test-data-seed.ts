import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { User } from '../../users/entities/user.entity';
import { Warehouse } from '../../inventory/entities/warehouse.entity';
import { Item } from '../../inventory/entities/item.entity';
import { Supplier } from '../../purchasing/entities/supplier.entity';
import { Customer } from '../../sales/entities/customer.entity';
import { PurchaseOrder, PurchaseOrderStatus } from '../../purchasing/entities/purchase-order.entity';
import { SalesOrder, SalesOrderStatus } from '../../sales/entities/sales-order.entity';
import { ProductionOrder, ProductionStatus } from '../../production/entities/production-order.entity';
import { Invoice, InvoiceStatus } from '../../finance/entities/invoice.entity';
import { FinancialTransaction, FinancialTransactionType } from '../../finance/entities/financial-transaction.entity';
import { StockMovement, StockMovementType } from '../../inventory/entities/stock-movement.entity';
import { UserRole } from '../../common/enums/role.enum';
import {
  addDays,
  subtractDays,
  randomDate,
  randomBetween,
  randomFloatBetween,
  randomElement,
  generateReference,
} from './helpers';

// Load environment variables
// Load .env first, then env.local (env.local has higher priority and will override .env)
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), 'env.local') });

/**
 * Test Data Seed - Data 7 Hari Terakhir untuk Testing View
 * 
 * Seed ini berisi data transaksi 7 hari terakhir untuk keperluan testing dan melihat tampilan:
 * - Purchase Orders (15-20 orders)
 * - Stock Movements (inbound & outbound)
 * - Sales Orders (12-18 orders)
 * - Production Orders (5-8 orders)
 * - Invoices (dari purchase orders)
 * - Financial Transactions (payments, revenue, expenses)
 * 
 * Gunakan seed ini setelah initial seed untuk melihat data di dashboard dan reports.
 * 
 * Catatan: Seed ini membutuhkan initial data (users, warehouses, suppliers, customers, items)
 *          yang harus sudah ada di database.
 */
export async function seedTestData(dataSource: DataSource) {
  console.log('🌱 Starting test data seeding (7 days of transaction data)...');

  try {
    // Load existing data (required for test data)
    const userRepo = dataSource.getRepository(User);
    const warehouseRepo = dataSource.getRepository(Warehouse);
    const itemRepo = dataSource.getRepository(Item);
    const supplierRepo = dataSource.getRepository(Supplier);
    const customerRepo = dataSource.getRepository(Customer);

    const users = await userRepo.find();
    const warehouses = await warehouseRepo.find();
    const items = await itemRepo.find();
    const suppliers = await supplierRepo.find();
    const customers = await customerRepo.find();

    if (users.length === 0 || warehouses.length === 0 || items.length === 0) {
      throw new Error(
        '❌ Initial data not found! Please run "npm run db:seed:initial" first.',
      );
    }

    if (suppliers.length === 0 || customers.length === 0) {
      throw new Error(
        '❌ Suppliers or customers not found! Please run "npm run db:seed:initial" first.',
      );
    }

    const now = new Date();
    const sevenDaysAgo = subtractDays(now, 7);

    // Seed Purchase Orders (7 days)
    const purchaseOrders = await seedPurchaseOrders(
      dataSource,
      suppliers,
      items,
      warehouses,
      users,
      sevenDaysAgo,
      now,
    );
    console.log(`✅ Seeded ${purchaseOrders.length} purchase orders`);

    // Seed Stock Movements
    const stockMovements = await seedStockMovements(
      dataSource,
      items,
      warehouses,
      users,
      purchaseOrders,
      sevenDaysAgo,
      now,
    );
    console.log(`✅ Seeded ${stockMovements.length} stock movements`);

    // Seed Sales Orders (7 days)
    const salesOrders = await seedSalesOrders(
      dataSource,
      customers,
      items,
      warehouses,
      users,
      sevenDaysAgo,
      now,
    );
    console.log(`✅ Seeded ${salesOrders.length} sales orders`);

    // Seed Production Orders (7 days)
    const productionOrders = await seedProductionOrders(
      dataSource,
      items,
      warehouses,
      users,
      sevenDaysAgo,
      now,
    );
    console.log(`✅ Seeded ${productionOrders.length} production orders`);

    // Seed Invoices (7 days)
    const invoices = await seedInvoices(
      dataSource,
      purchaseOrders,
      users,
      sevenDaysAgo,
      now,
    );
    console.log(`✅ Seeded ${invoices.length} invoices`);

    // Seed Financial Transactions (7 days)
    const transactions = await seedFinancialTransactions(
      dataSource,
      invoices,
      users,
      sevenDaysAgo,
      now,
    );
    console.log(`✅ Seeded ${transactions.length} financial transactions`);

    console.log('🎉 Test data seeding completed successfully!');
    console.log('');
    console.log('📋 Summary (7 days of data):');
    console.log(`   - ${purchaseOrders.length} purchase orders`);
    console.log(`   - ${stockMovements.length} stock movements`);
    console.log(`   - ${salesOrders.length} sales orders`);
    console.log(`   - ${productionOrders.length} production orders`);
    console.log(`   - ${invoices.length} invoices`);
    console.log(`   - ${transactions.length} financial transactions`);

    return {
      purchaseOrders,
      stockMovements,
      salesOrders,
      productionOrders,
      invoices,
      transactions,
    };
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  }
}

async function seedPurchaseOrders(
  dataSource: DataSource,
  suppliers: Supplier[],
  items: Item[],
  warehouses: Warehouse[],
  users: User[],
  startDate: Date,
  endDate: Date,
): Promise<PurchaseOrder[]> {
  const poRepo = dataSource.getRepository(PurchaseOrder);

  const purchaseOrders: PurchaseOrder[] = [];
  const purchasingUser = users.find((u) =>
    u.roles.includes(UserRole.PURCHASING_STAFF),
  ) || users.find((u) => u.roles.includes(UserRole.ADMIN)) || users[0];
  
  if (!purchasingUser) {
    console.log('⚠️  No users found, skipping purchase orders');
    return [];
  }

  // Create 15-20 purchase orders over 7 days
  const numPOs = randomBetween(15, 20);
  const daysDiff = Math.floor(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  for (let i = 0; i < numPOs; i++) {
    const dayOffset = Math.floor((i / numPOs) * daysDiff);
    const createdAt = addDays(startDate, dayOffset);
    const expectedDate = addDays(createdAt, randomBetween(3, 7));

    const supplier = randomElement(suppliers);
    const numItems = randomBetween(1, 4);
    const poItems = [];

    for (let j = 0; j < numItems; j++) {
      const item = randomElement(items);
      const quantity = randomBetween(50, 500);
      const unitCost = item.unitCost * randomFloatBetween(0.9, 1.1);
      poItems.push({
        itemId: item.id,
        warehouseId: item.warehouseId,
        quantity,
        unitCost,
      });
    }

    const totalCost = poItems.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0,
    );

    let status: PurchaseOrderStatus;
    if (createdAt < subtractDays(endDate, 2)) {
      status = randomElement([
        PurchaseOrderStatus.APPROVED,
        PurchaseOrderStatus.RECEIVED,
      ]);
    } else {
      status = randomElement([
        PurchaseOrderStatus.DRAFT,
        PurchaseOrderStatus.APPROVED,
      ]);
    }

    const po = poRepo.create({
      supplierName: supplier.name,
      reference: generateReference('PO', i + 1),
      status,
      items: poItems,
      expectedDate,
      totalCost,
      createdBy: purchasingUser.id,
      createdAt,
      updatedAt: createdAt,
    });

    purchaseOrders.push(po);
  }

  const savedPOs = await poRepo.save(purchaseOrders);
  return savedPOs;
}

async function seedStockMovements(
  dataSource: DataSource,
  items: Item[],
  warehouses: Warehouse[],
  users: User[],
  purchaseOrders: PurchaseOrder[],
  startDate: Date,
  endDate: Date,
): Promise<StockMovement[]> {
  const movementRepo = dataSource.getRepository(StockMovement);
  const warehouseUser = users.find((u) =>
    u.roles.includes(UserRole.WAREHOUSE_MANAGER),
  ) || users.find((u) => u.roles.includes(UserRole.ADMIN)) || users[0];
  
  if (!warehouseUser) {
    console.log('⚠️  No users found, skipping stock movements');
    return [];
  }

  const movements: StockMovement[] = [];

  // Create inbound movements from purchase orders
  const receivedPOs = purchaseOrders.filter(
    (po) => po.status === PurchaseOrderStatus.RECEIVED,
  );

  for (const po of receivedPOs) {
    for (const item of po.items) {
      const movement = movementRepo.create({
        itemId: item.itemId,
        warehouseId: item.warehouseId,
        quantity: item.quantity,
        type: StockMovementType.INBOUND,
        reference: po.reference,
        performedBy: warehouseUser.id,
        createdAt: addDays(po.createdAt, randomBetween(1, 3)),
      });
      movements.push(movement);
    }
  }

  // Create some outbound movements (sales/production)
  const numOutbound = randomBetween(10, 15);
  for (let i = 0; i < numOutbound; i++) {
    const item = randomElement(items);
    const dayOffset = randomBetween(0, 6);
    const movement = movementRepo.create({
      itemId: item.id,
      warehouseId: item.warehouseId,
      quantity: randomBetween(10, 100),
      type: StockMovementType.OUTBOUND,
      reference: generateReference('OUT', i + 1),
      performedBy: warehouseUser.id,
      createdAt: addDays(startDate, dayOffset),
    });
    movements.push(movement);
  }

  const savedMovements = await movementRepo.save(movements);
  return savedMovements;
}

async function seedSalesOrders(
  dataSource: DataSource,
  customers: Customer[],
  items: Item[],
  warehouses: Warehouse[],
  users: User[],
  startDate: Date,
  endDate: Date,
): Promise<SalesOrder[]> {
  const soRepo = dataSource.getRepository(SalesOrder);
  const salesUser = users.find((u) => u.roles.includes(UserRole.SALES_STAFF)) 
    || users.find((u) => u.roles.includes(UserRole.ADMIN))
    || users[0];
  
  if (!salesUser) {
    console.log('⚠️  No users found, skipping sales orders');
    return [];
  }

  const salesOrders: SalesOrder[] = [];
  const numSOs = randomBetween(12, 18);

  for (let i = 0; i < numSOs; i++) {
    const dayOffset = Math.floor((i / numSOs) * 7);
    const createdAt = addDays(startDate, dayOffset);
    const customer = randomElement(customers);
    const numItems = randomBetween(1, 5);

    const soItems = [];
    for (let j = 0; j < numItems; j++) {
      const item = randomElement(items);
      const quantity = randomBetween(10, 200);
      const unitPrice = item.unitCost * randomFloatBetween(1.2, 1.5); // 20-50% margin
      soItems.push({
        itemId: item.id,
        itemSku: item.sku,
        itemName: item.name,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
        warehouseId: item.warehouseId,
        allocatedQuantity: quantity,
      });
    }

    const totalAmount = soItems.reduce((sum, item) => sum + item.totalPrice, 0);

    let status: SalesOrderStatus;
    if (createdAt < subtractDays(endDate, 1)) {
      status = randomElement([
        SalesOrderStatus.CONFIRMED,
        SalesOrderStatus.IN_PROGRESS,
        SalesOrderStatus.SHIPPED,
        SalesOrderStatus.DELIVERED,
      ]);
    } else {
      status = randomElement([
        SalesOrderStatus.DRAFT,
        SalesOrderStatus.CONFIRMED,
      ]);
    }

    const expectedDeliveryDate = addDays(createdAt, randomBetween(3, 7));
    let shippedDate: Date | undefined;
    let deliveredDate: Date | undefined;

    if (status === SalesOrderStatus.SHIPPED || status === SalesOrderStatus.DELIVERED) {
      shippedDate = addDays(createdAt, randomBetween(1, 3));
    }
    if (status === SalesOrderStatus.DELIVERED) {
      deliveredDate = addDays(shippedDate || createdAt, randomBetween(1, 2));
    }

    const so = soRepo.create({
      reference: generateReference('SO', i + 1),
      customerId: customer.id,
      status,
      items: soItems,
      totalAmount,
      orderDate: createdAt,
      expectedDeliveryDate,
      shippedDate,
      deliveredDate,
      shippingAddress: customer.address,
      createdBy: salesUser.id,
      createdAt,
      updatedAt: createdAt,
    });

    salesOrders.push(so);
  }

  const savedSOs = await soRepo.save(salesOrders);
  return savedSOs;
}

async function seedProductionOrders(
  dataSource: DataSource,
  items: Item[],
  warehouses: Warehouse[],
  users: User[],
  startDate: Date,
  endDate: Date,
): Promise<ProductionOrder[]> {
  const poRepo = dataSource.getRepository(ProductionOrder);
  const productionManager = users.find((u) =>
    u.roles.includes(UserRole.PRODUCTION_MANAGER),
  ) || users.find((u) => u.roles.includes(UserRole.ADMIN)) || users[0];
  const supervisor = users.find((u) =>
    u.roles.includes(UserRole.PRODUCTION_SUPERVISOR),
  ) || users.find((u) => u.roles.includes(UserRole.ADMIN)) || users[0];
  
  if (!productionManager || !supervisor) {
    console.log('⚠️  No users found, skipping production orders');
    return [];
  }

  const finishedItems = items.filter((item) =>
    item.name.includes('Finished Product'),
  );
  if (finishedItems.length === 0) {
    console.log('⚠️  No finished products found, skipping production orders');
    return [];
  }

  const productionOrders: ProductionOrder[] = [];
  const numPOs = randomBetween(5, 8);

  for (let i = 0; i < numPOs; i++) {
    const dayOffset = Math.floor((i / numPOs) * 7);
    const scheduledStart = addDays(startDate, dayOffset);
    const scheduledEnd = addDays(scheduledStart, randomBetween(2, 5));

    const productItem = randomElement(finishedItems);
    const quantityPlanned = randomBetween(50, 500);

    // Select raw materials
    const rawMaterials = items.filter(
      (item) => !item.name.includes('Finished Product'),
    );
    const materials = rawMaterials.slice(0, randomBetween(2, 4)).map((item) => ({
      itemId: item.id,
      warehouseId: item.warehouseId,
      quantity: randomBetween(10, 100),
    }));

    let status: ProductionStatus;
    let actualStart: Date | undefined;
    let actualEnd: Date | undefined;
    let quantityCompleted = 0;

    if (scheduledStart < subtractDays(endDate, 2)) {
      status = randomElement([
        ProductionStatus.IN_PROGRESS,
        ProductionStatus.COMPLETED,
      ]);
      actualStart = scheduledStart;
      if (status === ProductionStatus.COMPLETED) {
        actualEnd = addDays(actualStart, randomBetween(2, 4));
        quantityCompleted = quantityPlanned;
      }
    } else {
      status = ProductionStatus.PLANNED;
    }

    const po = poRepo.create({
      code: generateReference('PROD', i + 1),
      productItemId: productItem.id,
      quantityPlanned,
      quantityCompleted,
      status,
      scheduledStart,
      scheduledEnd,
      actualStart,
      actualEnd,
      materials,
      outputWarehouseId: productItem.warehouseId,
      supervisorId: supervisor.id,
      createdAt: scheduledStart,
      updatedAt: scheduledStart,
    });

    productionOrders.push(po);
  }

  const savedPOs = await poRepo.save(productionOrders);
  return savedPOs;
}

async function seedInvoices(
  dataSource: DataSource,
  purchaseOrders: PurchaseOrder[],
  users: User[],
  startDate: Date,
  endDate: Date,
): Promise<Invoice[]> {
  const invoiceRepo = dataSource.getRepository(Invoice);
  const financeUser = users.find((u) =>
    u.roles.includes(UserRole.FINANCE_STAFF),
  ) || users.find((u) => u.roles.includes(UserRole.FINANCE_MANAGER))
    || users.find((u) => u.roles.includes(UserRole.ADMIN)) || users[0];
  
  if (!financeUser) {
    console.log('⚠️  No users found, skipping invoices');
    return [];
  }

  const invoices: Invoice[] = [];
  const receivedPOs = purchaseOrders.filter(
    (po) => po.status === PurchaseOrderStatus.RECEIVED,
  );

  for (let i = 0; i < receivedPOs.length; i++) {
    const po = receivedPOs[i];
    const issuedAt = addDays(po.createdAt, randomBetween(2, 5));
    const dueDate = addDays(issuedAt, 30);

    let status: InvoiceStatus;
    let paidAt: Date | undefined;

    if (issuedAt < subtractDays(endDate, 5)) {
      status = randomElement([InvoiceStatus.ISSUED, InvoiceStatus.PAID]);
      if (status === InvoiceStatus.PAID) {
        paidAt = addDays(issuedAt, randomBetween(5, 25));
      }
    } else {
      status = InvoiceStatus.ISSUED;
    }

    const invoice = invoiceRepo.create({
      purchaseOrderId: po.id,
      amount: po.totalCost,
      currency: 'IDR',
      status,
      issuedAt,
      dueDate,
      paidAt,
      createdBy: financeUser.id,
      updatedAt: issuedAt,
    });

    invoices.push(invoice);
  }

  const savedInvoices = await invoiceRepo.save(invoices);
  return savedInvoices;
}

async function seedFinancialTransactions(
  dataSource: DataSource,
  invoices: Invoice[],
  users: User[],
  startDate: Date,
  endDate: Date,
): Promise<FinancialTransaction[]> {
  const transRepo = dataSource.getRepository(FinancialTransaction);
  const financeUser = users.find((u) =>
    u.roles.includes(UserRole.FINANCE_STAFF),
  ) || users.find((u) => u.roles.includes(UserRole.FINANCE_MANAGER))
    || users.find((u) => u.roles.includes(UserRole.ADMIN)) || users[0];
  
  if (!financeUser) {
    console.log('⚠️  No users found, skipping financial transactions');
    return [];
  }

  const transactions: FinancialTransaction[] = [];

  // Payment transactions from paid invoices
  const paidInvoices = invoices.filter((inv) => inv.status === InvoiceStatus.PAID);
  for (const invoice of paidInvoices) {
    if (invoice.paidAt) {
      const transaction = transRepo.create({
        type: FinancialTransactionType.PAYMENT,
        amount: invoice.amount,
        currency: invoice.currency,
        description: `Payment for Invoice ${invoice.id}`,
        reference: `PAY-${invoice.id}`,
        relatedEntityId: invoice.id,
        createdBy: financeUser.id,
        createdAt: invoice.paidAt,
      });
      transactions.push(transaction);
    }
  }

  // Some revenue transactions
  const numRevenue = randomBetween(5, 10);
  for (let i = 0; i < numRevenue; i++) {
    const dayOffset = randomBetween(0, 6);
    const transaction = transRepo.create({
      type: FinancialTransactionType.REVENUE,
      amount: randomFloatBetween(1000000, 10000000),
      currency: 'IDR',
      description: `Revenue from sales - ${generateReference('REV', i + 1)}`,
      createdBy: financeUser.id,
      createdAt: addDays(startDate, dayOffset),
    });
    transactions.push(transaction);
  }

  // Some expense transactions
  const numExpense = randomBetween(3, 7);
  for (let i = 0; i < numExpense; i++) {
    const dayOffset = randomBetween(0, 6);
    const transaction = transRepo.create({
      type: FinancialTransactionType.EXPENSE,
      amount: randomFloatBetween(500000, 5000000),
      currency: 'IDR',
      description: `Expense - ${generateReference('EXP', i + 1)}`,
      createdBy: financeUser.id,
      createdAt: addDays(startDate, dayOffset),
    });
    transactions.push(transaction);
  }

  const savedTransactions = await transRepo.save(transactions);
  return savedTransactions;
}

