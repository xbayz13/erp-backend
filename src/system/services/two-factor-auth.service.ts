import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TwoFactorAuth } from '../entities/two-factor-auth.entity';

// Simple TOTP implementation (in production, use otplib)
const generateSecret = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  for (let i = 0; i < 32; i++) {
    secret += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return secret;
};

const generateToken = (secret: string): string => {
  // Simplified TOTP - in production use proper TOTP library
  const time = Math.floor(Date.now() / 1000 / 30);
  return (time % 1000000).toString().padStart(6, '0');
};

const verifyToken = (token: string, secret: string): boolean => {
  const expected = generateToken(secret);
  return token === expected;
};

@Injectable()
export class TwoFactorAuthService {
  constructor(
    @InjectRepository(TwoFactorAuth)
    private readonly twoFactorRepository: Repository<TwoFactorAuth>,
  ) {}

  async generateSecret(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = generateSecret();
    const serviceName = 'ERP System';
    const accountName = userId;

    const otpAuthUrl = `otpauth://totp/${serviceName}:${accountName}?secret=${secret}&issuer=${serviceName}`;

    // Check if 2FA already exists
    const existing = await this.twoFactorRepository.findOne({
      where: { userId },
    });

    if (existing) {
      existing.secret = secret;
      await this.twoFactorRepository.save(existing);
    } else {
      const twoFactor = this.twoFactorRepository.create({
        userId,
        secret,
        isEnabled: false,
      });
      await this.twoFactorRepository.save(twoFactor);
    }

    return {
      secret,
      qrCode: otpAuthUrl, // Can be converted to QR code image
    };
  }

  async verifyToken(userId: string, token: string): Promise<boolean> {
    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId },
    });
    if (!twoFactor || !twoFactor.isEnabled) {
      return false;
    }

    return verifyToken(token, twoFactor.secret);
  }

  async enable(userId: string, token: string): Promise<TwoFactorAuth> {
    // For testing, accept any token that is not empty
    // In production, this should use proper TOTP verification
    if (!token || token.length < 6) {
      throw new Error('Invalid verification token');
    }
    
    const isValid = await this.verifyToken(userId, token);
    if (!isValid) {
      throw new Error('Invalid verification token');
    }

    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId },
    });
    if (!twoFactor) {
      throw new Error(`2FA not found for user ${userId}`);
    }

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase(),
    );

    twoFactor.isEnabled = true;
    twoFactor.backupCodes = backupCodes;
    return this.twoFactorRepository.save(twoFactor);
  }

  async disable(userId: string): Promise<void> {
    await this.twoFactorRepository.update(
      { userId },
      { isEnabled: false, backupCodes: [] },
    );
  }

  async isEnabled(userId: string): Promise<boolean> {
    const twoFactor = await this.twoFactorRepository.findOne({
      where: { userId },
    });
    return twoFactor?.isEnabled || false;
  }
}
