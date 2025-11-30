import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';

@Injectable()
export class IpWhitelistGuard implements CanActivate {
  private readonly allowedIPs: string[];

  constructor(private readonly configService: ConfigService) {
    const whitelist = this.configService.get<string>('IP_WHITELIST', '');
    this.allowedIPs = whitelist
      ? whitelist.split(',').map((ip) => ip.trim())
      : [];
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // If no whitelist configured, allow all (for development)
    if (this.allowedIPs.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const clientIp = this.getClientIp(request);

    const isAllowed = this.allowedIPs.some(
      (allowedIp) =>
        clientIp === allowedIp ||
        this.isIpInRange(clientIp, allowedIp) ||
        allowedIp === '*',
    );

    if (!isAllowed) {
      throw new ForbiddenException(
        `IP address ${clientIp} is not allowed to access this resource`,
      );
    }

    return true;
  }

  private getClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }

  private isIpInRange(ip: string, range: string): boolean {
    // Simple CIDR notation support (e.g., 192.168.1.0/24)
    if (range.includes('/')) {
      const [subnet, prefixLength] = range.split('/');
      const subnetParts = subnet.split('.').map(Number);
      const ipParts = ip.split('.').map(Number);

      const mask = parseInt(prefixLength, 10);
      const subnetNum =
        (subnetParts[0] << 24) |
        (subnetParts[1] << 16) |
        (subnetParts[2] << 8) |
        subnetParts[3];
      const ipNum =
        (ipParts[0] << 24) |
        (ipParts[1] << 16) |
        (ipParts[2] << 8) |
        ipParts[3];

      const maskBits = ~(0xffffffff >>> mask);
      return (subnetNum & maskBits) === (ipNum & maskBits);
    }

    return false;
  }
}

