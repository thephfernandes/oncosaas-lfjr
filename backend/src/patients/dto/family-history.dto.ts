import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class FamilyHistoryDto {
  @IsString()
  @IsNotEmpty()
  relationship: string;

  @IsString()
  @IsNotEmpty()
  cancerType: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  ageAtDiagnosis?: number;
}