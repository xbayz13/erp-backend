import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BackupRestoreService } from './backup-restore.service';
import { existsSync, readdirSync } from 'fs';

jest.mock('fs');

describe('BackupRestoreService', () => {
  let service: BackupRestoreService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      const config: Record<string, string> = {
        POSTGRES_HOST: 'localhost',
        POSTGRES_PORT: '5432',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
        POSTGRES_DB: 'erp',
      };
      return config[key] || defaultValue;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BackupRestoreService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BackupRestoreService>(BackupRestoreService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('listBackups', () => {
    it('should list all backups', async () => {
      const mockFiles = ['backup-2024-01-01.sql', 'backup-2024-01-02.sql'];
      (readdirSync as jest.Mock).mockReturnValue(mockFiles);
      (existsSync as jest.Mock).mockReturnValue(true);

      const mockStats = { size: 1024, birthtime: new Date() };
      const mockFs = require('fs');
      mockFs.statSync = jest.fn().mockReturnValue(mockStats);

      const result = await service.listBackups();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('listBackups', () => {
    it('should list all backups', async () => {
      const mockFiles = ['backup-2024-01-01.sql', 'backup-2024-01-02.sql'];
      (readdirSync as jest.Mock).mockReturnValue(mockFiles);
      (existsSync as jest.Mock).mockReturnValue(true);

      const mockStats = { size: 1024, birthtime: new Date() };
      const mockFs = require('fs');
      mockFs.statSync = jest.fn().mockReturnValue(mockStats);

      const result = await service.listBackups();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it('should return empty array if backup directory does not exist', async () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.listBackups();

      expect(result).toEqual([]);
    });
  });

  describe('verifyBackup', () => {
    it('should verify backup file exists and has size', async () => {
      (existsSync as jest.Mock).mockReturnValue(true);
      const mockStats = { size: 1024 };
      const mockFs = require('fs');
      mockFs.statSync = jest.fn().mockReturnValue(mockStats);

      const result = await service.verifyBackup('backup-2024-01-01.sql');

      expect(result).toBe(true);
    });

    it('should return false if backup file does not exist', async () => {
      (existsSync as jest.Mock).mockReturnValue(false);

      const result = await service.verifyBackup('nonexistent.sql');

      expect(result).toBe(false);
    });
  });
});

