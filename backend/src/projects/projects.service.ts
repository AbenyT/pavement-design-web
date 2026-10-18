import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The user's projects, newest activity first, with design counts. */
  async list(ownerId: string) {
    const projects = await this.prisma.project.findMany({
      where: { ownerId },
      orderBy: { updatedAt: 'desc' },
      include: { designs: { select: { adequate: true } } },
    });
    return projects.map(({ designs, ...project }) => ({
      ...project,
      designCount: designs.length,
      adequateCount: designs.filter((d) => d.adequate).length,
    }));
  }

  create(ownerId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({ data: { ...dto, ownerId } });
  }

  /** One project with its designs (summary columns only, newest first). */
  async get(ownerId: string, id: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, ownerId },
      include: {
        designs: {
          orderBy: { updatedAt: 'desc' },
          select: { id: true, name: true, adequate: true, totalSn: true, requiredSn: true,
            totalThicknessMm: true, layerCount: true, createdAt: true, updatedAt: true },
        },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(ownerId: string, id: string, dto: UpdateProjectDto) {
    await this.assertOwner(ownerId, id);
    return this.prisma.project.update({ where: { id }, data: dto });
  }

  /** Deletes the project and (cascade) all its designs. */
  async remove(ownerId: string, id: string) {
    await this.assertOwner(ownerId, id);
    await this.prisma.project.delete({ where: { id } });
    return { deleted: true };
  }

  /** 404 (not 403) for other users' projects, so their ids are not revealed. */
  async assertOwner(ownerId: string, id: string) {
    const found = await this.prisma.project.findFirst({ where: { id, ownerId }, select: { id: true } });
    if (!found) throw new NotFoundException('Project not found');
  }
}
