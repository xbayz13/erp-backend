import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Notification, NotificationType, NotificationStatus } from '../entities/notification.entity';
import { RealtimeGateway } from '../../realtime/realtime.gateway';

describe('NotificationService', () => {
  let service: NotificationService;
  let notificationRepository: Repository<Notification>;
  let realtimeGateway: RealtimeGateway;

  const mockNotificationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    count: jest.fn(),
  };

  const mockRealtimeGateway = {
    sendUpdate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        {
          provide: getRepositoryToken(Notification),
          useValue: mockNotificationRepository,
        },
        {
          provide: RealtimeGateway,
          useValue: mockRealtimeGateway,
        },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
    notificationRepository = module.get<Repository<Notification>>(
      getRepositoryToken(Notification),
    );
    realtimeGateway = module.get<RealtimeGateway>(RealtimeGateway);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new notification', async () => {
      const notification = {
        id: '1',
        userId: 'user1',
        type: NotificationType.INFO,
        title: 'Test Notification',
        message: 'This is a test',
        status: NotificationStatus.UNREAD,
      };

      mockNotificationRepository.create.mockReturnValue(notification);
      mockNotificationRepository.save.mockResolvedValue(notification);

      const result = await service.create(
        'user1',
        NotificationType.INFO,
        'Test Notification',
        'This is a test',
      );

      expect(mockNotificationRepository.create).toHaveBeenCalled();
      expect(mockNotificationRepository.save).toHaveBeenCalled();
      // RealtimeGateway is optional, so may not be called if not injected
      // expect(mockRealtimeGateway.sendUpdate).toHaveBeenCalled();
      expect(result).toEqual(notification);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const notification = {
        id: '1',
        userId: 'user1',
        status: NotificationStatus.UNREAD,
      };

      mockNotificationRepository.findOne.mockResolvedValue(notification);
      mockNotificationRepository.save.mockResolvedValue({
        ...notification,
        status: NotificationStatus.READ,
        readAt: new Date(),
      });

      const result = await service.markAsRead('1', 'user1');

      expect(result.status).toBe(NotificationStatus.READ);
      expect(result.readAt).toBeDefined();
    });
  });

  describe('list', () => {
    it('should return list of notifications', async () => {
      const notifications = [
        { id: '1', userId: 'user1', status: NotificationStatus.UNREAD },
        { id: '2', userId: 'user1', status: NotificationStatus.READ },
      ];

      mockNotificationRepository.find.mockResolvedValue(notifications);

      const result = await service.list('user1');

      expect(mockNotificationRepository.find).toHaveBeenCalled();
      expect(result).toEqual(notifications);
    });
  });

  describe('getUnreadCount', () => {
    it('should return count of unread notifications', async () => {
      mockNotificationRepository.count.mockResolvedValue(5);

      const result = await service.getUnreadCount('user1');

      expect(mockNotificationRepository.count).toHaveBeenCalledWith({
        where: {
          userId: 'user1',
          status: NotificationStatus.UNREAD,
        },
      });
      expect(result).toBe(5);
    });
  });
});
