import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AuditModule } from '../audit/audit.module';
import { InventoryModule } from '../inventory/inventory.module';
import { SalesModule } from '../sales/sales.module';
import { PurchasingModule } from '../purchasing/purchasing.module';
import { FinanceModule } from '../finance/finance.module';
import { ProductionModule } from '../production/production.module';
import { Notification } from './entities/notification.entity';
import { Document } from './entities/document.entity';
import { UserSession } from './entities/user-session.entity';
import { TwoFactorAuth } from './entities/two-factor-auth.entity';
import { Workflow } from './entities/workflow.entity';
import { WorkflowInstance } from './entities/workflow-instance.entity';
import { SystemEventLog } from './entities/system-event.entity';
import { Integration } from './entities/integration.entity';
import { Webhook } from './entities/webhook.entity';
import { NotificationService } from './services/notification.service';
import { DocumentService } from './services/document.service';
import { SessionService } from './services/session.service';
import { TwoFactorAuthService } from './services/two-factor-auth.service';
import { ActivityLogService } from './services/activity-log.service';
import { AutomationService } from './services/automation.service';
import { DataImportExportService } from './services/data-import-export.service';
import { AnalyticsService } from './services/analytics.service';
import { ReportBuilderService } from './services/report-builder.service';
import { EncryptionService } from './services/encryption.service';
import { WorkflowService } from './services/workflow.service';
import { EventEmitterService } from './services/event-emitter.service';
import { BackupRestoreService } from './services/backup-restore.service';
import { I18nService } from './services/i18n.service';
import { IntegrationHubService } from './services/integration-hub.service';
import { SystemController } from './controllers/system.controller';
import { AuditLog } from '../audit/entities/audit-log.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    AuditModule,
    InventoryModule,
    SalesModule,
    PurchasingModule,
    FinanceModule,
    ProductionModule,
    TypeOrmModule.forFeature([
      Notification,
      Document,
      UserSession,
      TwoFactorAuth,
      Workflow,
      WorkflowInstance,
      SystemEventLog,
      Integration,
      Webhook,
      AuditLog,
    ]),
  ],
  controllers: [SystemController],
  providers: [
    NotificationService,
    DocumentService,
    SessionService,
    TwoFactorAuthService,
    ActivityLogService,
    AutomationService,
    DataImportExportService,
    AnalyticsService,
    ReportBuilderService,
    EncryptionService,
    WorkflowService,
    EventEmitterService,
    BackupRestoreService,
    I18nService,
    IntegrationHubService,
  ],
  exports: [
    NotificationService,
    DocumentService,
    SessionService,
    TwoFactorAuthService,
    ActivityLogService,
    AutomationService,
    DataImportExportService,
    AnalyticsService,
    ReportBuilderService,
    EncryptionService,
    WorkflowService,
    EventEmitterService,
    BackupRestoreService,
    I18nService,
    IntegrationHubService,
  ],
})
export class SystemModule {}

