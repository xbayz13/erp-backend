import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Routing, Operation } from '../entities/routing.entity';
import { WorkCenterService } from './work-center.service';

@Injectable()
export class RoutingService {
  constructor(
    @InjectRepository(Routing)
    private readonly routingRepository: Repository<Routing>,
    private readonly workCenterService: WorkCenterService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    code: string,
    productItemId: string,
    operations: Array<{
      operationNumber: number;
      workCenterId: string;
      operationName: string;
      setupTime: number;
      runTime: number;
      queueTime?: number;
      moveTime?: number;
    }>,
    actorId: string,
  ): Promise<Routing> {
    const operationsWithDetails: Operation[] = await Promise.all(
      operations.map(async (op) => {
        const workCenters = await this.workCenterService.list();
        const workCenter = workCenters.find((wc) => wc.id === op.workCenterId);
        if (!workCenter) {
          throw new Error(`Work center ${op.workCenterId} not found`);
        }

        return {
          operationNumber: op.operationNumber,
          workCenterId: op.workCenterId,
          workCenterName: workCenter.name,
          operationName: op.operationName,
          setupTime: op.setupTime,
          runTime: op.runTime,
          queueTime: op.queueTime || 0,
          moveTime: op.moveTime || 0,
        };
      }),
    );

    const totalTime = operationsWithDetails.reduce(
      (sum, op) => sum + op.setupTime + op.runTime + op.queueTime + op.moveTime,
      0,
    );

    let totalCost = 0;
    const workCenters = await this.workCenterService.list();
    for (const op of operationsWithDetails) {
      const workCenter = workCenters.find((wc) => wc.id === op.workCenterId);
      const hourlyRate = workCenter?.hourlyRate || 0;
      const totalMinutes = op.setupTime + op.runTime;
      totalCost += (totalMinutes / 60) * hourlyRate;
    }

    const routing = this.routingRepository.create({
      code,
      productItemId,
      operations: operationsWithDetails,
      totalTime,
      totalCost,
    });

    const created = await this.routingRepository.save(routing);

    await this.auditLogService.record({
      actorId,
      action: 'PRODUCTION_CREATE_ROUTING',
      entity: 'Routing',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async list(productItemId?: string): Promise<Routing[]> {
    const where: any = { isActive: true };
    if (productItemId) where.productItemId = productItemId;

    return this.routingRepository.find({
      where,
      order: { code: 'ASC' },
    });
  }

  async calculateProductionTime(routingId: string, quantity: number): Promise<number> {
    const routing = await this.routingRepository.findOne({
      where: { id: routingId },
    });
    if (!routing) {
      throw new Error(`Routing ${routingId} not found`);
    }

    return routing.operations.reduce(
      (sum, op) => sum + op.setupTime + op.runTime * quantity + op.queueTime + op.moveTime,
      0,
    );
  }
}

