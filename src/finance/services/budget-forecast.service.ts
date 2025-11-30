import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Budget, BudgetType, BudgetPeriod } from '../entities/budget.entity';
import { Forecast, ForecastType } from '../entities/forecast.entity';
import { FinancialTransaction, FinancialTransactionType } from '../entities/financial-transaction.entity';

@Injectable()
export class BudgetForecastService {
  constructor(
    @InjectRepository(Budget)
    private readonly budgetRepository: Repository<Budget>,
    @InjectRepository(Forecast)
    private readonly forecastRepository: Repository<Forecast>,
    @InjectRepository(FinancialTransaction)
    private readonly transactionRepository: Repository<FinancialTransaction>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createBudget(
    name: string,
    type: BudgetType,
    period: BudgetPeriod,
    startDate: Date,
    endDate: Date,
    allocatedAmount: number,
    actorId: string,
    department?: string,
  ): Promise<Budget> {
    const budget = this.budgetRepository.create({
      name,
      type,
      period,
      startDate,
      endDate,
      allocatedAmount,
      department,
    });

    const created = await this.budgetRepository.save(budget);

    await this.auditLogService.record({
      actorId,
      action: 'FINANCE_CREATE_BUDGET',
      entity: 'Budget',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async updateBudgetActual(budgetId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id: budgetId },
    });
    if (!budget) {
      throw new Error(`Budget ${budgetId} not found`);
    }

    const transactions = await this.transactionRepository.find({
      where: {
        createdAt: Between(budget.startDate, budget.endDate),
      },
    });

    const actualAmount = transactions
      .filter((t) => {
        if (budget.type === BudgetType.REVENUE) {
          return t.type === FinancialTransactionType.REVENUE;
        } else if (budget.type === BudgetType.EXPENSE) {
          return t.type === FinancialTransactionType.EXPENSE;
        }
        return false;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    budget.actualAmount = actualAmount;
    return this.budgetRepository.save(budget);
  }

  async getBudgetVariance(budgetId: string) {
    const budget = await this.updateBudgetActual(budgetId);

    return {
      budget,
      variance: budget.allocatedAmount - budget.actualAmount,
      variancePercentage:
        budget.allocatedAmount > 0
          ? ((budget.allocatedAmount - budget.actualAmount) / budget.allocatedAmount) * 100
          : 0,
      utilizationPercentage:
        budget.allocatedAmount > 0
          ? (budget.actualAmount / budget.allocatedAmount) * 100
          : 0,
    };
  }

  async createForecast(
    name: string,
    type: ForecastType,
    forecastDate: Date,
    forecastedAmount: number,
    actorId: string,
    confidenceLevel?: number,
    method?: string,
  ): Promise<Forecast> {
    const forecast = this.forecastRepository.create({
      name,
      type,
      forecastDate,
      forecastedAmount,
      confidenceLevel,
      method,
    });

    const created = await this.forecastRepository.save(forecast);

    await this.auditLogService.record({
      actorId,
      action: 'FINANCE_CREATE_FORECAST',
      entity: 'Forecast',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async updateForecastActual(forecastId: string, actualAmount: number): Promise<Forecast> {
    const forecast = await this.forecastRepository.findOne({
      where: { id: forecastId },
    });
    if (!forecast) {
      throw new Error(`Forecast ${forecastId} not found`);
    }

    forecast.actualAmount = actualAmount;
    return this.forecastRepository.save(forecast);
  }

  async getForecastAccuracy(forecastId: string) {
    const forecast = await this.forecastRepository.findOne({
      where: { id: forecastId },
    });
    if (!forecast || !forecast.actualAmount) {
      throw new Error(`Forecast ${forecastId} not found or actual amount not set`);
    }

    const variance = forecast.forecastedAmount - forecast.actualAmount;
    const accuracy = forecast.forecastedAmount > 0
      ? (1 - Math.abs(variance) / forecast.forecastedAmount) * 100
      : 0;

    return {
      forecast,
      variance,
      accuracy,
    };
  }
}

