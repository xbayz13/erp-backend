import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { I18nService } from './i18n.service';

describe('I18nService', () => {
  let service: I18nService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        I18nService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<I18nService>(I18nService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('translate', () => {
    it('should translate a key to default language', () => {
      const result = service.translate('common.save');
      expect(result).toBe('Save');
    });

    it('should translate a key to Indonesian', () => {
      const result = service.translate('common.save', 'id');
      expect(result).toBe('Simpan');
    });

    it('should return key if translation not found', () => {
      const result = service.translate('unknown.key');
      expect(result).toBe('unknown.key');
    });

    it('should replace parameters in translation', () => {
      service.addTranslation('en', 'greeting', 'Hello {{name}}');
      const result = service.translate('greeting', 'en', { name: 'John' });
      expect(result).toBe('Hello John');
    });
  });

  describe('getAvailableLanguages', () => {
    it('should return available languages', () => {
      const languages = service.getAvailableLanguages();
      expect(Array.isArray(languages)).toBe(true);
      expect(languages.length).toBeGreaterThan(0);
      expect(languages[0]).toHaveProperty('code');
      expect(languages[0]).toHaveProperty('name');
    });
  });

  describe('addTranslation', () => {
    it('should add a new translation', () => {
      service.addTranslation('en', 'test.key', 'Test Value');
      const result = service.translate('test.key', 'en');
      expect(result).toBe('Test Value');
    });
  });

  describe('getAllTranslations', () => {
    it('should return all translations for a language', () => {
      const translations = service.getAllTranslations('en');
      expect(typeof translations).toBe('object');
      expect(translations['common.save']).toBe('Save');
    });

    it('should return empty object for unknown language', () => {
      const translations = service.getAllTranslations('xx');
      expect(translations).toEqual({});
    });
  });
});

