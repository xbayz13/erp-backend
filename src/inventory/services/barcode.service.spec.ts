import { Test, TestingModule } from '@nestjs/testing';
import { BarcodeService } from './barcode.service';

// Mock qrcode module
jest.mock('qrcode', () => {
  const mockToBuffer = jest.fn();
  return {
    __esModule: true,
    default: {
      toBuffer: mockToBuffer,
    },
    toBuffer: mockToBuffer,
  };
});

import * as QRCode from 'qrcode';

describe('BarcodeService', () => {
  let service: BarcodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BarcodeService],
    }).compile();

    service = module.get<BarcodeService>(BarcodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateQRCode', () => {
    it('should generate QR code buffer', async () => {
      const mockBuffer = Buffer.from('test-qr-code');
      (QRCode.toBuffer as jest.Mock).mockResolvedValue(mockBuffer);

      const result = await service.generateQRCode('test-data');

      expect(result).toBe(mockBuffer);
      expect(QRCode.toBuffer).toHaveBeenCalledWith('test-data', {
        width: 200,
        margin: 2,
      });
    });
  });

  describe('generateQRCodeBase64', () => {
    it('should generate QR code as base64 string', async () => {
      const mockBuffer = Buffer.from('test-qr-code');
      (QRCode.toBuffer as jest.Mock).mockResolvedValue(mockBuffer);

      const result = await service.generateQRCodeBase64('test-data');

      expect(result).toContain('data:image/png;base64,');
      expect(result).toContain(mockBuffer.toString('base64'));
    });
  });

  describe('generateBarcodeData', () => {
    it('should return barcode data as string', () => {
      const result = service.generateBarcodeData('SKU001');
      expect(result).toBe('SKU001');
    });
  });
});

