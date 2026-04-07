import { IsOptional, IsString, MaxLength } from 'class-validator';

export class SoftDeleteComplementaryExamResultDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}

