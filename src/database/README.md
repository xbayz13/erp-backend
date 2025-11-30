# Database Migration & Seeding

Dokumentasi untuk migration dan seeding database ERP.

## Setup

Pastikan environment variables sudah dikonfigurasi di file `.env` atau `env.local`:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=erp
```

## Migration

### Generate Migration

Generate migration dari perubahan entities:

```bash
npm run db:migration:generate MigrationName
```

### Create Empty Migration

Buat migration kosong (untuk manual SQL):

```bash
npm run db:migration:create MigrationName
```

### Run Migrations

Jalankan semua pending migrations:

```bash
npm run db:migration
# atau
npm run db:migration:run
```

### Revert Last Migration

Revert migration terakhir:

```bash
npm run db:migration:revert
```

### Show Migration Status

Lihat status migrations:

```bash
npm run db:migration:show
```

## Seeding

Seeder dibagi menjadi 2 jenis:

### 1. Initial Seed (Data Penting untuk Memulai)

Data minimal yang diperlukan untuk sistem bisa berjalan:

```bash
npm run db:seed:initial
```

**Data yang dibuat:**
- **8 Users** dengan berbagai roles (Admin, Manager, Staff, dll)
  - Password default: `password123`
- **2 Warehouses** (Main Warehouse, Secondary Warehouse)
- **3 Suppliers** dengan performance metrics
- **3 Customers** dengan credit limits
- **8 Items** (raw materials, components, finished products) dengan stock

**Gunakan saat:**
- First time setup sistem
- Reset database
- Hanya butuh data dasar untuk development

### 2. Test Data Seed (Data 7 Hari untuk Testing View)

Data transaksi 7 hari terakhir untuk keperluan testing dan melihat tampilan:

```bash
npm run db:seed:test
```

**Data yang dibuat (7 hari terakhir):**
- **15-20 Purchase Orders** dengan berbagai status
- **25-35 Stock Movements** (inbound dari PO, outbound untuk sales/production)
- **12-18 Sales Orders** dengan berbagai status
- **5-8 Production Orders** dengan berbagai status
- **Invoices** dari purchase orders yang sudah received
- **Financial Transactions** (payments, revenue, expenses)

**Gunakan saat:**
- Ingin melihat data di dashboard
- Testing reports dan analytics
- Demo aplikasi dengan data realistis

**Catatan:** Test data seed membutuhkan initial data yang sudah ada. Jalankan `db:seed:initial` terlebih dahulu.

### 3. Seed Semua (Initial + Test Data)

Jalankan kedua seed sekaligus:

```bash
npm run db:seed
```

Ini akan menjalankan initial seed terlebih dahulu, kemudian test data seed.

## Workflow

1. **First Time Setup:**
   ```bash
   # Pastikan database sudah dibuat
   createdb erp

   # Generate initial migration dari entities
   npm run db:migration:generate InitialMigration

   # Run migration
   npm run db:migration

   # Seed initial data (essential setup)
   npm run db:seed:initial

   # (Optional) Seed test data untuk melihat dashboard dengan data
   npm run db:seed:test
   
   # Atau seed semua sekaligus
   npm run db:seed
   ```

2. **After Entity Changes:**
   ```bash
   # Generate migration dari perubahan
   npm run db:migration:generate AddNewFeature

   # Review migration file di src/database/migrations/
   
   # Run migration
   npm run db:migration
   ```

## Notes

- Migration files disimpan di `src/database/migrations/`
- Seeder files:
  - `src/database/seeds/index.ts` - Main entry point
  - `src/database/seeds/initial-seed.ts` - Initial essential data
  - `src/database/seeds/test-data-seed.ts` - 7 days test data
- Pastikan database sudah running sebelum menjalankan migration/seeder
- Seeder akan membuat data baru tanpa menghapus data existing (jika ada)
- Initial seed akan skip jika data sudah ada (users, warehouses, items, dll)
- Test data seed akan selalu membuat data baru (untuk testing)

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm run db:seed:initial` | Seed essential setup data only |
| `npm run db:seed:test` | Seed 7 days of test transaction data |
| `npm run db:seed` | Seed both initial and test data |

