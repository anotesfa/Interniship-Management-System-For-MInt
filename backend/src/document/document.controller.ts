import { Controller, Get, Param, ParseIntPipe, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DocumentService } from './document.service';

@Controller('documents')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class DocumentController {
	constructor(private readonly documentService: DocumentService) {}

	@Get('entity/:entityType/:entityId')
	@Roles('Admin', 'University Coordinator')
	async getByEntity(
		@Param('entityType') entityType: string,
		@Param('entityId', ParseIntPipe) entityId: number,
	) {
		const data = await this.documentService.getByEntity(entityType, entityId);
		return { success: true, data, error: null };
	}

	@Get(':id/download')
	@Roles('Admin', 'University Coordinator', 'Student', 'Supervisor')
	async download(
		@Param('id', ParseIntPipe) id: number,
		@Res() res: Response,
	) {
		const document = await this.documentService.get(id);
		const fileBuffer = await this.documentService.download(id);

		res.setHeader('Content-Type', 'application/octet-stream');
		res.setHeader('Content-Disposition', `attachment; filename="${document.file_name}"`);
		res.send(fileBuffer);
	}
}
