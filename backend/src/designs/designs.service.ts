import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DesignInput, DesignInputError, DesignResult, designPavement, withDefaults } from '../engine/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ProjectsService } from '../projects/projects.service.js';
import { CreateDesignDto, DesignInputDto, UpdateDesignDto } from './dto/design-input.dto.js';

/** Summary columns returned in lists (the full JSON is only sent for a single design). */
const SUMMARY = {
  id: true, projectId: true, name: true, adequate: true, totalSn: true, requiredSn: true,
  totalThicknessMm: true, layerCount: true, createdAt: true, updatedAt: true,
} as const;

@Injectable()
export class DesignsService {
  constructor(private readonly prisma: PrismaService, private readonly projects: ProjectsService) {}

  /**
   * Plain inputs without empty (undefined) fields: DTO class instances define every field,
   * and an undefined value must not overwrite a default. This is also what gets stored.
   */
  static cleanInputs(dto: DesignInputDto | undefined): Partial<DesignInput> {
    return JSON.parse(JSON.stringify(dto ?? {}));
  }

  /** Run the engine; invalid combinations become a 400 with readable messages. */
  calculate(dto: DesignInputDto | undefined): DesignResult {
    try {
      return designPavement(withDefaults(DesignsService.cleanInputs(dto)));
    } catch (error) {
      if (error instanceof DesignInputError) throw new BadRequestException(error.problems);
      if (error instanceof RangeError) throw new BadRequestException([error.message]);
      throw error;
    }
  }

  async list(ownerId: string, projectId: string) {
    await this.projects.assertOwner(ownerId, projectId);
    return this.prisma.design.findMany({ where: { projectId }, orderBy: { updatedAt: 'desc' }, select: SUMMARY });
  }

  async create(ownerId: string, projectId: string, dto: CreateDesignDto) {
    await this.projects.assertOwner(ownerId, projectId);
    const inputs = DesignsService.cleanInputs(dto.inputs);
    const result = this.calculate(dto.inputs);
    const [design] = await this.prisma.$transaction([
      this.prisma.design.create({ data: { projectId, name: dto.name, ...this.columns(inputs, result) } }),
      this.prisma.project.update({ where: { id: projectId }, data: { updatedAt: new Date() } }),
    ]);
    return design;
  }

  /** One design with inputs, result and its project's name. */
  async get(ownerId: string, id: string) {
    const design = await this.prisma.design.findFirst({
      where: { id, project: { ownerId } },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!design) throw new NotFoundException('Design not found');
    return design;
  }

  async update(ownerId: string, id: string, dto: UpdateDesignDto) {
    const existing = await this.get(ownerId, id);
    const data: Prisma.DesignUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.inputs !== undefined) {
      const inputs = DesignsService.cleanInputs(dto.inputs);
      Object.assign(data, this.columns(inputs, this.calculate(dto.inputs)));
    }
    const [design] = await this.prisma.$transaction([
      this.prisma.design.update({ where: { id }, data }),
      this.prisma.project.update({ where: { id: existing.projectId }, data: { updatedAt: new Date() } }),
    ]);
    return design;
  }

  async remove(ownerId: string, id: string) {
    await this.get(ownerId, id);
    await this.prisma.design.delete({ where: { id } });
    return { deleted: true };
  }

  /** Every design of a project with full results (for CSV/Excel export). */
  async forExport(ownerId: string, projectId: string) {
    const project = await this.projects.get(ownerId, projectId);
    const designs = await this.prisma.design.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' } });
    return { project, designs };
  }

  private columns(inputs: Partial<DesignInput>, result: DesignResult) {
    return {
      inputs: inputs as Prisma.InputJsonValue,
      result: result as unknown as Prisma.InputJsonValue,
      adequate: result.adequate,
      totalSn: result.totalSn,
      requiredSn: result.requiredTotalSn,
      totalThicknessMm: result.totalThicknessMm,
      layerCount: result.layers.length,
    };
  }
}
