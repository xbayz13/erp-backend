import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { Request } from 'express';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract tenant from header, subdomain, or query parameter
    const tenantId =
      request.headers['x-tenant-id'] ||
      request.query.tenantId ||
      this.extractFromDomain(request.hostname);

    if (tenantId) {
      (request as any).tenantId = tenantId;
    }

    return next.handle();
  }

  private extractFromDomain(hostname: string): string | undefined {
    // Extract tenant from subdomain (e.g., tenant1.example.com)
    const parts = hostname.split('.');
    if (parts.length > 2) {
      return parts[0];
    }
    return undefined;
  }
}

