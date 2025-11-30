import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { User } from '../../users/entities/user.entity';
import { Warehouse } from '../../inventory/entities/warehouse.entity';
import { Item } from '../../inventory/entities/item.entity';
import { Supplier } from '../../purchasing/entities/supplier.entity';
import { Customer } from '../../sales/entities/customer.entity';
import { UserRole } from '../../common/enums/role.enum';
import * as bcrypt from 'bcrypt';
import { randomBetween, randomFloatBetween, randomElement } from './helpers';

// Load environment variables
// Load .env first, then env.local (env.local has higher priority and will override .env)
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), 'env.local') });

/**
 * Initial Seed - Data Penting untuk Memulai
 * 
 * Seed ini berisi data minimal yang diperlukan untuk sistem bisa berjalan:
 * - Users dengan berbagai roles
 * - Warehouses (gudang)
 * - Suppliers (supplier dasar)
 * - Customers (customer dasar)
 * - Items (item dasar dengan stock)
 * 
 * Gunakan seed ini saat pertama kali setup sistem atau reset database.
 */
export async function seedInitialData(dataSource: DataSource) {
  console.log('🌱 Starting initial data seeding (essential setup data)...');

  try {
    // Seed Users first (needed for other entities)
    const users = await seedUsers(dataSource);
    console.log(`✅ Seeded ${users.length} users`);

    // Seed Warehouses
    const warehouses = await seedWarehouses(dataSource);
    console.log(`✅ Seeded ${warehouses.length} warehouses`);

    // Seed Suppliers
    const suppliers = await seedSuppliers(dataSource);
    console.log(`✅ Seeded ${suppliers.length} suppliers`);

    // Seed Customers
    const customers = await seedCustomers(dataSource);
    console.log(`✅ Seeded ${customers.length} customers`);

    // Seed Items
    const items = await seedItems(dataSource, warehouses);
    console.log(`✅ Seeded ${items.length} items`);

    console.log('🎉 Initial data seeding completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - ${users.length} users created`);
    console.log(`   - ${warehouses.length} warehouses created`);
    console.log(`   - ${suppliers.length} suppliers created`);
    console.log(`   - ${customers.length} customers created`);
    console.log(`   - ${items.length} items created`);
    console.log('');
    console.log('💡 Next step: Run "npm run db:seed:test" to add 7 days of test data');

    return {
      users,
      warehouses,
      suppliers,
      customers,
      items,
    };
  } catch (error) {
    console.error('❌ Error seeding initial data:', error);
    throw error;
  }
}

async function seedUsers(dataSource: DataSource): Promise<User[]> {
  const userRepo = dataSource.getRepository(User);
  
  // Check if users already exist
  const existingUsers = await userRepo.count();
  if (existingUsers > 0) {
    console.log('⚠️  Users already exist, skipping user seeding');
    return await userRepo.find();
  }

  const passwordHash = await bcrypt.hash('password123', 10);

  const users = [
    {
      name: 'Admin User',
      email: 'admin@erp.com',
      passwordHash,
      roles: [UserRole.ADMIN],
    },
    {
      name: 'Warehouse Manager',
      email: 'warehouse@erp.com',
      passwordHash,
      roles: [UserRole.WAREHOUSE_MANAGER],
    },
    {
      name: 'Purchasing Staff',
      email: 'purchasing@erp.com',
      passwordHash,
      roles: [UserRole.PURCHASING_STAFF],
    },
    {
      name: 'Sales Staff',
      email: 'sales@erp.com',
      passwordHash,
      roles: [UserRole.SALES_STAFF],
    },
    {
      name: 'Finance Manager',
      email: 'finance@erp.com',
      passwordHash,
      roles: [UserRole.FINANCE_MANAGER],
    },
    {
      name: 'Finance Staff',
      email: 'finance.staff@erp.com',
      passwordHash,
      roles: [UserRole.FINANCE_STAFF],
    },
    {
      name: 'Production Manager',
      email: 'production@erp.com',
      passwordHash,
      roles: [UserRole.PRODUCTION_MANAGER],
    },
    {
      name: 'Production Supervisor',
      email: 'supervisor@erp.com',
      passwordHash,
      roles: [UserRole.PRODUCTION_SUPERVISOR],
    },
  ];

  const savedUsers = await userRepo.save(userRepo.create(users));
  return savedUsers;
}

async function seedWarehouses(dataSource: DataSource): Promise<Warehouse[]> {
  const warehouseRepo = dataSource.getRepository(Warehouse);

  // Check if warehouses already exist
  const existingWarehouses = await warehouseRepo.count();
  if (existingWarehouses > 0) {
    console.log('⚠️  Warehouses already exist, skipping warehouse seeding');
    return await warehouseRepo.find();
  }

  const warehouses = [
    {
      name: 'Main Warehouse',
      location: 'Jakarta',
      description: 'Primary warehouse facility',
    },
    {
      name: 'Secondary Warehouse',
      location: 'Bandung',
      description: 'Secondary storage facility',
    },
  ];

  const savedWarehouses = await warehouseRepo.save(
    warehouseRepo.create(warehouses),
  );
  return savedWarehouses;
}

async function seedSuppliers(dataSource: DataSource): Promise<Supplier[]> {
  const supplierRepo = dataSource.getRepository(Supplier);

  // Check if suppliers already exist
  const existingSuppliers = await supplierRepo.count();
  if (existingSuppliers > 0) {
    console.log('⚠️  Suppliers already exist, skipping supplier seeding');
    return await supplierRepo.find();
  }

  const suppliers = [
    {
      code: 'SUP001',
      name: 'PT Supplier Utama',
      contactPerson: 'John Doe',
      email: 'contact@supplier1.com',
      phone: '+62-21-12345678',
      address: 'Jl. Raya Industri No. 123, Jakarta',
      rating: 4.5,
      onTimeDeliveryRate: 95,
      qualityScore: 92,
      priceCompetitiveness: 88,
      paymentTerms: 'NET_30',
      totalOrders: 0,
      completedOrders: 0,
      isActive: true,
    },
    {
      code: 'SUP002',
      name: 'CV Mitra Sejahtera',
      contactPerson: 'Jane Smith',
      email: 'info@mitrasejahtera.com',
      phone: '+62-31-87654321',
      address: 'Jl. Perusahaan No. 456, Surabaya',
      rating: 4.2,
      onTimeDeliveryRate: 88,
      qualityScore: 90,
      priceCompetitiveness: 85,
      paymentTerms: 'NET_30',
      totalOrders: 0,
      completedOrders: 0,
      isActive: true,
    },
    {
      code: 'SUP003',
      name: 'PT Material Jaya',
      contactPerson: 'Bob Johnson',
      email: 'sales@materialjaya.com',
      phone: '+62-22-11223344',
      address: 'Jl. Komersial No. 789, Bandung',
      rating: 4.7,
      onTimeDeliveryRate: 98,
      qualityScore: 95,
      priceCompetitiveness: 90,
      paymentTerms: 'NET_15',
      totalOrders: 0,
      completedOrders: 0,
      isActive: true,
    },
  ];

  const savedSuppliers = await supplierRepo.save(
    supplierRepo.create(suppliers),
  );
  return savedSuppliers;
}

async function seedCustomers(dataSource: DataSource): Promise<Customer[]> {
  const customerRepo = dataSource.getRepository(Customer);

  // Check if customers already exist
  const existingCustomers = await customerRepo.count();
  if (existingCustomers > 0) {
    console.log('⚠️  Customers already exist, skipping customer seeding');
    return await customerRepo.find();
  }

  const customers = [
    {
      code: 'CUST001',
      name: 'PT Pelanggan Setia',
      contactPerson: 'Alice Brown',
      email: 'purchase@pelanggan.com',
      phone: '+62-21-99887766',
      address: 'Jl. Pelanggan No. 111, Jakarta',
      creditLimit: 50000000,
      paymentTerms: 'NET_30',
      outstandingBalance: 0,
      totalOrders: 0,
      rating: 4.8,
      segment: 'VIP',
      isActive: true,
    },
    {
      code: 'CUST002',
      name: 'CV Langganan Baru',
      contactPerson: 'Charlie White',
      email: 'order@langganan.com',
      phone: '+62-31-88776655',
      address: 'Jl. Customer No. 222, Surabaya',
      creditLimit: 25000000,
      paymentTerms: 'NET_30',
      outstandingBalance: 0,
      totalOrders: 0,
      rating: 4.3,
      segment: 'Regular',
      isActive: true,
    },
    {
      code: 'CUST003',
      name: 'PT Mitra Bisnis',
      contactPerson: 'David Green',
      email: 'contact@mitrabisnis.com',
      phone: '+62-22-77665544',
      address: 'Jl. Bisnis No. 333, Bandung',
      creditLimit: 75000000,
      paymentTerms: 'NET_60',
      outstandingBalance: 0,
      totalOrders: 0,
      rating: 4.9,
      segment: 'VIP',
      isActive: true,
    },
  ];

  const savedCustomers = await customerRepo.save(customerRepo.create(customers));
  return savedCustomers;
}

async function seedItems(
  dataSource: DataSource,
  warehouses: Warehouse[],
): Promise<Item[]> {
  const itemRepo = dataSource.getRepository(Item);

  // Check if items already exist
  const existingItems = await itemRepo.count();
  if (existingItems > 0) {
    console.log('⚠️  Items already exist, skipping item seeding');
    return await itemRepo.find();
  }

  const itemNames = [
    'Raw Material A',
    'Raw Material B',
    'Component X',
    'Component Y',
    'Finished Product 1',
    'Finished Product 2',
    'Packaging Material',
    'Accessory Item',
  ];

  const items = itemNames.map((name, index) => ({
    sku: `SKU${String(index + 1).padStart(4, '0')}`,
    name,
    description: `Description for ${name}`,
    warehouseId: randomElement(warehouses).id,
    quantityOnHand: randomBetween(100, 1000),
    reorderLevel: randomBetween(50, 200),
    unitCost: randomFloatBetween(10000, 500000),
  }));

  const savedItems = await itemRepo.save(itemRepo.create(items));
  return savedItems;
}

