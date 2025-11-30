import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemEventLog } from '../entities/system-event.entity';

export interface SystemEvent {
  eventType: string;
  entityType: string;
  entityId: string;
  payload: Record<string, any>;
  timestamp: Date;
  userId?: string;
}

@Injectable()
export class EventEmitterService {
  private eventListeners: Map<string, Array<(event: SystemEvent) => void>> =
    new Map();

  constructor(
    @InjectRepository(SystemEventLog)
    private readonly eventLogRepository: Repository<SystemEventLog>,
  ) {}

  async emit(event: SystemEvent): Promise<void> {
    // Store event in database
    const eventLog = this.eventLogRepository.create({
      eventType: event.eventType,
      entityType: event.entityType,
      entityId: event.entityId,
      payload: event.payload,
      userId: event.userId,
    });
    await this.eventLogRepository.save(eventLog);

    // Emit to listeners
    const listeners = this.eventListeners.get(event.eventType) || [];
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${event.eventType}:`, error);
      }
    });
  }

  on(eventType: string, listener: (event: SystemEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  off(eventType: string, listener: (event: SystemEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  async getEventHistory(
    eventType?: string,
    entityType?: string,
    entityId?: string,
    limit: number = 100,
  ): Promise<SystemEventLog[]> {
    const where: any = {};
    if (eventType) where.eventType = eventType;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    return this.eventLogRepository.find({
      where,
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
