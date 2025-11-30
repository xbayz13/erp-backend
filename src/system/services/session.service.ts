import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { UserSession } from '../entities/user-session.entity';

@Injectable()
export class SessionService {
  constructor(
    @InjectRepository(UserSession)
    private readonly sessionRepository: Repository<UserSession>,
  ) {}

  async create(
    userId: string,
    token: string,
    expiresAt: Date,
    deviceInfo?: string,
    ipAddress?: string,
  ): Promise<UserSession> {
    const session = this.sessionRepository.create({
      userId,
      token,
      expiresAt,
      deviceInfo,
      ipAddress,
      lastActivityAt: new Date(),
    });

    return this.sessionRepository.save(session);
  }

  async updateActivity(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId },
      { lastActivityAt: new Date() },
    );
  }

  async revoke(sessionId: string): Promise<void> {
    await this.sessionRepository.update(
      { id: sessionId },
      { isActive: false },
    );
  }

  async revokeAll(userId: string): Promise<void> {
    await this.sessionRepository.update(
      { userId },
      { isActive: false },
    );
  }

  async list(userId: string): Promise<UserSession[]> {
    return this.sessionRepository.find({
      where: { userId, isActive: true },
      order: { lastActivityAt: 'DESC' },
    });
  }

  async cleanupExpired(): Promise<number> {
    const result = await this.sessionRepository.delete({
      expiresAt: LessThanOrEqual(new Date()),
    });
    return result.affected || 0;
  }
}

