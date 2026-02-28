import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ClinicalProtocolsController } from './clinical-protocols.controller';
import { ClinicalProtocolsService } from './clinical-protocols.service';

@Module({
  imports: [PrismaModule],
  controllers: [ClinicalProtocolsController],
  providers: [ClinicalProtocolsService],
  exports: [ClinicalProtocolsService],
})
export class ClinicalProtocolsModule {}
