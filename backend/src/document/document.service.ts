import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DocumentService {
  constructor(private readonly prisma: PrismaService) {}

  private mapDocument(document: any) {
    const fullPath = path.resolve(process.cwd(), document.file_path);
    const fileSizeKb = fs.existsSync(fullPath)
      ? Math.max(1, Math.round(fs.statSync(fullPath).size / 1024))
      : 0;

    return {
      ...document,
      file_size_kb: fileSizeKb,
    };
  }

  async upload(
    fileName: string,
    filePath: string,
    fileType: string,
    documentTypeId: number,
    uploadedBy: number,
    entityType: string,
    entityId: number,
  ) {
    // Validate file exists
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`File not found at ${filePath}`);
    }

    // Validate user
    const user = await this.prisma.user.findUnique({
      where: { user_id: uploadedBy },
    });

    if (!user) {
      throw new NotFoundException(`User with id ${uploadedBy} not found`);
    }

    // Validate document type
    const docType = await this.prisma.documentType.findUnique({
      where: { type_id: documentTypeId },
    });

    if (!docType) {
      throw new NotFoundException(`Document type with id ${documentTypeId} not found`);
    }

    // Store relative path instead of absolute
    const relativePath = path.relative(process.cwd(), filePath);

    const document = await this.prisma.document.create({
      data: {
        file_name: fileName.substring(0, 255),
        file_path: relativePath.substring(0, 500),
        file_type: fileType.substring(0, 100),
        document_type_id: documentTypeId,
        uploaded_by: uploadedBy,
        entity_type: entityType.substring(0, 50),
        entity_id: entityId,
      },
      include: {
        document_type: true,
        uploader: { include: { role: true } },
      },
    });

    return document;
  }

  async get(documentId: number) {
    const document = await this.prisma.document.findUnique({
      where: { document_id: documentId },
      include: {
        document_type: true,
        uploader: { include: { role: true } },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`);
    }

    return this.mapDocument(document);
  }

  async download(documentId: number) {
    const document = await this.prisma.document.findUnique({
      where: { document_id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`);
    }

    // Construct full path
    const fullPath = path.resolve(process.cwd(), document.file_path);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException(`File not found at ${fullPath}`);
    }

    try {
      const buffer = fs.readFileSync(fullPath);
      return buffer;
    } catch (error) {
      throw new BadRequestException(`Failed to read file: ${error.message}`);
    }
  }

  async delete(documentId: number) {
    const document = await this.prisma.document.findUnique({
      where: { document_id: documentId },
    });

    if (!document) {
      throw new NotFoundException(`Document with id ${documentId} not found`);
    }

    // Delete file from filesystem
    const fullPath = path.resolve(process.cwd(), document.file_path);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (error) {
        console.warn(`Failed to delete file ${fullPath}: ${error.message}`);
      }
    }

    // Delete from database
    await this.prisma.document.delete({
      where: { document_id: documentId },
    });
  }

  async getByEntity(entityType: string, entityId: number) {
    const documents = await this.prisma.document.findMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
      },
      include: {
        document_type: true,
        uploader: { include: { role: true } },
      },
      orderBy: { uploaded_at: 'desc' },
    });

    return documents.map((document) => this.mapDocument(document));
  }
}
