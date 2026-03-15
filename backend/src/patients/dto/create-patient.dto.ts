import {
  IsString,
  IsEmail,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsPhoneNumber,
  MinLength,
  IsArray,
  ValidateNested,
  IsNumber,
  IsBoolean,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateCancerDiagnosisDto } from './create-cancer-diagnosis.dto';
import { FamilyHistoryDto } from './family-history.dto';
import {
  JourneyStage,
  ComorbidityType,
  ComorbiditySeverity,
  MedicationCategory,
} from '@prisma/client';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export enum CancerType {
  BREAST = 'breast',
  LUNG = 'lung',
  COLORECTAL = 'colorectal',
  PROSTATE = 'prostate',
  KIDNEY = 'kidney', // Câncer de Rim (Renal)
  BLADDER = 'bladder', // Câncer de Bexiga
  TESTICULAR = 'testicular', // Câncer de Testículo
  OTHER = 'other',
}

// DTO inline para comorbidade na criação de paciente (sem patientId/tenantId)
export class InlineComorbidityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(ComorbidityType)
  @IsOptional()
  type?: ComorbidityType;

  @IsEnum(ComorbiditySeverity)
  @IsOptional()
  severity?: ComorbiditySeverity;

  @IsBoolean()
  @IsOptional()
  controlled?: boolean;
}

// DTO inline para medicamento na criação de paciente (sem patientId/tenantId)
export class InlineMedicationDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  dosage?: string;

  @IsString()
  @IsOptional()
  frequency?: string;

  @IsString()
  @IsOptional()
  indication?: string;

  @IsEnum(MedicationCategory)
  @IsOptional()
  category?: MedicationCategory;
}

export class CreatePatientDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @IsString()
  @IsOptional()
  cpf?: string; // Criptografado (LGPD)

  @IsDateString()
  @IsNotEmpty()
  birthDate: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsPhoneNumber('BR')
  @IsNotEmpty()
  phone: string; // WhatsApp - Criptografado (LGPD)

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsEnum(CancerType)
  @IsOptional()
  cancerType?: CancerType;

  @IsString()
  @IsOptional()
  cancerSubtype?: string;

  @IsString()
  @IsOptional()
  stage?: string; // Ex: "IIIA", "IV"

  @IsDateString()
  @IsOptional()
  diagnosisDate?: string; // Data do diagnóstico

  @IsString()
  @IsOptional()
  currentTreatment?: string;

  @IsEnum(JourneyStage)
  @IsOptional()
  currentStage?: JourneyStage; // SCREENING, DIAGNOSIS, TREATMENT, FOLLOW_UP

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(4)
  performanceStatus?: number; // ECOG (0-4)

  @IsString()
  @IsOptional()
  ehrId?: string; // ID no sistema EHR externo

  @IsString()
  @IsOptional()
  ehrSystem?: string; // Nome do sistema EHR (ex: "Tasy", "MV")

  // Diagnósticos de câncer
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateCancerDiagnosisDto)
  cancerDiagnoses?: CreateCancerDiagnosisDto[];

  // Fatores de Risco
  @IsString()
  @IsOptional()
  smokingHistory?: string; // nunca fumou, ex-fumante, fumante atual (anos-maço)

  @IsString()
  @IsOptional()
  alcoholHistory?: string; // nunca, ocasional, moderado, pesado (g/dia)

  @IsString()
  @IsOptional()
  occupationalExposure?: string; // Exposições ocupacionais conhecidas

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => FamilyHistoryDto)
  familyHistory?: FamilyHistoryDto[];

  // Comorbidades inline (opcional na criação; também gerenciável via POST /patients/:id/comorbidities)
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InlineComorbidityDto)
  comorbidities?: InlineComorbidityDto[];

  // Medicamentos inline (opcional na criação; também gerenciável via POST /patients/:id/medications)
  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InlineMedicationDto)
  currentMedications?: InlineMedicationDto[];

  // Dias sem interação para disparar alerta NO_RESPONSE (null = padrão global 7)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(90)
  maxDaysWithoutInteractionAlert?: number;
}
