import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '../audit/audit.module';
import { PurchasingModule } from '../purchasing/purchasing.module';
import { FinanceController } from './controllers/finance.controller';
import { FinancialTransaction } from './entities/financial-transaction.entity';
import { Invoice } from './entities/invoice.entity';
import { Currency } from './entities/currency.entity';
import { ExchangeRate } from './entities/exchange-rate.entity';
import { TaxRate } from './entities/tax-rate.entity';
import { PaymentTerm } from './entities/payment-term.entity';
import { BankAccount } from './entities/bank-account.entity';
import { BankTransaction } from './entities/bank-transaction.entity';
import { Budget } from './entities/budget.entity';
import { Forecast } from './entities/forecast.entity';
import { FinanceService } from './services/finance.service';
import { CurrencyService } from './services/currency.service';
import { TaxService } from './services/tax.service';
import { PaymentTermService } from './services/payment-term.service';
import { BankReconciliationService } from './services/bank-reconciliation.service';
import { BudgetForecastService } from './services/budget-forecast.service';

@Module({
  imports: [
    AuditModule,
    PurchasingModule,
    TypeOrmModule.forFeature([
      FinancialTransaction,
      Invoice,
      Currency,
      ExchangeRate,
      TaxRate,
      PaymentTerm,
      BankAccount,
      BankTransaction,
      Budget,
      Forecast,
    ]),
  ],
  controllers: [FinanceController],
  providers: [
    FinanceService,
    CurrencyService,
    TaxService,
    PaymentTermService,
    BankReconciliationService,
    BudgetForecastService,
  ],
  exports: [
    FinanceService,
    CurrencyService,
    TaxService,
    PaymentTermService,
    BankReconciliationService,
    BudgetForecastService,
  ],
})
export class FinanceModule {}


