import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TranslationKey {
  key: string;
  translations: Record<string, string>;
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  isDefault: boolean;
}

@Injectable()
export class I18nService {
  private readonly defaultLanguage = 'en';
  private translations: Map<string, Map<string, string>> = new Map();

  constructor(private readonly configService: ConfigService) {
    this.initializeTranslations();
  }

  private initializeTranslations() {
    // Initialize with English (default)
    this.translations.set('en', new Map());
    this.translations.set('id', new Map());
    
    // Load default translations
    this.loadTranslations('en', {
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'common.edit': 'Edit',
      'common.create': 'Create',
      'common.search': 'Search',
      'common.filter': 'Filter',
      'common.export': 'Export',
      'common.import': 'Import',
      'inventory.item': 'Item',
      'inventory.quantity': 'Quantity',
      'inventory.stock': 'Stock',
      'purchasing.order': 'Purchase Order',
      'sales.order': 'Sales Order',
      'finance.transaction': 'Transaction',
      'production.order': 'Production Order',
    });

    this.loadTranslations('id', {
      'common.save': 'Simpan',
      'common.cancel': 'Batal',
      'common.delete': 'Hapus',
      'common.edit': 'Edit',
      'common.create': 'Buat',
      'common.search': 'Cari',
      'common.filter': 'Filter',
      'common.export': 'Ekspor',
      'common.import': 'Impor',
      'inventory.item': 'Barang',
      'inventory.quantity': 'Jumlah',
      'inventory.stock': 'Stok',
      'purchasing.order': 'Pesanan Pembelian',
      'sales.order': 'Pesanan Penjualan',
      'finance.transaction': 'Transaksi',
      'production.order': 'Pesanan Produksi',
    });
  }

  loadTranslations(languageCode: string, translations: Record<string, string>): void {
    if (!this.translations.has(languageCode)) {
      this.translations.set(languageCode, new Map());
    }

    const langMap = this.translations.get(languageCode)!;
    Object.entries(translations).forEach(([key, value]) => {
      langMap.set(key, value);
    });
  }

  translate(key: string, languageCode: string = this.defaultLanguage, params?: Record<string, string>): string {
    const langMap = this.translations.get(languageCode) || this.translations.get(this.defaultLanguage);
    
    if (!langMap) {
      return key;
    }

    let translation = langMap.get(key) || key;

    // Replace parameters
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, paramValue);
      });
    }

    return translation;
  }

  getAvailableLanguages(): Language[] {
    return [
      { code: 'en', name: 'English', nativeName: 'English', isDefault: true },
      { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', isDefault: false },
    ];
  }

  getDefaultLanguage(): string {
    return this.defaultLanguage;
  }

  addTranslation(languageCode: string, key: string, value: string): void {
    if (!this.translations.has(languageCode)) {
      this.translations.set(languageCode, new Map());
    }

    this.translations.get(languageCode)!.set(key, value);
  }

  removeTranslation(languageCode: string, key: string): void {
    const langMap = this.translations.get(languageCode);
    if (langMap) {
      langMap.delete(key);
    }
  }

  getAllTranslations(languageCode: string): Record<string, string> {
    const langMap = this.translations.get(languageCode);
    if (!langMap) {
      return {};
    }

    const result: Record<string, string> = {};
    langMap.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }
}

