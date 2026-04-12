import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ClinicalNoteType } from '@generated/prisma/client';
export class CreateClinicalNoteDto {
  @IsEnum(ClinicalNoteType)
  noteType!: ClinicalNoteType;

  /** Etapa de navegação: consulta especializada (MEDICAL) ou consulta de navegação (NURSING) */
  @IsUUID()
  navigationStepId!: string;

  @IsObject()
  sections!: Record<string, string>;
}

export class UpdateClinicalNoteDto {
  @IsObject()
  sections!: Record<string, string>;

  @IsOptional()
  @IsUUID()
  navigationStepId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  changeReason?: string;
}

export class AddendumClinicalNoteDto {
  @IsOptional()
  @IsObject()
  sections?: Record<string, string>;
}

export class VoidClinicalNoteDto {
  @IsString()
  @MaxLength(2000)
  voidReason!: string;
}
