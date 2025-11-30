# 📚 Migration & Seeding Guide

## Quick Start

### 1. Generate Initial Migration

Karena sistem sudah menggunakan `autoLoadEntities: true`, TypeORM akan otomatis mendeteksi semua entities. Untuk generate migration pertama:

```bash
npm run db:migration:generate InitialMigration
```

Atau jika database sudah ada schema (dari synchronize), kita bisa skip generate dan langsung run migration yang sudah ada.

### 2. Run Migration

```bash
npm run db:migration
```

### 3. Seed Data (7 hari terakhir)

```bash
npm run db:seed
```

## Seeder Data Overview

Seeder akan membuat data realistis untuk **7 hari terakhir** dengan:

### Users (8 users)
- Admin, Warehouse Manager, Purchasing Staff, Sales Staff
- Finance Manager, Production Manager, Production Supervisor, Finance Staff

### Master Data
- **3 Warehouses**: Main (Jakarta), Secondary (Bandung), Production (Surabaya)
- **3 Suppliers**: Dengan performance metrics dan ratings
- **3 Customers**: Dengan credit limits dan segments (VIP, Regular)
- **10 Items**: Raw materials, components, finished products

### Transaction Data (7 hari terakhir)

#### Purchase Orders (15-20 POs)
- Tersebar selama 7 hari
- Status: DRAFT, APPROVED, RECEIVED
- Include items dengan quantities dan prices

#### Stock Movements (25-35 movements)
- INBOUND dari purchase orders
- OUTBOUND untuk sales/production
- Tersebar selama 7 hari

#### Sales Orders (12-18 SOs)
- Tersebar selama 7 hari
- Status: DRAFT, CONFIRMED, IN_PROGRESS, SHIPPED, DELIVERED
- Include items dengan pricing

#### Production Orders (5-8 POs)
- Tersebar selama 7 hari
- Status: PLANNED, IN_PROGRESS, COMPLETED
- Include material requirements

#### Invoices
- Dari purchase orders yang sudah received
- Status: ISSUED, PAID
- Dengan payment dates

#### Financial Transactions
- Payments dari paid invoices
- Revenue transactions
- Expense transactions
- Tersebar selama 7 hari

## Notes

- Semua data memiliki timestamps yang tersebar realistis selama 7 hari terakhir
- Relationships antara entities sudah di-set dengan benar
- Data dibuat untuk membuat dashboard dan laporan terlihat realistis
- Default password untuk semua users: `password123`

## Troubleshooting

### Migration Error: Entities not found

Jika migration tidak menemukan entities, pastikan:
1. File `data-source.ts` menggunakan path yang benar
2. Entities menggunakan decorator `@Entity()` dengan benar
3. Entities di-import di module yang sesuai

### Seeder Error: Cannot find module

Pastikan:
1. Dependencies sudah di-install: `npm install`
2. Environment variables sudah di-set
3. Database sudah running dan accessible

