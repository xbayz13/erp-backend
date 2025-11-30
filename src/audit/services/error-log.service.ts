import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorLog } from '../entities/error-log.entity';

export interface RecordErrorLogInput {
  context: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
}

@Injectable()
export class ErrorLogService {
  constructor(
    @InjectRepository(ErrorLog)
    private readonly repository: Repository<ErrorLog>,
  ) {}

  async record(input: RecordErrorLogInput): Promise<ErrorLog> {
    const log = this.repository.create({
      context: input.context,
      message: input.message,
      stack: input.stack,
      metadata: input.metadata,
    });
    return this.repository.save(log);
  }

  async list(): Promise<ErrorLog[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }
}


