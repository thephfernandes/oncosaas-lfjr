import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExamResultComponentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  valueNumeric?: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  valueText?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  unit?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceRange?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isAbnormal?: boolean;
}

export class CreateComplementaryExamResultDto {
  @IsDateString()
  @IsNotEmpty()
  performedAt: string;

  @IsUUID()
  @IsOptional()
  collectionId?: string; // UUID para agrupar resultados da mesma coleta/pedido

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  valueNumeric?: number;

  @IsString()
  @IsOptional()
  valueText?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  referenceRange?: string;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isAbnormal?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  criticalHigh?: boolean; // Valor acima do limite crítico superior

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  criticalLow?: boolean; // Valor abaixo do limite crítico inferior

  @IsString()
  @IsOptional()
  report?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ExamResultComponentDto)
  components?: ExamResultComponentDto[];
}
