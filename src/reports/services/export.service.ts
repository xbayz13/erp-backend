import { Injectable } from '@nestjs/common';
import { Response } from 'express';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { CashFlowReport, ProfitLossReport, BalanceSheetReport } from '../dto/finance-report.dto';
import { StockReport } from '../dto/stock-report.dto';

@Injectable()
export class ExportService {
  async exportStockReportToExcel(report: StockReport, res: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Report');

    worksheet.columns = [
      { header: 'SKU', key: 'sku', width: 15 },
      { header: 'Nama', key: 'name', width: 30 },
      { header: 'Gudang', key: 'warehouse', width: 20 },
      { header: 'Qty On Hand', key: 'qty', width: 12 },
      { header: 'Reorder Level', key: 'reorder', width: 12 },
      { header: 'Unit Cost', key: 'cost', width: 15 },
      { header: 'Stock Value', key: 'value', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
    ];

    report.items.forEach((item) => {
      worksheet.addRow({
        sku: item.sku,
        name: item.name,
        warehouse: item.warehouseName,
        qty: item.quantityOnHand,
        reorder: item.reorderLevel,
        cost: item.unitCost,
        value: item.stockValue,
        status: item.status,
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=stock-report-${new Date().toISOString().split('T')[0]}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  async exportStockReportToPDF(report: StockReport, res: Response) {
    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=stock-report-${new Date().toISOString().split('T')[0]}.pdf`,
    );

    doc.pipe(res);

    doc.fontSize(20).text('Stock Report', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Period: ${new Date(report.period.start).toLocaleDateString()} - ${new Date(report.period.end).toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(14).text('Summary', { underline: true });
    doc.fontSize(10);
    doc.text(`Total Items: ${report.summary.totalItems}`);
    doc.text(`Total Stock Value: Rp ${report.summary.totalStockValue.toLocaleString('id-ID')}`);
    doc.text(`Low Stock Items: ${report.summary.lowStockItems}`);
    doc.moveDown();

    doc.fontSize(14).text('Items', { underline: true });
    doc.moveDown(0.5);

    report.items.slice(0, 50).forEach((item, index) => {
      doc.fontSize(9);
      doc.text(
        `${index + 1}. ${item.sku} - ${item.name} | Qty: ${item.quantityOnHand} | Value: Rp ${item.stockValue.toLocaleString('id-ID')} | Status: ${item.status}`,
        { indent: 20 },
      );
      if ((index + 1) % 20 === 0) {
        doc.addPage();
      }
    });

    doc.end();
  }

  async exportFinanceReportToExcel(
    report: CashFlowReport | ProfitLossReport | BalanceSheetReport,
    type: 'cash-flow' | 'profit-loss' | 'balance-sheet',
    res: Response,
  ) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Finance Report');

    if (type === 'cash-flow') {
      const cfReport = report as CashFlowReport;
      worksheet.addRow(['Cash Flow Report']);
      worksheet.addRow(['Period', `${cfReport.period.start} - ${cfReport.period.end}`]);
      worksheet.addRow(['Opening Balance', cfReport.openingBalance]);
      worksheet.addRow(['Inflows - Revenue', cfReport.inflows.revenue]);
      worksheet.addRow(['Inflows - Total', cfReport.inflows.total]);
      worksheet.addRow(['Outflows - Expenses', cfReport.outflows.expenses]);
      worksheet.addRow(['Outflows - Payments', cfReport.outflows.payments]);
      worksheet.addRow(['Outflows - Total', cfReport.outflows.total]);
      worksheet.addRow(['Closing Balance', cfReport.closingBalance]);
    } else if (type === 'profit-loss') {
      const plReport = report as ProfitLossReport;
      worksheet.addRow(['Profit & Loss Report']);
      worksheet.addRow(['Period', `${plReport.period.start} - ${plReport.period.end}`]);
      worksheet.addRow(['Revenue - Total', plReport.revenue.total]);
      worksheet.addRow(['Expenses - Total', plReport.expenses.total]);
      worksheet.addRow(['Gross Profit', plReport.grossProfit]);
      worksheet.addRow(['Operating Profit', plReport.operatingProfit]);
      worksheet.addRow(['Net Income', plReport.netIncome]);
    } else {
      const bsReport = report as BalanceSheetReport;
      worksheet.addRow(['Balance Sheet Report']);
      worksheet.addRow(['As Of', bsReport.asOf]);
      worksheet.addRow(['Assets - Current - Total', bsReport.assets.current.total]);
      worksheet.addRow(['Assets - Fixed - Total', bsReport.assets.fixed.total]);
      worksheet.addRow(['Assets - Total', bsReport.assets.total]);
      worksheet.addRow(['Liabilities - Current - Total', bsReport.liabilities.current.total]);
      worksheet.addRow(['Liabilities - Long Term - Total', bsReport.liabilities.longTerm.total]);
      worksheet.addRow(['Liabilities - Total', bsReport.liabilities.total]);
      worksheet.addRow(['Equity - Total', bsReport.equity.total]);
    }

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=${type}-report-${new Date().toISOString().split('T')[0]}.xlsx`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}

