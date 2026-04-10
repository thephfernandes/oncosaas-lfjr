import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsEnum,
  IsOptional,
  IsBoolean,
  ValidateIf,
} from 'class-validator';
import { ClinicalSubrole, UserRole } from '@generated/prisma/client';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;

  /// COORDINATOR ou ADMIN — define competência para evoluções de enfermagem vs médica no prontuário
  @ValidateIf(
    (o: CreateUserDto) =>
      o.role === UserRole.COORDINATOR || o.role === UserRole.ADMIN
  )
  @IsOptional()
  @IsEnum(ClinicalSubrole)
  clinicalSubrole?: ClinicalSubrole | null;

  @IsOptional()
  @IsBoolean()
  mfaEnabled?: boolean;
}
