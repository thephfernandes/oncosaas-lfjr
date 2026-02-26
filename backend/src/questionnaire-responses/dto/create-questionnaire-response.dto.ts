import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ProcessedBy } from '@prisma/client';

export class CreateQuestionnaireResponseDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  questionnaireId: string;

  @IsObject()
  @IsNotEmpty()
  responses: Record<string, any>; // JSON com respostas estruturadas

  @IsUUID()
  @IsOptional()
  messageId?: string; // Se aplicado via WhatsApp

  @IsEnum(ProcessedBy)
  @IsOptional()
  appliedBy?: ProcessedBy; // AGENT ou NURSING
}
