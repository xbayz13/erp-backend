import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class EncryptionService {
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32;
  private encryptionKey!: Buffer;

  constructor(private readonly configService: ConfigService) {
    this.initializeKey();
  }

  private async initializeKey() {
    const secretKey =
      this.configService.get<string>('ENCRYPTION_SECRET') ||
      'default-encryption-key-change-in-production';
    this.encryptionKey = (await promisify(scrypt)(
      secretKey,
      'salt',
      this.keyLength,
    )) as Buffer;
  }

  async encrypt(text: string): Promise<string> {
    await this.ensureKeyInitialized();
    const iv = randomBytes(16);
    const cipher = createCipheriv(this.algorithm, this.encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Combine IV, auth tag, and encrypted data
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  async decrypt(encryptedText: string): Promise<string> {
    await this.ensureKeyInitialized();
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = createDecipheriv(this.algorithm, this.encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  async encryptObject(obj: Record<string, any>): Promise<string> {
    const jsonString = JSON.stringify(obj);
    return this.encrypt(jsonString);
  }

  async decryptObject<T>(encryptedText: string): Promise<T> {
    const decrypted = await this.decrypt(encryptedText);
    return JSON.parse(decrypted) as T;
  }

  private async ensureKeyInitialized(): Promise<void> {
    if (!this.encryptionKey) {
      await this.initializeKey();
    }
  }
}

