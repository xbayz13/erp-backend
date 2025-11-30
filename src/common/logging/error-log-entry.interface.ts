export interface ErrorLogEntry {
  id: string;
  context: string;
  message: string;
  stack?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}


