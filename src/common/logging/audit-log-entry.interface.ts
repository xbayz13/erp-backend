export interface AuditLogEntry {
  id: string;
  actorId: string;
  action: string;
  entity: string;
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  reason?: string;
  createdAt: Date;
}


