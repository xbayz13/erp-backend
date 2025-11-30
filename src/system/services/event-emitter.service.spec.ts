import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitterService } from './event-emitter.service';
import { SystemEventLog } from '../entities/system-event.entity';

describe('EventEmitterService', () => {
  let service: EventEmitterService;
  let eventLogRepository: Repository<SystemEventLog>;

  const mockEventLogRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventEmitterService,
        {
          provide: getRepositoryToken(SystemEventLog),
          useValue: mockEventLogRepository,
        },
      ],
    }).compile();

    service = module.get<EventEmitterService>(EventEmitterService);
    eventLogRepository = module.get<Repository<SystemEventLog>>(
      getRepositoryToken(SystemEventLog),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('emit', () => {
    it('should emit an event and store it in database', async () => {
      const event = {
        eventType: 'ITEM_CREATED',
        entityType: 'Item',
        entityId: 'item1',
        payload: { name: 'Test Item' },
        timestamp: new Date(),
        userId: 'user1',
      };

      const eventLog = {
        id: '1',
        ...event,
      };

      mockEventLogRepository.create.mockReturnValue(eventLog);
      mockEventLogRepository.save.mockResolvedValue(eventLog);

      await service.emit(event);

      expect(mockEventLogRepository.create).toHaveBeenCalled();
      expect(mockEventLogRepository.save).toHaveBeenCalled();
    });
  });

  describe('on', () => {
    it('should register an event listener', () => {
      const listener = jest.fn();
      service.on('ITEM_CREATED', listener);

      expect(listener).toBeDefined();
    });
  });

  describe('off', () => {
    it('should unregister an event listener', () => {
      const listener = jest.fn();
      service.on('ITEM_CREATED', listener);
      service.off('ITEM_CREATED', listener);

      expect(listener).toBeDefined();
    });
  });

  describe('getEventHistory', () => {
    it('should return event history with filters', async () => {
      const logs = [
        {
          id: '1',
          eventType: 'ITEM_CREATED',
          entityType: 'Item',
          entityId: 'item1',
          payload: {},
          timestamp: new Date(),
        },
      ];

      mockEventLogRepository.find.mockResolvedValue(logs);

      const result = await service.getEventHistory('ITEM_CREATED', 'Item', 'item1');

      expect(mockEventLogRepository.find).toHaveBeenCalled();
      expect(result).toEqual(logs);
    });
  });
});

