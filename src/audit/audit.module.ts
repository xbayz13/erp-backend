import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { ErrorLog } from './entities/error-log.entity';
import { EntityVersion } from './entities/entity-version.entity';
import { AuditLogService } from './services/audit-log.service';
import { ErrorLogService } from './services/error-log.service';
import { AuditTrailEnhancedService } from './services/audit-trail-enhanced.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog, ErrorLog, EntityVersion])],
  providers: [
    AuditLogService,
    ErrorLogService,
    AuditTrailEnhancedService,
  ],
  exports: [AuditLogService, ErrorLogService, AuditTrailEnhancedService],
})
export class AuditModule {}


