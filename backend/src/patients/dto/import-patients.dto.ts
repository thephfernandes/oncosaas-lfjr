import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsEnum,
  IsEmail,
  IsPhoneNumber,
  MinLength,
} from 'class-validator';
import { Gender, CancerType } from './create-patient.dto';
import { JourneyStage } from '@prisma/client';

export class ImportPatientRowDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsNotEmpty()
  cpf: string;

  @IsDateString()
  @IsNotEmpty()
  dataNascimento: string;

  @IsEnum(Gender)
  @IsNotEmpty()
  sexo: Gender;

  @IsPhoneNumber('BR')
  @IsOptional()
  telefone?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(CancerType)
  @IsNotEmpty()
  tipoCancer: CancerType;

  @IsDateString()
  @IsNotEmpty()
  dataDiagnostico: string;

  @IsString()
  @IsOptional()
  estagio?: string;

  @IsString()
  @IsOptional()
  oncologistaResponsavel?: string;
}

export class ImportPatientsDto {
  @IsNotEmpty()
  patients: ImportPatientRowDto[];
}