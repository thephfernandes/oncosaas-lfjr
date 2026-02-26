import { Module } from '@nestjs/common';
import { QuestionnaireResponsesController } from './questionnaire-responses.controller';
import { QuestionnaireResponsesService } from './questionnaire-responses.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QuestionnaireResponsesController],
  providers: [QuestionnaireResponsesService],
  exports: [QuestionnaireResponsesService],
})
export class QuestionnaireResponsesModule {}
