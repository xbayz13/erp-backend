import { Injectable } from '@nestjs/common';
import * as QRCode from 'qrcode';

@Injectable()
export class BarcodeService {
  async generateQRCode(data: string): Promise<Buffer> {
    return await QRCode.toBuffer(data, {
      width: 200,
      margin: 2,
    });
  }

  async generateQRCodeBase64(data: string): Promise<string> {
    const buffer = await this.generateQRCode(data);
    return `data:image/png;base64,${buffer.toString('base64')}`;
  }

  generateBarcodeData(data: string): string {
    // Return barcode data as string (for frontend rendering)
    return data;
  }
}

