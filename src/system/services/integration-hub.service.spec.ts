import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpException } from '@nestjs/common';
import { IntegrationHubService } from './integration-hub.service';
import { Integration, IntegrationType, IntegrationStatus } from '../entities/integration.entity';
import { Webhook, WebhookEventType, WebhookStatus } from '../entities/webhook.entity';
import { EventEmitterService } from './event-emitter.service';

// Mock fetch globally
global.fetch = jest.fn();

describe('IntegrationHubService', () => {
  let service: IntegrationHubService;
  let integrationRepository: Repository<Integration>;
  let webhookRepository: Repository<Webhook>;
  let eventEmitterService: EventEmitterService;

  const mockIntegrationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockWebhookRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  };

  const mockEventEmitterService = {
    on: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IntegrationHubService,
        {
          provide: getRepositoryToken(Integration),
          useValue: mockIntegrationRepository,
        },
        {
          provide: getRepositoryToken(Webhook),
          useValue: mockWebhookRepository,
        },
        {
          provide: EventEmitterService,
          useValue: mockEventEmitterService,
        },
      ],
    }).compile();

    service = module.get<IntegrationHubService>(IntegrationHubService);
    integrationRepository = module.get<Repository<Integration>>(
      getRepositoryToken(Integration),
    );
    webhookRepository = module.get<Repository<Webhook>>(
      getRepositoryToken(Webhook),
    );
    eventEmitterService = module.get<EventEmitterService>(EventEmitterService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe('createIntegration', () => {
    it('should create a new integration', async () => {
      const integration = {
        id: '1',
        name: 'Test Integration',
        description: 'Test Description',
        type: IntegrationType.WEBHOOK,
        status: IntegrationStatus.INACTIVE,
        configuration: {},
      };

      mockIntegrationRepository.create.mockReturnValue(integration);
      mockIntegrationRepository.save.mockResolvedValue(integration);

      const result = await service.createIntegration(
        'Test Integration',
        'Test Description',
        IntegrationType.WEBHOOK,
        {},
      );

      expect(mockIntegrationRepository.create).toHaveBeenCalled();
      expect(result).toEqual(integration);
    });
  });

  describe('activateIntegration', () => {
    it('should activate an integration', async () => {
      const integration = {
        id: '1',
        status: IntegrationStatus.INACTIVE,
        isActive: false,
      };

      mockIntegrationRepository.findOne.mockResolvedValue(integration);
      mockIntegrationRepository.save.mockImplementation(async (int) => int);

      const result = await service.activateIntegration('1');

      expect(result.status).toBe(IntegrationStatus.ACTIVE);
      expect(result.isActive).toBe(true);
    });
  });

  describe('createWebhook', () => {
    it('should create a new webhook', async () => {
      const webhook = {
        id: '1',
        url: 'https://example.com/webhook',
        eventType: WebhookEventType.ITEM_CREATED,
        status: WebhookStatus.PENDING,
      };

      mockWebhookRepository.create.mockReturnValue(webhook);
      mockWebhookRepository.save.mockResolvedValue(webhook);

      const result = await service.createWebhook(
        'https://example.com/webhook',
        WebhookEventType.ITEM_CREATED,
      );

      expect(mockWebhookRepository.create).toHaveBeenCalled();
      expect(result).toEqual(webhook);
    });
  });

  describe('listIntegrations', () => {
    it('should list all integrations', async () => {
      const integrations = [
        {
          id: '1',
          name: 'Integration 1',
          type: IntegrationType.WEBHOOK,
        },
      ];

      mockIntegrationRepository.find.mockResolvedValue(integrations);

      const result = await service.listIntegrations();

      expect(mockIntegrationRepository.find).toHaveBeenCalled();
      expect(result).toEqual(integrations);
    });
  });

  describe('sendWebhook', () => {
    it('should send webhook successfully', async () => {
      const webhook = {
        id: '1',
        url: 'https://example.com/webhook',
        eventType: WebhookEventType.ITEM_CREATED,
        status: WebhookStatus.PENDING,
        retryCount: 0,
        maxRetries: 3,
      };

      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ success: true }),
      };

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);
      mockWebhookRepository.save.mockImplementation(async (wh) => wh);

      await (service as any).sendWebhook(webhook, { test: 'data' });

      expect(global.fetch).toHaveBeenCalled();
      expect(webhook.status).toBe(WebhookStatus.SENT);
    });

    it('should handle webhook failure and retry', async () => {
      const webhook = {
        id: '1',
        url: 'https://example.com/webhook',
        eventType: WebhookEventType.ITEM_CREATED,
        status: WebhookStatus.PENDING,
        retryCount: 0,
        maxRetries: 3,
      };

      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));
      mockWebhookRepository.save.mockImplementation(async (wh) => wh);

      await (service as any).sendWebhook(webhook, { test: 'data' });

      expect(webhook.retryCount).toBe(1);
      expect(webhook.status).toBe(WebhookStatus.RETRYING);
    });
  });
});

