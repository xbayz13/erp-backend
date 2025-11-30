import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { EncryptionService } from './encryption.service';

describe('EncryptionService', () => {
  let service: EncryptionService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key === 'ENCRYPTION_SECRET') {
        return 'test-encryption-key';
      }
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EncryptionService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EncryptionService>(EncryptionService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('encrypt', () => {
    it('should encrypt a string', async () => {
      const text = 'sensitive data';
      const encrypted = await service.encrypt(text);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
      expect(encrypted).not.toBe(text);
    });
  });

  describe('decrypt', () => {
    it('should decrypt an encrypted string', async () => {
      const originalText = 'sensitive data';
      const encrypted = await service.encrypt(originalText);
      const decrypted = await service.decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it('should throw error for invalid encrypted text format', async () => {
      await expect(service.decrypt('invalid-format')).rejects.toThrow();
    });
  });

  describe('encryptObject', () => {
    it('should encrypt an object', async () => {
      const obj = { name: 'John', age: 30 };
      const encrypted = await service.encryptObject(obj);

      expect(encrypted).toBeDefined();
      expect(encrypted).toContain(':');
    });
  });

  describe('decryptObject', () => {
    it('should decrypt an encrypted object', async () => {
      const originalObj = { name: 'John', age: 30 };
      const encrypted = await service.encryptObject(originalObj);
      const decrypted = await service.decryptObject<typeof originalObj>(encrypted);

      expect(decrypted).toEqual(originalObj);
    });
  });
});

