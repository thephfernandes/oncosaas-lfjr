import { Module, forwardRef } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PrismaModule } from '../prisma/prisma.module';
import { OncologyNavigationModule } from '../oncology-navigation/oncology-navigation.module';

@Module({
  imports: [PrismaModule, forwardRef(() => OncologyNavigationModule)],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}