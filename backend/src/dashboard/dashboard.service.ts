import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** Totals, adequate vs not per project (for the chart) and the latest designs. */
  async summary(ownerId: string) {
    const [projects, recent] = await Promise.all([
      this.prisma.project.findMany({
        where: { ownerId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, name: true, location: true, designs: { select: { adequate: true, totalThicknessMm: true } } },
      }),
      this.prisma.design.findMany({
        where: { project: { ownerId } },
        orderBy: { updatedAt: 'desc' },
        take: 8,
        select: { id: true, name: true, adequate: true, totalSn: true, requiredSn: true, totalThicknessMm: true,
          layerCount: true, updatedAt: true, project: { select: { id: true, name: true } } },
      }),
    ]);

    const perProject = projects.map((p) => {
      const adequate = p.designs.filter((d) => d.adequate).length;
      return {
        id: p.id, name: p.name, location: p.location, designs: p.designs.length, adequate,
        notAdequate: p.designs.length - adequate,
        averageThicknessMm: p.designs.length
          ? p.designs.reduce((sum, d) => sum + d.totalThicknessMm, 0) / p.designs.length : null,
      };
    });
    const designs = perProject.reduce((sum, p) => sum + p.designs, 0);
    const adequate = perProject.reduce((sum, p) => sum + p.adequate, 0);
    return {
      totals: { projects: projects.length, designs, adequate, notAdequate: designs - adequate },
      perProject,
      recent,
    };
  }
}
