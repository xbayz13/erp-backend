import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../entities/tenant.entity';

@Injectable()
export class MultiTenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async createTenant(
    code: string,
    name: string,
    domain?: string,
    settings?: Record<string, any>,
  ): Promise<Tenant> {
    const tenant = this.tenantRepository.create({
      code,
      name,
      domain,
      settings,
      isActive: true,
    });

    return this.tenantRepository.save(tenant);
  }

  async getTenant(tenantId: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { id: tenantId, isActive: true },
    });
  }

  async getTenantByCode(code: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { code, isActive: true },
    });
  }

  async getTenantByDomain(domain: string): Promise<Tenant | null> {
    return this.tenantRepository.findOne({
      where: { domain, isActive: true },
    });
  }

  async listTenants(): Promise<Tenant[]> {
    return this.tenantRepository.find({
      order: { name: 'ASC' },
    });
  }

  async updateTenant(
    tenantId: string,
    updates: Partial<Tenant>,
  ): Promise<Tenant> {
    const tenant = await this.getTenant(tenantId);
    if (!tenant) {
      throw new Error(`Tenant ${tenantId} not found`);
    }

    Object.assign(tenant, updates);
    return this.tenantRepository.save(tenant);
  }

  async deactivateTenant(tenantId: string): Promise<Tenant> {
    return this.updateTenant(tenantId, { isActive: false });
  }

  async activateTenant(tenantId: string): Promise<Tenant> {
    return this.updateTenant(tenantId, { isActive: true });
  }
}

