import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { ProcessedBy, Prisma } from '@generated/prisma/client';

export class CreateQuestionnaireResponseDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsNotEmpty()
  questionnaireId: string;

  @IsObject()
  @IsNotEmpty()
  responses: Prisma.InputJsonValue; // JSON com respostas estruturadas

  @IsUUID()
  @IsOptional()
  messageId?: string; // Se aplicado via WhatsApp

  /** Etapa de navegação associada (ex.: check-in alinhado a uma fase da jornada) */
  @IsUUID()
  @IsOptional()
  navigationStepId?: string;

  @IsEnum(ProcessedBy)
  @IsOptional()
  appliedBy?: ProcessedBy; // AGENT ou NURSING
}
