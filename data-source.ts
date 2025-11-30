import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import * as path from 'path';

// Load environment variables
// Load .env first, then env.local (env.local has higher priority and will override .env)
config({ path: path.resolve(process.cwd(), '.env') });
config({ path: path.resolve(process.cwd(), 'env.local') });

export default new DataSource({
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  username: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'erp',
  // Use glob pattern for entities - TypeORM will auto-discover
  // This is faster than importing all entities explicitly
  entities: [path.join(__dirname, 'src/**/*.entity{.ts,.js}')],
  migrations: [path.join(__dirname, 'src/database/migrations/**/*{.ts,.js}')],
  synchronize: false,
  logging: false, // Disable logging for faster migration generation
  // Connection timeout to avoid hanging
  extra: {
    max: 1, // Limit connection pool for migration
    connectionTimeoutMillis: 5000,
  },
});

