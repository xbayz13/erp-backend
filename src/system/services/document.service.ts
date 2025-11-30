import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { createWriteStream, existsSync, mkdirSync, readFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { AuditLogService } from '../../audit/services/audit-log.service';
import { Document, DocumentType } from '../entities/document.entity';

@Injectable()
export class DocumentService {
  private readonly uploadPath = join(process.cwd(), 'uploads');

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly auditLogService: AuditLogService,
  ) {
    // Ensure upload directory exists
    if (!existsSync(this.uploadPath)) {
      mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  async upload(
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    type: DocumentType,
    actorId: string,
    entityType?: string,
    entityId?: string,
    description?: string,
  ): Promise<Document> {
    const filename = `${Date.now()}-${file.originalname}`;
    const storagePath = join(this.uploadPath, filename);

    // Save file
    const writeStream = createWriteStream(storagePath);
    writeStream.write(file.buffer);
    writeStream.end();

    const document = this.documentRepository.create({
      filename,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      type,
      entityType,
      entityId,
      storagePath,
      description,
      uploadedBy: actorId,
    });

    const created = await this.documentRepository.save(document);

    await this.auditLogService.record({
      actorId,
      action: 'SYSTEM_UPLOAD_DOCUMENT',
      entity: 'Document',
      entityId: created.id,
      after: created as any,
    });

    return created;
  }

  async getFile(id: string): Promise<Buffer | null> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });
    if (!document) {
      return null;
    }

    if (!existsSync(document.storagePath)) {
      return null;
    }

    return readFileSync(document.storagePath);
  }

  async list(type?: DocumentType, entityType?: string, entityId?: string): Promise<Document[]> {
    const where: any = {};
    if (type) where.type = type;
    if (entityType) where.entityType = entityType;
    if (entityId) where.entityId = entityId;

    return this.documentRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async delete(id: string, actorId: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });
    if (!document) {
      throw new Error(`Document ${id} not found`);
    }

    // Delete file
    if (existsSync(document.storagePath)) {
      unlinkSync(document.storagePath);
    }

    await this.documentRepository.remove(document);

    await this.auditLogService.record({
      actorId,
      action: 'SYSTEM_DELETE_DOCUMENT',
      entity: 'Document',
      entityId: id,
      before: document as any,
    });
  }
}

