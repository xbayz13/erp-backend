# 🔧 Migration Troubleshooting

## Masalah: `npm run db:migration:generate` sangat lama

### Penyebab Umum:

1. **Database tidak running atau tidak accessible**
   - TypeORM mencoba connect ke database untuk membandingkan schema
   - Jika database tidak ada atau lambat, proses akan hang

2. **Terlalu banyak entities (48 entities)**
   - TypeORM perlu scan semua entities dan membandingkan dengan database
   - Proses ini bisa memakan waktu

3. **Path entities tidak ditemukan**
   - TypeORM mencoba load entities tapi tidak menemukan file
   - Akan retry berkali-kali

### Solusi:

#### Opsi 1: Gunakan Synchronize untuk Development (Paling Cepat)

Karena di development sudah menggunakan `synchronize: true`, kita tidak perlu migration untuk development:

```typescript
// app.module.ts sudah ada:
synchronize: config.get<string>('NODE_ENV') !== 'production',
```

**Untuk development:**
- Tidak perlu migration
- Schema akan otomatis dibuat/update saat start aplikasi
- Langsung seed data: `npm run db:seed`

#### Opsi 2: Pastikan Database Running

```bash
# Cek apakah PostgreSQL running
pg_isready -h localhost -p 5432

# Atau cek dengan psql
psql -h localhost -U postgres -d erp -c "SELECT 1;"
```

#### Opsi 3: Buat Database Kosong Dulu

```bash
# Buat database jika belum ada
createdb erp

# Atau dengan psql
psql -U postgres -c "CREATE DATABASE erp;"
```

#### Opsi 4: Skip Migration Generate (Untuk Development)

Karena development sudah pakai `synchronize: true`, kita bisa skip migration:

1. **Start aplikasi** - Schema akan otomatis dibuat
2. **Seed data** - `npm run db:seed`
3. **Untuk production nanti**, baru generate migration dari schema yang sudah ada

#### Opsi 5: Optimasi data-source.ts

File `data-source.ts` sudah dioptimasi dengan:
- `logging: false` - Disable logging
- `connectTimeoutMS: 5000` - Timeout connection
- `max: 1` - Limit connection pool

### Workflow yang Disarankan:

**Development:**
```bash
# 1. Pastikan database running
# 2. Start aplikasi (schema auto-create)
npm run start:dev

# 3. Seed data
npm run db:seed
```

**Production:**
```bash
# 1. Generate migration dari schema existing
npm run db:migration:generate InitialMigration

# 2. Review migration file
# 3. Run migration
npm run db:migration
```

### Catatan Penting:

- **Development**: Gunakan `synchronize: true` (sudah ada di app.module.ts)
- **Production**: Gunakan migrations (disable synchronize)
- Migration generate hanya diperlukan jika ingin version control schema changes
- Untuk development, langsung seed data tanpa migration

### Quick Fix:

Jika migration generate masih lambat, gunakan workflow ini:

```bash
# 1. Start aplikasi sekali (akan create schema)
npm run start:dev
# (Stop setelah schema dibuat)

# 2. Seed data
npm run db:seed

# 3. Untuk production nanti, generate migration dari schema yang sudah ada
```

