import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ExportService } from '../services/export.service';
import { ReportsService } from '../services/reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ExportService,
  ) {}

  @Get('snapshot')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getSnapshot() {
    return this.reportsService.getOperationalSnapshot();
  }

  @Get('audit')
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  listAuditLogs() {
    return this.reportsService.listAuditLogs();
  }

  @Get('finance/cash-flow')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  getCashFlow(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCashFlowReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('finance/profit-loss')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  getProfitLoss(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getProfitLossReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('finance/balance-sheet')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  getBalanceSheet(@Query('asOf') asOf?: string) {
    return this.reportsService.getBalanceSheetReport(
      asOf ? new Date(asOf) : undefined,
    );
  }

  @Get('inventory/stock')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER)
  getStockReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getStockReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('inventory/stock/export/excel')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER)
  async exportStockReportExcel(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.reportsService.getStockReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    await this.exportService.exportStockReportToExcel(report, res);
  }

  @Get('inventory/stock/export/pdf')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER)
  async exportStockReportPdf(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.reportsService.getStockReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    await this.exportService.exportStockReportToPDF(report, res);
  }

  @Get('finance/cash-flow/export/excel')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  async exportCashFlowExcel(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.reportsService.getCashFlowReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    await this.exportService.exportFinanceReportToExcel(report, 'cash-flow', res);
  }

  @Get('finance/profit-loss/export/excel')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  async exportProfitLossExcel(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const report = await this.reportsService.getProfitLossReport(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
    await this.exportService.exportFinanceReportToExcel(report, 'profit-loss', res);
  }

  @Get('finance/balance-sheet/export/excel')
  @Roles(UserRole.ADMIN, UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER)
  async exportBalanceSheetExcel(
    @Res() res: Response,
    @Query('asOf') asOf?: string,
  ) {
    const report = await this.reportsService.getBalanceSheetReport(
      asOf ? new Date(asOf) : undefined,
    );
    await this.exportService.exportFinanceReportToExcel(report, 'balance-sheet', res);
  }
}


