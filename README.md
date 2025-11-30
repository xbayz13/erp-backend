# ERP Backend API

Enterprise Resource Planning (ERP) system backend built with NestJS, implementing SOLID principles and comprehensive business modules.

## 🚀 Tech Stack

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT (Passport.js)
- **Validation**: class-validator, class-transformer
- **Documentation**: Swagger/OpenAPI
- **Real-time**: Socket.IO (WebSocket)
- **Testing**: Jest
- **Rate Limiting**: @nestjs/throttler

## 📦 Features

### Core Modules

1. **Inventory & Warehouse Management**
   - Item management (CRUD)
   - Multi-location warehouse support
   - Barcode/QR Code generation
   - Batch/Lot tracking
   - Serial number tracking
   - Cycle counting & stocktaking
   - Stock movements (inbound/outbound/transfer)

2. **Procurement & Supplier Management**
   - Purchase Order management
   - Supplier management with performance analytics
   - Purchase Requisition (PR) workflow
   - Request for Quotation (RFQ)
   - Supplier ranking system

3. **Sales & Customer Management**
   - Customer management
   - Sales Order management
   - Quotation & Pricing management
   - Price lists and discounts

4. **Finance & Accounting**
   - Financial transactions
   - Invoice management
   - Multi-currency support
   - Tax management
   - Payment terms & Credit management
   - Bank reconciliation
   - Budget & Forecasting

5. **Production & Manufacturing**
   - Production Order management
   - Bill of Materials (BOM)
   - Work Center & Routing
   - Quality Control (QC) module
   - Maintenance management

6. **Reporting & Analytics**
   - Operational snapshot
   - Advanced analytics dashboard
   - Custom report builder
   - Data export/import (Excel)

7. **System Features**
   - Notification system
   - Document management
   - Session management
   - Two-Factor Authentication (2FA)
   - Activity logging & monitoring
   - Data encryption at rest
   - IP whitelisting
   - Approval workflow engine
   - Event-driven architecture
   - Backup & restore system
   - Multi-language support (i18n)
   - Integration Hub (API Gateway/Webhooks)

## 🔧 Installation

```bash
# Install dependencies
npm install

# Copy environment file
cp env.example .env

# Configure environment variables
# Edit .env file with your database credentials
```

## ⚙️ Configuration

Create a `.env` file in the backend directory:

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password
POSTGRES_DB=erp

# JWT
JWT_SECRET=your_jwt_secret_key

# Server
PORT=3000
NODE_ENV=development

# Optional: Encryption
ENCRYPTION_SECRET=your_encryption_key

# Optional: IP Whitelist (comma-separated)
IP_WHITELIST=127.0.0.1,::1

# Optional: Backup Directory
BACKUP_DIR=./backups
```

## 🏃 Running the Application

```bash
# Development mode
npm run start:dev

# Production build
npm run build
npm run start

# Run tests
npm test

# Run tests with coverage
npm run test:cov
```

## 📚 API Documentation

Once the server is running, access Swagger documentation at:

```
http://localhost:3000/api/docs
```

## 🗂️ Project Structure

```
src/
├── app/              # App module (root)
├── audit/            # Audit logging & error tracking
├── auth/             # Authentication & authorization
├── common/           # Shared utilities, guards, decorators
├── finance/          # Finance & accounting module
├── inventory/        # Inventory & warehouse module
├── production/       # Production & manufacturing module
├── purchasing/       # Procurement & supplier module
├── realtime/         # WebSocket real-time updates
├── reports/          # Reporting module
├── sales/            # Sales & customer module
├── system/           # System features (notifications, docs, etc.)
├── users/            # User management
└── main.ts           # Application entry point
```

## 🔐 Authentication

The API uses JWT Bearer token authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## 👥 User Roles

The system supports multiple user roles with Role-Based Access Control (RBAC):

- `ADMIN` - Full system access
- `MANAGER` - Management access
- `STAFF` - Standard user access
- `WAREHOUSE_MANAGER` - Warehouse operations
- `PURCHASING_STAFF` - Purchasing operations
- `FINANCE_ADMIN` - Finance administration
- `FINANCE_MANAGER` - Finance management
- `FINANCE_STAFF` - Finance operations
- `PRODUCTION_MANAGER` - Production management
- `PRODUCTION_SUPERVISOR` - Production supervision
- `PRODUCTION_STAFF` - Production operations
- `AUDITOR` - Audit access
- `SALES_STAFF` - Sales operations

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:cov
```

**Test Coverage**: 226 unit tests covering all major services.

## 🔒 Security Features

- JWT authentication
- Role-based access control (RBAC)
- Rate limiting (100 requests/minute)
- Input validation
- Data encryption at rest
- IP whitelisting support
- Two-Factor Authentication (2FA)
- Session management
- Comprehensive audit logging

## 📊 Database

The application uses PostgreSQL with TypeORM. Database schema is automatically synchronized in development mode. For production, use migrations.

## 🌐 API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Main Endpoints

- `/auth` - Authentication
- `/inventory` - Inventory management
- `/purchasing` - Procurement
- `/finance` - Finance & accounting
- `/production` - Production management
- `/sales` - Sales & customer management
- `/reports` - Reporting
- `/system` - System features
- `/docs` - Swagger documentation

## 🛠️ Development

### Code Style

The project follows SOLID principles:
- **Single Responsibility**: Each service/controller has a single responsibility
- **Open/Closed**: Extensible through dependency injection
- **Liskov Substitution**: Proper interface usage
- **Interface Segregation**: Focused interfaces
- **Dependency Inversion**: Dependency injection throughout

### Adding a New Feature

1. Create entity in appropriate module
2. Create DTOs for request/response
3. Implement service with business logic
4. Create controller with endpoints
5. Add unit tests
6. Update module exports

## 📝 License

Private project - All rights reserved

## 👨‍💻 Author

ERP Development Team

---

**Version**: 0.1.0  
**Last Updated**: 2024

