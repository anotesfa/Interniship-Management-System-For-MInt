import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TemplateService {
  private readonly UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'templates');

  constructor(private readonly prisma: PrismaService) {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  /**
   * Upload a new template (Admin only)
   */
  async upload(
    templateName: string,
    file: Express.Multer.File,
    uploadedBy: number,
  ) {
    if (!file) {
      throw new BadRequestException('Template file is required');
    }

    if (!templateName?.trim()) {
      throw new BadRequestException('Template name is required');
    }

    const template = await this.prisma.template.create({
      data: {
        template_name: templateName.trim().substring(0, 255),
        file_name: file.originalname.substring(0, 255),
        file_path: file.path,
        file_type: file.mimetype.substring(0, 100),
        uploaded_by: uploadedBy,
        is_active: true,
      },
      include: {
        uploader: { select: { user_id: true, full_name: true, email: true } },
      },
    });

    return this.mapTemplate(template);
  }

  /**
   * Get all active templates (public for universities)
   */
  async getAll() {
    const templates = await this.prisma.template.findMany({
      where: { is_active: true },
      include: {
        uploader: { select: { user_id: true, full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return templates.map((t) => this.mapTemplate(t));
  }

  /**
   * Get a single template by ID
   */
  async getById(templateId: number) {
    const template = await this.prisma.template.findUnique({
      where: { template_id: templateId },
      include: {
        uploader: { select: { user_id: true, full_name: true, email: true } },
      },
    });

    if (!template || !template.is_active) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    return this.mapTemplate(template);
  }

  /**
   * Download a template file — returns buffer + metadata
   */
  async download(templateId: number): Promise<{ buffer: Buffer; fileName: string; mimeType: string }> {
    const template = await this.prisma.template.findUnique({
      where: { template_id: templateId },
    });

    if (!template || !template.is_active) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    const fullPath = path.resolve(process.cwd(), template.file_path);

    if (!fs.existsSync(fullPath)) {
      throw new NotFoundException('Template file not found on disk');
    }

    const buffer = fs.readFileSync(fullPath);
    return {
      buffer,
      fileName: template.file_name,
      mimeType: template.file_type || 'application/pdf',
    };
  }

  /**
   * Soft-delete a template (Admin only)
   */
  async delete(templateId: number) {
    const template = await this.prisma.template.findUnique({
      where: { template_id: templateId },
    });

    if (!template || !template.is_active) {
      throw new NotFoundException(`Template with ID ${templateId} not found`);
    }

    // Soft delete — keep file on disk, just mark inactive
    await this.prisma.template.update({
      where: { template_id: templateId },
      data: { is_active: false },
    });

    return { message: 'Template deleted successfully' };
  }

  private mapTemplate(template: any) {
    return {
      template_id: template.template_id,
      template_name: template.template_name,
      file_name: template.file_name,
      file_type: template.file_type,
      uploaded_at: template.created_at,
      uploaded_by_name: template.uploader?.full_name ?? '',
      uploaded_by_email: template.uploader?.email ?? '',
    };
  }
}
