import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module.js';
import { DesignsController } from './designs.controller.js';
import { DesignsService } from './designs.service.js';
import { ExportService } from './export.service.js';

@Module({
  imports: [ProjectsModule],
  controllers: [DesignsController],
  providers: [DesignsService, ExportService],
})
export class DesignsModule {}
