import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { IssueInvoiceDto } from '../dto/issue-invoice.dto';
import { RecordTransactionDto } from '../dto/record-transaction.dto';
import { SettleInvoiceDto } from '../dto/settle-invoice.dto';
import { FinanceService } from '../services/finance.service';
import { CurrencyService } from '../services/currency.service';
import { TaxService } from '../services/tax.service';
import { PaymentTermService } from '../services/payment-term.service';
import { BankReconciliationService } from '../services/bank-reconciliation.service';
import { BudgetForecastService } from '../services/budget-forecast.service';
import { TaxType } from '../entities/tax-rate.entity';

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinanceController {
  constructor(
    private readonly financeService: FinanceService,
    private readonly currencyService: CurrencyService,
    private readonly taxService: TaxService,
    private readonly paymentTermService: PaymentTermService,
    private readonly bankReconciliationService: BankReconciliationService,
    private readonly budgetForecastService: BudgetForecastService,
  ) {}

  @Get('transactions')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  listTransactions() {
    return this.financeService.listTransactions();
  }

  @Post('transactions')
  @Roles(UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER, UserRole.FINANCE_STAFF)
  recordTransaction(
    @Body() dto: RecordTransactionDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.recordTransaction(dto, req.user.userId);
  }

  @Get('invoices')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  listInvoices() {
    return this.financeService.listInvoices();
  }

  @Post('invoices')
  @Roles(UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  issueInvoice(@Body() dto: IssueInvoiceDto, @Req() req: AuthenticatedRequest) {
    return this.financeService.issueInvoice(dto, req.user.userId);
  }

  @Patch('invoices/:id/settle')
  @Roles(UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  settleInvoice(
    @Param('id') id: string,
    @Body() dto: SettleInvoiceDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.financeService.settleInvoice(id, dto, req.user.userId);
  }

  // Currency endpoints
  @Get('currencies')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  listCurrencies() {
    return this.currencyService.listCurrencies();
  }

  @Get('currencies/base')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  getBaseCurrency() {
    return this.currencyService.getBaseCurrency();
  }

  @Get('currencies/convert')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  convertAmount(
    @Query('amount') amount: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    return this.currencyService.convertAmount(
      parseFloat(amount),
      from,
      to,
    );
  }

  // Tax endpoints
  @Get('tax-rates')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  listTaxRates(@Query('type') type?: TaxType) {
    return this.taxService.listTaxRates(type);
  }

  @Post('tax-rates/calculate')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  calculateTax(
    @Body('amount') amount: number,
    @Body('taxCode') taxCode: string,
  ) {
    return this.taxService.calculateTax(amount, taxCode);
  }

  // Payment Terms endpoints
  @Get('payment-terms')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  listPaymentTerms() {
    return this.paymentTermService.list();
  }

  // Bank Reconciliation endpoints
  @Get('bank-accounts')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  listBankAccounts() {
    return this.bankReconciliationService.listBankAccounts();
  }

  @Get('payment-terms/:code/aging')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  getAgingReport(
    @Param('code') code: string,
    @Query('invoiceDate') invoiceDate: string,
  ) {
    return this.paymentTermService.getAgingReport(
      new Date(invoiceDate),
      code,
    );
  }

  // Budget & Forecast endpoints
  @Get('budgets/:id/variance')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  getBudgetVariance(@Param('id') id: string) {
    return this.budgetForecastService.getBudgetVariance(id);
  }

  @Get('forecasts/:id/accuracy')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  getForecastAccuracy(@Param('id') id: string) {
    return this.budgetForecastService.getForecastAccuracy(id);
  }
}


