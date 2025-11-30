import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionService } from './session.service';
import { UserSession } from '../entities/user-session.entity';

describe('SessionService', () => {
  let service: SessionService;
  let sessionRepository: Repository<UserSession>;

  const mockSessionRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionService,
        {
          provide: getRepositoryToken(UserSession),
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    service = module.get<SessionService>(SessionService);
    sessionRepository = module.get<Repository<UserSession>>(
      getRepositoryToken(UserSession),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new session', async () => {
      const session = {
        id: '1',
        userId: 'user1',
        token: 'token123',
        expiresAt: new Date(Date.now() + 3600000),
        isActive: true,
      };

      mockSessionRepository.create.mockReturnValue(session);
      mockSessionRepository.save.mockResolvedValue(session);

      const result = await service.create(
        'user1',
        'token123',
        new Date(Date.now() + 3600000),
        'Chrome',
        '192.168.1.1',
      );

      expect(mockSessionRepository.create).toHaveBeenCalled();
      expect(mockSessionRepository.save).toHaveBeenCalled();
      expect(result).toEqual(session);
    });
  });

  describe('updateActivity', () => {
    it('should update last activity timestamp', async () => {
      mockSessionRepository.update.mockResolvedValue({ affected: 1 });

      await service.updateActivity('session1');

      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { id: 'session1' },
        { lastActivityAt: expect.any(Date) },
      );
    });
  });

  describe('revoke', () => {
    it('should revoke a session', async () => {
      mockSessionRepository.update.mockResolvedValue({ affected: 1 });

      await service.revoke('session1');

      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { id: 'session1' },
        { isActive: false },
      );
    });
  });

  describe('revokeAll', () => {
    it('should revoke all sessions for a user', async () => {
      mockSessionRepository.update.mockResolvedValue({ affected: 3 });

      await service.revokeAll('user1');

      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        { userId: 'user1' },
        { isActive: false },
      );
    });
  });

  describe('list', () => {
    it('should return list of active sessions', async () => {
      const sessions = [
        { id: '1', userId: 'user1', isActive: true },
        { id: '2', userId: 'user1', isActive: true },
      ];

      mockSessionRepository.find.mockResolvedValue(sessions);

      const result = await service.list('user1');

      expect(mockSessionRepository.find).toHaveBeenCalledWith({
        where: { userId: 'user1', isActive: true },
        order: { lastActivityAt: 'DESC' },
      });
      expect(result).toEqual(sessions);
    });
  });

  describe('cleanupExpired', () => {
    it('should delete expired sessions', async () => {
      mockSessionRepository.delete.mockResolvedValue({ affected: 5 });

      const result = await service.cleanupExpired();

      expect(mockSessionRepository.delete).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });
});
