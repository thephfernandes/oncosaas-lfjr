import {
  IsBoolean,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProtocolDto {
  @IsString()
  @IsNotEmpty()
  cancerType: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  version?: string;

  @IsObject()
  definition: Record<string, any>;

  @IsObject()
  checkInRules: Record<string, any>;

  @IsObject()
  criticalSymptoms: Record<string, any>;
}

export class UpdateProtocolDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsObject()
  @IsOptional()
  definition?: Record<string, any>;

  @IsObject()
  @IsOptional()
  checkInRules?: Record<string, any>;

  @IsObject()
  @IsOptional()
  criticalSymptoms?: Record<string, any>;
}
