import {
  Body,
  Controller,
  Delete,
  Get,
  Header,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Express } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/role.enum';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { NotificationService } from '../services/notification.service';
import { DocumentService } from '../services/document.service';
import { SessionService } from '../services/session.service';
import { TwoFactorAuthService } from '../services/two-factor-auth.service';
import { ActivityLogService } from '../services/activity-log.service';
import { DataImportExportService } from '../services/data-import-export.service';
import { AnalyticsService } from '../services/analytics.service';
import { ReportBuilderService } from '../services/report-builder.service';
import { WorkflowService } from '../services/workflow.service';
import { BackupRestoreService } from '../services/backup-restore.service';
import { I18nService } from '../services/i18n.service';
import { IntegrationHubService } from '../services/integration-hub.service';
import { NotificationStatus } from '../entities/notification.entity';
import { DocumentType } from '../entities/document.entity';
import { ReportDefinition } from '../services/report-builder.service';

@Controller('system')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SystemController {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly documentService: DocumentService,
    private readonly sessionService: SessionService,
    private readonly twoFactorAuthService: TwoFactorAuthService,
    private readonly activityLogService: ActivityLogService,
    private readonly dataImportExportService: DataImportExportService,
    private readonly analyticsService: AnalyticsService,
    private readonly reportBuilderService: ReportBuilderService,
    private readonly workflowService: WorkflowService,
    private readonly backupRestoreService: BackupRestoreService,
    private readonly i18nService: I18nService,
    private readonly integrationHubService: IntegrationHubService,
  ) {}

  // Notification endpoints
  @Get('notifications')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  listNotifications(
    @Req() req: AuthenticatedRequest,
    @Query('status') status?: NotificationStatus,
  ) {
    return this.notificationService.list(req.user.userId, status);
  }

  @Get('notifications/unread-count')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  getUnreadCount(@Req() req: AuthenticatedRequest) {
    return this.notificationService.getUnreadCount(req.user.userId);
  }

  @Patch('notifications/:id/read')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  markAsRead(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.notificationService.markAsRead(id, req.user.userId);
  }

  // Document endpoints
  @Post('documents/upload')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(
    @UploadedFile() file: any,
    @Body('type') type: DocumentType,
    @Body('entityType') entityType: string | undefined,
    @Body('entityId') entityId: string | undefined,
    @Body('description') description: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.documentService.upload(
      file,
      type,
      req.user.userId,
      entityType,
      entityId,
      description,
    );
  }

  @Get('documents')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listDocuments(
    @Query('type') type?: DocumentType,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
  ) {
    return this.documentService.list(type, entityType, entityId);
  }

  @Delete('documents/:id')
  @Roles(UserRole.ADMIN)
  deleteDocument(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.documentService.delete(id, req.user.userId);
  }

  // Session endpoints
  @Get('sessions')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listSessions(@Req() req: AuthenticatedRequest) {
    return this.sessionService.list(req.user.userId);
  }

  @Delete('sessions/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  revokeSession(@Param('id') id: string) {
    return this.sessionService.revoke(id);
  }

  @Delete('sessions/all')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  revokeAllSessions(@Req() req: AuthenticatedRequest) {
    return this.sessionService.revokeAll(req.user.userId);
  }

  // 2FA endpoints
  @Post('2fa/generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  generate2FA(@Req() req: AuthenticatedRequest) {
    return this.twoFactorAuthService.generateSecret(req.user.userId);
  }

  @Post('2fa/enable')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  enable2FA(
    @Body('token') token: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.twoFactorAuthService.enable(req.user.userId, token);
  }

  @Post('2fa/disable')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  disable2FA(@Req() req: AuthenticatedRequest) {
    return this.twoFactorAuthService.disable(req.user.userId);
  }

  @Get('2fa/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  get2FAStatus(@Req() req: AuthenticatedRequest) {
    return this.twoFactorAuthService.isEnabled(req.user.userId);
  }

  // Activity log endpoints
  @Get('activity')
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  getActivity(@Query('limit') limit?: string) {
    return this.activityLogService.getRecentActivity(
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('activity/user/:userId')
  @Roles(UserRole.ADMIN, UserRole.AUDITOR)
  getUserActivity(@Param('userId') userId: string) {
    return this.activityLogService.getUserActivity(userId);
  }

  // Data Import/Export endpoints
  @Get('export/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER)
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=items.xlsx')
  async exportItems(@Res() res: Response) {
    const buffer = await this.dataImportExportService.exportItemsToExcel();
    res.send(buffer);
  }

  @Get('export/customers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  @Header('Content-Disposition', 'attachment; filename=customers.xlsx')
  async exportCustomers(@Res() res: Response) {
    const buffer = await this.dataImportExportService.exportCustomersToExcel();
    res.send(buffer);
  }

  @Post('import/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async importItems(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('File is required');
    }
    return this.dataImportExportService.importItemsFromExcel(file.buffer);
  }

  @Post('import/customers')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @UseInterceptors(FileInterceptor('file'))
  async importCustomers(@UploadedFile() file: any) {
    if (!file) {
      throw new Error('File is required');
    }
    return this.dataImportExportService.importCustomersFromExcel(file.buffer);
  }

  @Get('export/template/:entityType')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
  async exportTemplate(@Param('entityType') entityType: string, @Res() res: Response) {
    const buffer = await this.dataImportExportService.exportTemplate(entityType);
    res.setHeader('Content-Disposition', `attachment; filename=${entityType}-template.xlsx`);
    res.send(buffer);
  }

  // Analytics endpoints
  @Get('analytics/dashboard')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getDashboard(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.analyticsService.getDashboardData(start, end);
  }

  // Report Builder endpoints
  @Post('reports/build')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  buildReport(@Body() definition: ReportDefinition) {
    return this.reportBuilderService.buildReport(definition);
  }

  @Get('reports/entities')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getAvailableEntities() {
    return this.reportBuilderService.getAvailableEntities();
  }

  @Get('reports/fields/:entity')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getAvailableFields(@Param('entity') entity: string) {
    return this.reportBuilderService.getAvailableFields(entity);
  }

  // Workflow endpoints
  @Post('workflows')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  createWorkflow(
    @Body() body: { name: string; entityType: string; steps: Array<{ stepNumber: number; approverRole: string; required: boolean }> },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.workflowService.createWorkflow(
      body.name,
      body.entityType,
      body.steps,
      req.user.userId,
    );
  }

  @Get('workflows')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listWorkflows(@Query('entityType') entityType?: string) {
    return this.workflowService.listWorkflows(entityType);
  }

  @Post('workflows/:id/initiate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  initiateWorkflow(
    @Param('id') id: string,
    @Body() body: { entityType: string; entityId: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.workflowService.initiateWorkflow(
      id,
      body.entityType,
      body.entityId,
      req.user.userId,
    );
  }

  @Post('workflows/instances/:instanceId/approve')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  approveWorkflowStep(
    @Param('instanceId') instanceId: string,
    @Body() body: { stepNumber: number; comments?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.workflowService.approveStep(
      instanceId,
      body.stepNumber,
      req.user.userId,
      body.comments,
    );
  }

  @Post('workflows/instances/:instanceId/reject')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  rejectWorkflowStep(
    @Param('instanceId') instanceId: string,
    @Body() body: { stepNumber: number; comments?: string },
    @Req() req: AuthenticatedRequest,
  ) {
    return this.workflowService.rejectStep(
      instanceId,
      body.stepNumber,
      req.user.userId,
      body.comments,
    );
  }

  // Backup/Restore endpoints
  @Post('backup/create')
  @Roles(UserRole.ADMIN)
  createBackup() {
    return this.backupRestoreService.createBackup();
  }

  @Get('backup/list')
  @Roles(UserRole.ADMIN)
  listBackups() {
    return this.backupRestoreService.listBackups();
  }

  @Post('backup/restore/:filename')
  @Roles(UserRole.ADMIN)
  restoreBackup(@Param('filename') filename: string) {
    return this.backupRestoreService.restoreBackup(filename);
  }

  @Delete('backup/:filename')
  @Roles(UserRole.ADMIN)
  deleteBackup(@Param('filename') filename: string) {
    return this.backupRestoreService.deleteBackup(filename);
  }

  // i18n endpoints
  @Get('i18n/languages')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  getAvailableLanguages() {
    return this.i18nService.getAvailableLanguages();
  }

  @Get('i18n/translate/:key')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF)
  translate(
    @Param('key') key: string,
    @Query('lang') languageCode: string = 'en',
  ) {
    return { key, translation: this.i18nService.translate(key, languageCode) };
  }

  @Get('i18n/translations/:languageCode')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getAllTranslations(@Param('languageCode') languageCode: string) {
    return this.i18nService.getAllTranslations(languageCode);
  }

  @Post('i18n/translations/:languageCode')
  @Roles(UserRole.ADMIN)
  addTranslation(
    @Param('languageCode') languageCode: string,
    @Body() body: { key: string; value: string },
  ) {
    this.i18nService.addTranslation(languageCode, body.key, body.value);
    return { success: true };
  }

  // Integration Hub endpoints
  @Post('integrations')
  @Roles(UserRole.ADMIN)
  createIntegration(
    @Body()
    body: {
      name: string;
      description: string;
      type: string;
      configuration: Record<string, any>;
      endpoint?: string;
      apiKey?: string;
    },
  ) {
    return this.integrationHubService.createIntegration(
      body.name,
      body.description,
      body.type as any,
      body.configuration,
      body.endpoint,
      body.apiKey,
    );
  }

  @Get('integrations')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listIntegrations() {
    return this.integrationHubService.listIntegrations();
  }

  @Get('integrations/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getIntegration(@Param('id') id: string) {
    return this.integrationHubService.getIntegration(id);
  }

  @Patch('integrations/:id')
  @Roles(UserRole.ADMIN)
  updateIntegration(
    @Param('id') id: string,
    @Body() updates: any,
  ) {
    return this.integrationHubService.updateIntegration(id, updates);
  }

  @Post('integrations/:id/activate')
  @Roles(UserRole.ADMIN)
  activateIntegration(@Param('id') id: string) {
    return this.integrationHubService.activateIntegration(id);
  }

  @Post('integrations/:id/deactivate')
  @Roles(UserRole.ADMIN)
  deactivateIntegration(@Param('id') id: string) {
    return this.integrationHubService.deactivateIntegration(id);
  }

  @Post('integrations/:id/test')
  @Roles(UserRole.ADMIN)
  testIntegration(
    @Param('id') id: string,
    @Body() testPayload: Record<string, any>,
  ) {
    return this.integrationHubService.testIntegration(id, testPayload);
  }

  @Post('webhooks')
  @Roles(UserRole.ADMIN)
  createWebhook(
    @Body() body: { url: string; eventType: string; secret?: string },
  ) {
    return this.integrationHubService.createWebhook(
      body.url,
      body.eventType as any,
      body.secret,
    );
  }

  @Get('webhooks')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  listWebhooks(@Query('eventType') eventType?: string) {
    return this.integrationHubService.listWebhooks(eventType as any);
  }

  @Delete('webhooks/:id')
  @Roles(UserRole.ADMIN)
  deleteWebhook(@Param('id') id: string) {
    return this.integrationHubService.deleteWebhook(id);
  }
}

