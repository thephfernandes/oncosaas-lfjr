import { Module, forwardRef } from '@nestjs/common';
import { ObservationsService } from './observations.service';
import { ObservationsController } from './observations.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { FHIRModule } from '../integrations/fhir/fhir.module';

@Module({
  imports: [PrismaModule, forwardRef(() => FHIRModule)],
  controllers: [ObservationsController],
  providers: [ObservationsService],
  exports: [ObservationsService],
})
export class ObservationsModule {}
