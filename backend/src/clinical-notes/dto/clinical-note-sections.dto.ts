import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';
import { ClinicalNoteType } from '@generated/prisma/client';
export class CreateClinicalNoteDto {
  @IsEnum(ClinicalNoteType)
  noteType!: ClinicalNoteType;

  @IsObject()
  sections!: Record<string, string>;
}

export class UpdateClinicalNoteDto {
  @IsObject()
  sections!: Record<string, string>;

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
