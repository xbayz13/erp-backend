import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1700000000000 implements MigrationInterface {
  name = 'InitialMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Migration akan otomatis dibuat oleh TypeORM synchronize di development
    // File ini sebagai placeholder untuk production migrations
    // Untuk development, kita bisa menggunakan synchronize: true
    // Untuk production, generate migration dengan: npm run db:migration:generate
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback migration
  }
}

