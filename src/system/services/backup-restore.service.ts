import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export interface BackupInfo {
  id: string;
  filename: string;
  size: number;
  createdAt: Date;
  verified: boolean;
}

@Injectable()
export class BackupRestoreService {
  private readonly backupPath: string;

  constructor(private readonly configService: ConfigService) {
    this.backupPath = join(process.cwd(), 'backups');
    if (!existsSync(this.backupPath)) {
      mkdirSync(this.backupPath, { recursive: true });
    }
  }

  async createBackup(): Promise<BackupInfo> {
    const dbHost = this.configService.get<string>('POSTGRES_HOST', 'localhost');
    const dbPort = this.configService.get<string>('POSTGRES_PORT', '5432');
    const dbUser = this.configService.get<string>('POSTGRES_USER', 'postgres');
    const dbName = this.configService.get<string>('POSTGRES_DB', 'erp');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `backup-${timestamp}.sql`;
    const filepath = join(this.backupPath, filename);

    const pgDumpCommand = `PGPASSWORD="${this.configService.get<string>(
      'POSTGRES_PASSWORD',
      'postgres',
    )}" pg_dump -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} -F c -f ${filepath}`;

    try {
      await execAsync(pgDumpCommand);

      const stats = require('fs').statSync(filepath);
      const verified = stats.size > 0;

      return {
        id: timestamp,
        filename,
        size: stats.size,
        createdAt: new Date(),
        verified,
      };
    } catch (error: any) {
      throw new Error(`Backup failed: ${error.message}`);
    }
  }

  async restoreBackup(filename: string): Promise<void> {
    const filepath = join(this.backupPath, filename);
    if (!existsSync(filepath)) {
      throw new Error(`Backup file ${filename} not found`);
    }

    const dbHost = this.configService.get<string>('POSTGRES_HOST', 'localhost');
    const dbPort = this.configService.get<string>('POSTGRES_PORT', '5432');
    const dbUser = this.configService.get<string>('POSTGRES_USER', 'postgres');
    const dbName = this.configService.get<string>('POSTGRES_DB', 'erp');

    const pgRestoreCommand = `PGPASSWORD="${this.configService.get<string>(
      'POSTGRES_PASSWORD',
      'postgres',
    )}" pg_restore -h ${dbHost} -p ${dbPort} -U ${dbUser} -d ${dbName} --clean --if-exists ${filepath}`;

    try {
      await execAsync(pgRestoreCommand);
    } catch (error: any) {
      throw new Error(`Restore failed: ${error.message}`);
    }
  }

  async listBackups(): Promise<BackupInfo[]> {
    if (!existsSync(this.backupPath)) {
      return [];
    }

    const files = readdirSync(this.backupPath)
      .filter((file) => file.endsWith('.sql'))
      .map((file) => {
        const filepath = join(this.backupPath, file);
        const stats = require('fs').statSync(filepath);
        return {
          id: file.replace('.sql', ''),
          filename: file,
          size: stats.size,
          createdAt: stats.birthtime,
          verified: stats.size > 0,
        };
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return files;
  }

  async verifyBackup(filename: string): Promise<boolean> {
    const filepath = join(this.backupPath, filename);
    if (!existsSync(filepath)) {
      return false;
    }

    const stats = require('fs').statSync(filepath);
    return stats.size > 0;
  }

  async deleteBackup(filename: string): Promise<void> {
    const filepath = join(this.backupPath, filename);
    if (!existsSync(filepath)) {
      throw new Error(`Backup file ${filename} not found`);
    }

    require('fs').unlinkSync(filepath);
  }
}

