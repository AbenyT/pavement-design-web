import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { DesignsModule } from './designs/designs.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { ProjectsModule } from './projects/projects.module.js';

@Module({
  imports: [PrismaModule, AuthModule, ProjectsModule, DesignsModule, DashboardModule],
  controllers: [HealthController],
})
export class AppModule {}
