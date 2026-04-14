import {
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsDateString,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IsPlainText } from '../../common/validators/is-plain-text.decorator';

export class CreatePerformanceStatusDto {
  @IsInt()
  @Min(0)
  @Max(4)
  @Type(() => Number)
  ecogScore: number;

  @IsDateString()
  @IsOptional()
  assessedAt?: string;

  @IsString()
  @IsOptional()
  assessedBy?: string;

  @IsString()
  @IsOptional()
  @IsIn(['MANUAL', 'AGENT', 'QUESTIONNAIRE'])
  source?: string;

  @IsString()
  @IsOptional()
  @IsPlainText()
  notes?: string;
}
