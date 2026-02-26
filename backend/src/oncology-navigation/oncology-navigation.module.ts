import { Module } from '@nestjs/common';
import { OncologyNavigationService } from './oncology-navigation.service';
import { OncologyNavigationController } from './oncology-navigation.controller';
import { OncologyNavigationScheduler } from './oncology-navigation.scheduler';
import { PrismaModule } from '../prisma/prisma.module';
import { AlertsModule } from '../alerts/alerts.module';

@Module({
  imports: [PrismaModule, AlertsModule],
  controllers: [OncologyNavigationController],
  providers: [OncologyNavigationService, OncologyNavigationScheduler],
  exports: [OncologyNavigationService],
})
export class OncologyNavigationModule {}
