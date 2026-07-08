import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TemplateService } from './template.service';
import { Response } from 'express';
import * as path from 'path';
import * as fs from 'fs';

@Controller('templates')
export class TemplateController {
  constructor(private readonly templateService: TemplateService) {}

  /**
   * Upload a new template (Admin only)
   * POST /templates
   */
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const dir = path.join(process.cwd(), 'uploads', 'templates');
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (req, file, cb) => {
          const timestamp = Date.now();
          const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, `${timestamp}_${safeName}`);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
      fileFilter: (req, file, cb) => {
        const allowed =
          file.mimetype === 'application/pdf' ||
          file.mimetype === 'application/msword' ||
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          /\.(pdf|doc|docx)$/i.test(file.originalname);

        if (!allowed) {
          cb(new BadRequestException('Only PDF, DOC, and DOCX files are allowed'), false);
        } else {
          cb(null, true);
        }
      },
    }),
  )
  async upload(
    @Request() req: { user: { userId: number } },
    @UploadedFile() file: Express.Multer.File,
    @Body('template_name') templateName: string,
  ) {
    const data = await this.templateService.upload(templateName, file, req.user.userId);
    return {
      success: true,
      statusCode: HttpStatus.CREATED,
      message: 'Template uploaded successfully',
      data,
      error: null,
    };
  }

  /**
   * Get all active templates (authenticated users)
   * GET /templates
   */
  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getAll() {
    const data = await this.templateService.getAll();
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: 'Templates retrieved successfully',
      data,
      error: null,
    };
  }

  /**
   * Download a template file
   * GET /templates/:id/download
   */
  @Get(':id/download')
  @UseGuards(AuthGuard('jwt'))
  async download(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const { buffer, fileName, mimeType } = await this.templateService.download(id);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.send(buffer);
  }

  /**
   * Delete a template (Admin only)
   * DELETE /templates/:id
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('Admin')
  async delete(@Param('id', ParseIntPipe) id: number) {
    const data = await this.templateService.delete(id);
    return {
      success: true,
      statusCode: HttpStatus.OK,
      message: data.message,
      data: null,
      error: null,
    };
  }
}
