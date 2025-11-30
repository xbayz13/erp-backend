import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Integration, IntegrationStatus, IntegrationType } from '../entities/integration.entity';
import { Webhook, WebhookEventType, WebhookStatus } from '../entities/webhook.entity';
import { EventEmitterService } from './event-emitter.service';
import * as crypto from 'crypto';

@Injectable()
export class IntegrationHubService {
  constructor(
    @InjectRepository(Integration)
    private readonly integrationRepository: Repository<Integration>,
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    private readonly eventEmitterService: EventEmitterService,
  ) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    this.eventEmitterService.on('ITEM_CREATED', (event) => {
      this.triggerWebhooks(WebhookEventType.ITEM_CREATED, event.payload);
    });

    this.eventEmitterService.on('ORDER_CREATED', (event) => {
      this.triggerWebhooks(WebhookEventType.ORDER_CREATED, event.payload);
    });
  }

  async createIntegration(
    name: string,
    description: string,
    type: IntegrationType,
    configuration: Record<string, any>,
    endpoint?: string,
    apiKey?: string,
  ): Promise<Integration> {
    const integration = this.integrationRepository.create({
      name,
      description,
      type,
      configuration,
      endpoint,
      apiKey,
      status: IntegrationStatus.INACTIVE,
    });

    return this.integrationRepository.save(integration);
  }

  async updateIntegration(
    id: string,
    updates: Partial<Integration>,
  ): Promise<Integration> {
    const integration = await this.integrationRepository.findOne({
      where: { id },
    });
    if (!integration) {
      throw new HttpException('Integration not found', HttpStatus.NOT_FOUND);
    }

    Object.assign(integration, updates);
    return this.integrationRepository.save(integration);
  }

  async activateIntegration(id: string): Promise<Integration> {
    return this.updateIntegration(id, {
      status: IntegrationStatus.ACTIVE,
      isActive: true,
    });
  }

  async deactivateIntegration(id: string): Promise<Integration> {
    return this.updateIntegration(id, {
      status: IntegrationStatus.INACTIVE,
      isActive: false,
    });
  }

  async listIntegrations(): Promise<Integration[]> {
    return this.integrationRepository.find({
      order: { name: 'ASC' },
    });
  }

  async getIntegration(id: string): Promise<Integration | null> {
    return this.integrationRepository.findOne({
      where: { id },
    });
  }

  async createWebhook(
    url: string,
    eventType: WebhookEventType,
    secret?: string,
  ): Promise<Webhook> {
    const webhook = this.webhookRepository.create({
      url,
      eventType,
      secret,
      status: WebhookStatus.PENDING,
      payload: {},
    });

    return this.webhookRepository.save(webhook);
  }

  async triggerWebhooks(
    eventType: WebhookEventType,
    payload: Record<string, any>,
  ): Promise<void> {
    const webhooks = await this.webhookRepository.find({
      where: { eventType, status: WebhookStatus.PENDING },
    });

    for (const webhook of webhooks) {
      await this.sendWebhook(webhook, payload);
    }
  }

  private async sendWebhook(
    webhook: Webhook,
    payload: Record<string, any>,
  ): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Add signature if secret exists
      if (webhook.secret) {
        const signature = crypto
          .createHmac('sha256', webhook.secret)
          .update(JSON.stringify(payload))
          .digest('hex');
        headers['X-Webhook-Signature'] = signature;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      const responseData = await response.json().catch(() => ({}));

      webhook.status = WebhookStatus.SENT;
      webhook.responseCode = response.status;
      webhook.responseBody = responseData;
      webhook.sentAt = new Date();
      webhook.errorMessage = undefined;
    } catch (error: any) {
      webhook.retryCount += 1;
      webhook.errorMessage = error.message;
      webhook.responseCode = error.response?.status;

      if (webhook.retryCount >= webhook.maxRetries) {
        webhook.status = WebhookStatus.FAILED;
      } else {
        webhook.status = WebhookStatus.RETRYING;
      }
    }

    await this.webhookRepository.save(webhook);
  }

  async listWebhooks(eventType?: WebhookEventType): Promise<Webhook[]> {
    const where: any = {};
    if (eventType) where.eventType = eventType;

    return this.webhookRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.webhookRepository.delete(id);
  }

  async testIntegration(id: string, testPayload: Record<string, any>): Promise<{
    success: boolean;
    statusCode?: number;
    response?: any;
    error?: string;
  }> {
    const integration = await this.getIntegration(id);
    if (!integration || !integration.isActive) {
      throw new HttpException('Integration not found or inactive', HttpStatus.BAD_REQUEST);
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...integration.headers,
      };

      if (integration.apiKey) {
        headers['Authorization'] = `Bearer ${integration.apiKey}`;
      }

      const response = await fetch(integration.endpoint!, {
        method: 'POST',
        headers,
        body: JSON.stringify(testPayload),
      });

      const responseData = await response.json().catch(() => ({}));

      return {
        success: response.ok,
        statusCode: response.status,
        response: responseData,
      };
    } catch (error: any) {
      return {
        success: false,
        statusCode: undefined,
        error: error.message,
      };
    }
  }
}

