import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Workflow } from '../entities/workflow.entity';
import {
  WorkflowInstance,
  WorkflowStatus,
  WorkflowStep,
} from '../entities/workflow-instance.entity';

export interface WorkflowDefinition {
  name: string;
  entityType: string;
  steps: Array<{
    stepNumber: number;
    approverRole: string;
    required: boolean;
  }>;
}

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepository: Repository<Workflow>,
    @InjectRepository(WorkflowInstance)
    private readonly workflowInstanceRepository: Repository<WorkflowInstance>,
    private readonly auditLogService: AuditLogService,
  ) {}

  async createWorkflow(
    name: string,
    entityType: string,
    steps: Array<{ stepNumber: number; approverRole: string; required: boolean }>,
    actorId: string,
  ): Promise<Workflow> {
    const workflow = this.workflowRepository.create({
      name,
      entityType,
      steps,
    });

    const created = await this.workflowRepository.save(workflow);

    await this.auditLogService.record({
      actorId,
      action: 'WORKFLOW_CREATE',
      entity: 'Workflow',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async initiateWorkflow(
    workflowId: string,
    entityType: string,
    entityId: string,
    actorId: string,
  ): Promise<WorkflowInstance> {
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId },
    });
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const steps: WorkflowStep[] = workflow.steps.map((step) => ({
      stepNumber: step.stepNumber,
      approverRole: step.approverRole,
      status: WorkflowStatus.PENDING,
    }));

    const instance = this.workflowInstanceRepository.create({
      workflowId,
      entityType,
      entityId,
      status: WorkflowStatus.PENDING,
      steps,
      currentStep: 1,
      initiatedBy: actorId,
    });

    return this.workflowInstanceRepository.save(instance);
  }

  async approveStep(
    instanceId: string,
    stepNumber: number,
    approverId: string,
    comments?: string,
  ): Promise<WorkflowInstance> {
    const instance = await this.workflowInstanceRepository.findOne({
      where: { id: instanceId },
    });
    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    const step = instance.steps.find((s) => s.stepNumber === stepNumber);
    if (!step) {
      throw new Error(`Step ${stepNumber} not found`);
    }

    step.status = WorkflowStatus.APPROVED;
    step.approverId = approverId;
    step.action = 'APPROVE';
    step.comments = comments;
    step.actionDate = new Date();

    // Move to next step or complete
    const nextStep = instance.steps.find(
      (s) => s.stepNumber === stepNumber + 1,
    );
    if (nextStep) {
      instance.currentStep = stepNumber + 1;
    } else {
      instance.status = WorkflowStatus.APPROVED;
    }

    return this.workflowInstanceRepository.save(instance);
  }

  async rejectStep(
    instanceId: string,
    stepNumber: number,
    approverId: string,
    comments?: string,
  ): Promise<WorkflowInstance> {
    const instance = await this.workflowInstanceRepository.findOne({
      where: { id: instanceId },
    });
    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    const step = instance.steps.find((s) => s.stepNumber === stepNumber);
    if (!step) {
      throw new Error(`Step ${stepNumber} not found`);
    }

    step.status = WorkflowStatus.REJECTED;
    step.approverId = approverId;
    step.action = 'REJECT';
    step.comments = comments;
    step.actionDate = new Date();

    instance.status = WorkflowStatus.REJECTED;

    return this.workflowInstanceRepository.save(instance);
  }

  async getWorkflowInstance(
    entityType: string,
    entityId: string,
  ): Promise<WorkflowInstance | null> {
    return this.workflowInstanceRepository.findOne({
      where: { entityType, entityId },
      order: { createdAt: 'DESC' },
    });
  }

  async listWorkflows(entityType?: string): Promise<Workflow[]> {
    const where: any = { isActive: true };
    if (entityType) where.entityType = entityType;

    return this.workflowRepository.find({
      where,
      order: { name: 'ASC' },
    });
  }
}
