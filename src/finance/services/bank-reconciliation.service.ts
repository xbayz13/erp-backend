import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { BankAccount } from '../entities/bank-account.entity';
import { BankTransaction, ReconciliationStatus } from '../entities/bank-transaction.entity';
import { FinancialTransaction } from '../entities/financial-transaction.entity';

@Injectable()
export class BankReconciliationService {
  constructor(
    @InjectRepository(BankAccount)
    private readonly bankAccountRepository: Repository<BankAccount>,
    @InjectRepository(BankTransaction)
    private readonly bankTransactionRepository: Repository<BankTransaction>,
    @InjectRepository(FinancialTransaction)
    private readonly financialTransactionRepository: Repository<FinancialTransaction>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createBankAccount(
    accountNumber: string,
    accountName: string,
    bankName: string,
    currency: string = 'IDR',
    actorId?: string,
  ): Promise<BankAccount> {
    const account = this.bankAccountRepository.create({
      accountNumber,
      accountName,
      bankName,
      currency,
    });

    const created = await this.bankAccountRepository.save(account);

    if (actorId) {
      await this.auditLogService.record({
        actorId,
        action: 'FINANCE_CREATE_BANK_ACCOUNT',
        entity: 'BankAccount',
        entityId: created.id,
        after: created as any,
      });
    }

    return created;
  }

  async recordBankTransaction(
    bankAccountId: string,
    type: string,
    amount: number,
    transactionDate: Date,
    reference?: string,
    description?: string,
    actorId?: string,
  ): Promise<BankTransaction> {
    const transaction = this.bankTransactionRepository.create({
      bankAccountId,
      type: type as any,
      amount,
      transactionDate,
      reference,
      description,
    });

    const created = await this.bankTransactionRepository.save(transaction);

    // Update bank account balance
    const account = await this.bankAccountRepository.findOne({
      where: { id: bankAccountId },
    });
    if (account) {
      if (type === 'DEPOSIT') {
        account.balance += amount;
      } else if (type === 'WITHDRAWAL') {
        account.balance -= amount;
      }
      await this.bankAccountRepository.save(account);
    }

    if (actorId) {
      await this.auditLogService.record({
        actorId,
        action: 'FINANCE_RECORD_BANK_TRANSACTION',
        entity: 'BankTransaction',
        entityId: created.id,
        after: created as any,
      });
    }

    return created;
  }

  async matchTransaction(
    bankTransactionId: string,
    financialTransactionId: string,
    actorId: string,
  ): Promise<BankTransaction> {
    const bankTx = await this.bankTransactionRepository.findOne({
      where: { id: bankTransactionId },
    });
    if (!bankTx) {
      throw new Error(`Bank transaction ${bankTransactionId} not found`);
    }

    const financialTx = await this.financialTransactionRepository.findOne({
      where: { id: financialTransactionId },
    });
    if (!financialTx) {
      throw new Error(`Financial transaction ${financialTransactionId} not found`);
    }

    const before = { ...bankTx };
    bankTx.matchedTransactionId = financialTransactionId;
    bankTx.reconciliationStatus = ReconciliationStatus.MATCHED;
    const updated = await this.bankTransactionRepository.save(bankTx);

    await this.auditLogService.record({
      actorId,
      action: 'FINANCE_MATCH_BANK_TRANSACTION',
      entity: 'BankTransaction',
      entityId: updated.id,
      before: before as any,
      after: updated as any,
    });

    return updated;
  }

  async listBankAccounts(): Promise<BankAccount[]> {
    return this.bankAccountRepository.find({
      where: { isActive: true },
      order: { accountName: 'ASC' },
    });
  }

  async reconcile(
    bankAccountId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{
    matched: number;
    unmatched: number;
    total: number;
  }> {
    const transactions = await this.bankTransactionRepository.find({
      where: {
        bankAccountId,
        transactionDate: Between(startDate, endDate),
      },
    });

    const matched = transactions.filter(
      (t) => t.reconciliationStatus === ReconciliationStatus.MATCHED,
    ).length;
    const unmatched = transactions.filter(
      (t) => t.reconciliationStatus === ReconciliationStatus.PENDING,
    ).length;

    return {
      matched,
      unmatched,
      total: transactions.length,
    };
  }
}

