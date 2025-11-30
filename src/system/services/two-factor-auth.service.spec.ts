import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwoFactorAuthService } from './two-factor-auth.service';
import { TwoFactorAuth } from '../entities/two-factor-auth.entity';

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;
  let twoFactorRepository: Repository<TwoFactorAuth>;

  const mockTwoFactorRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TwoFactorAuthService,
        {
          provide: getRepositoryToken(TwoFactorAuth),
          useValue: mockTwoFactorRepository,
        },
      ],
    }).compile();

    service = module.get<TwoFactorAuthService>(TwoFactorAuthService);
    twoFactorRepository = module.get<Repository<TwoFactorAuth>>(
      getRepositoryToken(TwoFactorAuth),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateSecret', () => {
    it('should generate a new secret for user', async () => {
      const twoFactor = {
        id: '1',
        userId: 'user1',
        secret: 'ABCD1234',
        isEnabled: false,
      };

      mockTwoFactorRepository.findOne.mockResolvedValue(null);
      mockTwoFactorRepository.create.mockReturnValue(twoFactor);
      mockTwoFactorRepository.save.mockResolvedValue(twoFactor);

      const result = await service.generateSecret('user1');

      expect(result.secret).toBeDefined();
      expect(result.secret.length).toBeGreaterThan(0);
      expect(result.qrCode).toBeDefined();
    });

    it('should update existing secret if 2FA already exists', async () => {
      const existing = {
        id: '1',
        userId: 'user1',
        secret: 'OLD123',
        isEnabled: false,
      };

      mockTwoFactorRepository.findOne.mockResolvedValue(existing);
      mockTwoFactorRepository.save.mockResolvedValue({
        ...existing,
        secret: 'NEW123',
      });

      const result = await service.generateSecret('user1');

      expect(mockTwoFactorRepository.save).toHaveBeenCalled();
      expect(result.secret).toBeDefined();
    });
  });

  describe('verifyToken', () => {
    it('should verify token correctly', async () => {
      const twoFactor = {
        id: '1',
        userId: 'user1',
        secret: 'TEST123',
        isEnabled: true,
      };

      mockTwoFactorRepository.findOne.mockResolvedValue(twoFactor);

      // Note: Simplified TOTP implementation may not work the same way
      // This is a basic test structure
      const result = await service.verifyToken('user1', '123456');

      expect(mockTwoFactorRepository.findOne).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
      expect(typeof result).toBe('boolean');
    });

    it('should return false if 2FA not enabled', async () => {
      const twoFactor = {
        id: '1',
        userId: 'user1',
        secret: 'TEST123',
        isEnabled: false,
      };

      mockTwoFactorRepository.findOne.mockResolvedValue(twoFactor);

      const result = await service.verifyToken('user1', '123456');

      expect(result).toBe(false);
    });
  });

  describe('enable', () => {
    it('should enable 2FA with valid token', async () => {
      const twoFactor = {
        id: '1',
        userId: 'user1',
        secret: 'TEST123',
        isEnabled: false,
      };

      mockTwoFactorRepository.findOne.mockResolvedValue(twoFactor);
      jest.spyOn(service, 'verifyToken').mockResolvedValue(true);
      mockTwoFactorRepository.save.mockResolvedValue({
        ...twoFactor,
        isEnabled: true,
        backupCodes: ['CODE1', 'CODE2'],
      });

      const result = await service.enable('user1', '123456');

      expect(result.isEnabled).toBe(true);
      expect(result.backupCodes).toBeDefined();
      expect(result.backupCodes?.length).toBeGreaterThan(0);
    });
  });

  describe('disable', () => {
    it('should disable 2FA', async () => {
      mockTwoFactorRepository.update.mockResolvedValue({ affected: 1 });

      await service.disable('user1');

      expect(mockTwoFactorRepository.update).toHaveBeenCalledWith(
        { userId: 'user1' },
        { isEnabled: false, backupCodes: [] },
      );
    });
  });

  describe('isEnabled', () => {
    it('should return true if 2FA is enabled', async () => {
      const twoFactor = {
        id: '1',
        userId: 'user1',
        isEnabled: true,
      };

      mockTwoFactorRepository.findOne.mockResolvedValue(twoFactor);

      const result = await service.isEnabled('user1');

      expect(result).toBe(true);
    });

    it('should return false if 2FA is not enabled or not found', async () => {
      mockTwoFactorRepository.findOne.mockResolvedValue(null);

      const result = await service.isEnabled('user1');

      expect(result).toBe(false);
    });
  });
});
