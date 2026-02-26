import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { FHIRAuthService } from './services/fhir-auth.service';
import { FHIRClientService } from './services/fhir-client.service';
import { FHIRTransformerService } from './services/fhir-transformer.service';
import { FHIRSyncService } from './services/fhir-sync.service';
import { FHIRConfigService } from './services/fhir-config.service';
import { FHIRSchedulerService } from './services/fhir-scheduler.service';
import { FHIRController } from './fhir.controller';
import { FHIRConfigController } from './fhir-config.controller';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [FHIRController, FHIRConfigController],
  providers: [
    FHIRAuthService,
    FHIRClientService,
    FHIRTransformerService,
    FHIRSyncService,
    FHIRConfigService,
    FHIRSchedulerService,
  ],
  exports: [
    FHIRAuthService,
    FHIRClientService,
    FHIRTransformerService,
    FHIRSyncService,
    FHIRConfigService,
    FHIRSchedulerService,
  ],
})
export class FHIRModule {}
