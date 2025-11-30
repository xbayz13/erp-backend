import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/role.enum';
import { CreateUserDto } from '../dto/create-user.dto';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  async onModuleInit() {
    const existing = await this.repository.count();
    if (existing === 0) {
      await this.seedDefaults();
    }
  }

  async create(dto: CreateUserDto): Promise<User> {
    const passwordHash = this.hashPassword(dto.password);
    const user = this.repository.create({
      name: dto.name,
      email: dto.email.toLowerCase(),
      passwordHash,
      roles: dto.roles,
    });
    return this.repository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    if (!user) {
      return null;
    }

    const isValid = this.verifyPassword(password, user.passwordHash);
    return isValid ? user : null;
  }

  async list(): Promise<User[]> {
    return this.repository.find({
      order: { createdAt: 'DESC' },
    });
  }

  private hashPassword(password: string): string {
    const salt = randomBytes(16);
    const hash = scryptSync(password, salt, 32);
    return `${salt.toString('hex')}:${hash.toString('hex')}`;
  }

  private verifyPassword(password: string, stored: string): boolean {
    const [saltHex, hashHex] = stored.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const hash = Buffer.from(hashHex, 'hex');
    const computed = scryptSync(password, salt, 32);
    return timingSafeEqual(hash, computed);
  }

  private async seedDefaults() {
    const defaultUsers: CreateUserDto[] = [
      {
        name: 'Admin Utama',
        email: 'admin@erp.local',
        password: 'Admin123!',
        roles: [UserRole.ADMIN],
      },
      {
        name: 'Manager Gudang',
        email: 'gudang@erp.local',
        password: 'Gudang123!',
        roles: [UserRole.MANAGER, UserRole.WAREHOUSE_MANAGER],
      },
      {
        name: 'Staff Pembelian',
        email: 'procurement@erp.local',
        password: 'Procure123!',
        roles: [UserRole.PURCHASING_STAFF],
      },
      {
        name: 'Admin Keuangan',
        email: 'finance@erp.local',
        password: 'Finance123!',
        roles: [UserRole.FINANCE_ADMIN, UserRole.FINANCE_MANAGER],
      },
    ];

    for (const dto of defaultUsers) {
      const existingUser = await this.findByEmail(dto.email);
      if (!existingUser) {
        await this.create(dto);
      }
    }
  }
}


