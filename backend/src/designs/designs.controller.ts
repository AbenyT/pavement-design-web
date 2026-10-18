import {
  Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser, JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import type { AuthUser } from '../auth/jwt-auth.guard.js';
import { DesignsService } from './designs.service.js';
import { CreateDesignDto, DesignInputDto, UpdateDesignDto } from './dto/design-input.dto.js';
import { ExportService } from './export.service.js';

@Controller()
export class DesignsController {
  constructor(private readonly designs: DesignsService, private readonly exporter: ExportService) {}

  /** Calculate without saving — used for the live preview while typing. No sign-in needed. */
  @Post('designs/calculate')
  @HttpCode(200)
  calculate(@Body() inputs: DesignInputDto) {
    return this.designs.calculate(inputs);
  }

  @Get('projects/:projectId/designs')
  @UseGuards(JwtAuthGuard)
  list(@CurrentUser() user: AuthUser, @Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.designs.list(user.id, projectId);
  }

  @Post('projects/:projectId/designs')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: AuthUser, @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateDesignDto) {
    return this.designs.create(user.id, projectId, dto);
  }

  /** GET /projects/:projectId/export?format=csv|xlsx — every design of the project. */
  @Get('projects/:projectId/export')
  @UseGuards(JwtAuthGuard)
  async export(@CurrentUser() user: AuthUser, @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query('format') format = 'xlsx', @Res() res: Response) {
    const { project, designs } = await this.designs.forExport(user.id, projectId);
    // Safe file name: any run of other characters (spaces, dashes like "–", slashes) becomes one "_"
    const base = project.name.replace(/[^A-Za-z0-9]+/g, '_').replace(/^_+|_+$/g, '') || 'project';
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${base}_designs.csv"`);
      res.send(this.exporter.toCsv(project.name, designs));
      return;
    }
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${base}_designs.xlsx"`);
    res.send(await this.exporter.toXlsx(project.name, designs));
  }

  @Get('designs/:id')
  @UseGuards(JwtAuthGuard)
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.designs.get(user.id, id);
  }

  @Patch('designs/:id')
  @UseGuards(JwtAuthGuard)
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDesignDto) {
    return this.designs.update(user.id, id, dto);
  }

  @Delete('designs/:id')
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.designs.remove(user.id, id);
  }
}
