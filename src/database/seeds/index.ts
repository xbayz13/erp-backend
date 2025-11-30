import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';
import { seedInitialData } from './initial-seed';
import { seedTestData } from './test-data-seed';

// Load environment variables
// Load .env first, then env.local (env.local has higher priority and will override .env)
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), 'env.local') });

/**
 * Main Seeder Entry Point
 * 
 * Usage:
 * - npm run db:seed:initial  - Seed essential setup data only
 * - npm run db:seed:test     - Seed 7 days of test data (requires initial data)
 * - npm run db:seed          - Seed both initial and test data
 */
async function seed() {
  const seedType = process.argv[2] || 'all'; // 'initial', 'test', or 'all'

  console.log('🌱 Starting database seeding...');
  console.log(`📋 Seed type: ${seedType}`);
  console.log('');

  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'erp',
    entities: [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
    synchronize: false,
    logging: false,
  });

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    console.log('');

    if (seedType === 'initial' || seedType === 'all') {
      await seedInitialData(AppDataSource);
      console.log('');
    }

    if (seedType === 'test' || seedType === 'all') {
      await seedTestData(AppDataSource);
      console.log('');
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('✅ Database connection closed');
    }
  }
}

// Run seeder
seed()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
