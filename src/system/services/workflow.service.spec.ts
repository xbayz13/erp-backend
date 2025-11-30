import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowService } from './workflow.service';
import { Workflow } from '../entities/workflow.entity';
import {
  WorkflowInstance,
  WorkflowStatus,
} from '../entities/workflow-instance.entity';
import { AuditLogService } from '../../audit/services/audit-log.service';

describe('WorkflowService', () => {
  let service: WorkflowService;
  let workflowRepository: Repository<Workflow>;
  let workflowInstanceRepository: Repository<WorkflowInstance>;
  let auditLogService: AuditLogService;

  const mockWorkflowRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockWorkflowInstanceRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAuditLogService = {
    record: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkflowService,
        {
          provide: getRepositoryToken(Workflow),
          useValue: mockWorkflowRepository,
        },
        {
          provide: getRepositoryToken(WorkflowInstance),
          useValue: mockWorkflowInstanceRepository,
        },
        {
          provide: AuditLogService,
          useValue: mockAuditLogService,
        },
      ],
    }).compile();

    service = module.get<WorkflowService>(WorkflowService);
    workflowRepository = module.get<Repository<Workflow>>(
      getRepositoryToken(Workflow),
    );
    workflowInstanceRepository = module.get<Repository<WorkflowInstance>>(
      getRepositoryToken(WorkflowInstance),
    );
    auditLogService = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createWorkflow', () => {
    it('should create a new workflow', async () => {
      const workflow = {
        id: '1',
        name: 'Purchase Approval',
        entityType: 'PurchaseOrder',
        steps: [
          { stepNumber: 1, approverRole: 'MANAGER', required: true },
          { stepNumber: 2, approverRole: 'ADMIN', required: false },
        ],
        isActive: true,
      };

      mockWorkflowRepository.create.mockReturnValue(workflow);
      mockWorkflowRepository.save.mockResolvedValue(workflow);

      const result = await service.createWorkflow(
        'Purchase Approval',
        'PurchaseOrder',
        workflow.steps,
        'user1',
      );

      expect(mockWorkflowRepository.create).toHaveBeenCalled();
      expect(mockWorkflowRepository.save).toHaveBeenCalled();
      expect(mockAuditLogService.record).toHaveBeenCalled();
      expect(result).toEqual(workflow);
    });
  });

  describe('initiateWorkflow', () => {
    it('should initiate a workflow instance', async () => {
      const workflow = {
        id: '1',
        name: 'Purchase Approval',
        entityType: 'PurchaseOrder',
        steps: [
          { stepNumber: 1, approverRole: 'MANAGER', required: true },
        ],
      };

      const instance = {
        id: 'inst1',
        workflowId: '1',
        entityType: 'PurchaseOrder',
        entityId: 'po1',
        status: WorkflowStatus.PENDING,
        steps: [
          {
            stepNumber: 1,
            approverRole: 'MANAGER',
            status: WorkflowStatus.PENDING,
          },
        ],
        currentStep: 1,
        initiatedBy: 'user1',
      };

      mockWorkflowRepository.findOne.mockResolvedValue(workflow);
      mockWorkflowInstanceRepository.create.mockReturnValue(instance);
      mockWorkflowInstanceRepository.save.mockResolvedValue(instance);

      const result = await service.initiateWorkflow(
        '1',
        'PurchaseOrder',
        'po1',
        'user1',
      );

      expect(mockWorkflowRepository.findOne).toHaveBeenCalled();
      expect(mockWorkflowInstanceRepository.create).toHaveBeenCalled();
      expect(result).toEqual(instance);
    });

    it('should throw error if workflow not found', async () => {
      mockWorkflowRepository.findOne.mockResolvedValue(null);

      await expect(
        service.initiateWorkflow('1', 'PurchaseOrder', 'po1', 'user1'),
      ).rejects.toThrow();
    });
  });

  describe('approveStep', () => {
    it('should approve a workflow step and move to next', async () => {
      const instance = {
        id: 'inst1',
        workflowId: '1',
        entityType: 'PurchaseOrder',
        entityId: 'po1',
        status: WorkflowStatus.PENDING,
        steps: [
          {
            stepNumber: 1,
            approverRole: 'MANAGER',
            status: WorkflowStatus.PENDING,
          },
          {
            stepNumber: 2,
            approverRole: 'ADMIN',
            status: WorkflowStatus.PENDING,
          },
        ],
        currentStep: 1,
        initiatedBy: 'user1',
      };

      mockWorkflowInstanceRepository.findOne.mockResolvedValue(instance);
      mockWorkflowInstanceRepository.save.mockImplementation(
        async (inst) => inst,
      );

      const result = await service.approveStep('inst1', 1, 'approver1', 'OK');

      expect(result.currentStep).toBe(2);
      expect(result.steps[0].status).toBe(WorkflowStatus.APPROVED);
    });

    it('should complete workflow if last step approved', async () => {
      const instance = {
        id: 'inst1',
        workflowId: '1',
        entityType: 'PurchaseOrder',
        entityId: 'po1',
        status: WorkflowStatus.PENDING,
        steps: [
          {
            stepNumber: 1,
            approverRole: 'MANAGER',
            status: WorkflowStatus.PENDING,
          },
        ],
        currentStep: 1,
        initiatedBy: 'user1',
      };

      mockWorkflowInstanceRepository.findOne.mockResolvedValue(instance);
      mockWorkflowInstanceRepository.save.mockImplementation(
        async (inst) => inst,
      );

      const result = await service.approveStep('inst1', 1, 'approver1', 'OK');

      expect(result.status).toBe(WorkflowStatus.APPROVED);
    });
  });

  describe('rejectStep', () => {
    it('should reject a workflow step', async () => {
      const instance = {
        id: 'inst1',
        workflowId: '1',
        entityType: 'PurchaseOrder',
        entityId: 'po1',
        status: WorkflowStatus.PENDING,
        steps: [
          {
            stepNumber: 1,
            approverRole: 'MANAGER',
            status: WorkflowStatus.PENDING,
          },
        ],
        currentStep: 1,
        initiatedBy: 'user1',
      };

      mockWorkflowInstanceRepository.findOne.mockResolvedValue(instance);
      mockWorkflowInstanceRepository.save.mockImplementation(
        async (inst) => inst,
      );

      const result = await service.rejectStep('inst1', 1, 'approver1', 'Not OK');

      expect(result.status).toBe(WorkflowStatus.REJECTED);
      expect(result.steps[0].status).toBe(WorkflowStatus.REJECTED);
    });
  });
});

