import {
  IsEmail,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ClinicalSubrole, UserRole } from '@generated/prisma/client';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  password?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  /// COORDINATOR ou ADMIN — competência clínica no prontuário (enfermagem vs médica)
  @IsOptional()
  @IsEnum(ClinicalSubrole)
  clinicalSubrole?: ClinicalSubrole | null;

  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean;
}
