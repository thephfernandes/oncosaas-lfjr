import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsObject,
  IsArray,
} from 'class-validator';
import { JourneyStage, NavigationStepStatus } from '@generated/prisma/client';
import { IsPlainText } from '../../common/validators/is-plain-text.decorator';

export class UpdateNavigationStepDto {
  @IsEnum(NavigationStepStatus)
  @IsOptional()
  status?: NavigationStepStatus;

  @IsBoolean()
  @IsOptional()
  isCompleted?: boolean;

  @IsDateString()
  @IsOptional()
  completedAt?: string;

  @IsString()
  @IsOptional()
  completedBy?: string;

  @IsDateString()
  @IsOptional()
  actualDate?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string; // Data limite para gerar alarmes de atraso

  @IsString()
  @IsOptional()
  @IsPlainText()
  institutionName?: string; // Instituição de saúde onde foi realizada

  @IsString()
  @IsOptional()
  @IsPlainText()
  professionalName?: string; // Profissional que realizou

  @IsString()
  @IsOptional()
  @IsPlainText()
  result?: string; // Resultado da etapa

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @IsPlainText({ each: true })
  findings?: string[]; // Lista de achados/alterações

  @IsObject()
  @IsOptional()
  metadata?: any;

  @IsString()
  @IsOptional()
  @IsPlainText()
  notes?: string;

  /** Alterar fase da jornada (ex.: arrastar etapa para outra coluna). Limpa dependências e prazos relativos. */
  @IsEnum(JourneyStage)
  @IsOptional()
  journeyStage?: JourneyStage;
}