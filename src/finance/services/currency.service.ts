import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Currency } from '../entities/currency.entity';
import { ExchangeRate } from '../entities/exchange-rate.entity';

@Injectable()
export class CurrencyService {
  constructor(
    @InjectRepository(Currency)
    private readonly currencyRepository: Repository<Currency>,
    @InjectRepository(ExchangeRate)
    private readonly exchangeRateRepository: Repository<ExchangeRate>,
  ) {}

  async createCurrency(
    code: string,
    name: string,
    symbol: string,
    decimalPlaces: number,
    isBaseCurrency: boolean = false,
  ): Promise<Currency> {
    if (isBaseCurrency) {
      // Unset other base currencies
      await this.currencyRepository.update(
        { isBaseCurrency: true },
        { isBaseCurrency: false },
      );
    }

    const currency = this.currencyRepository.create({
      code,
      name,
      symbol,
      decimalPlaces,
      isBaseCurrency,
    });

    return this.currencyRepository.save(currency);
  }

  async listCurrencies(): Promise<Currency[]> {
    return this.currencyRepository.find({
      where: { isActive: true },
      order: { code: 'ASC' },
    });
  }

  async getBaseCurrency(): Promise<Currency | null> {
    return this.currencyRepository.findOne({
      where: { isBaseCurrency: true, isActive: true },
    });
  }

  async createExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    rate: number,
    effectiveDate: Date,
    expiryDate?: Date,
  ): Promise<ExchangeRate> {
    const exchangeRate = this.exchangeRateRepository.create({
      fromCurrency,
      toCurrency,
      rate,
      effectiveDate,
      expiryDate,
    });

    return this.exchangeRateRepository.save(exchangeRate);
  }

  async getExchangeRate(
    fromCurrency: string,
    toCurrency: string,
    date?: Date,
  ): Promise<number | null> {
    const queryDate = date || new Date();

    const rate = await this.exchangeRateRepository.findOne({
      where: {
        fromCurrency,
        toCurrency,
        isActive: true,
      },
      order: { effectiveDate: 'DESC' },
    });

    if (!rate) return null;
    if (rate.effectiveDate > queryDate) return null;
    if (rate.expiryDate && rate.expiryDate < queryDate) return null;

    return rate.rate;
  }

  async convertAmount(
    amount: number,
    fromCurrency: string,
    toCurrency: string,
    date?: Date,
  ): Promise<number> {
    if (fromCurrency === toCurrency) return amount;

    const rate = await this.getExchangeRate(fromCurrency, toCurrency, date);
    if (!rate) {
      throw new Error(
        `Exchange rate not found for ${fromCurrency} to ${toCurrency}`,
      );
    }

    return amount * rate;
  }
}

