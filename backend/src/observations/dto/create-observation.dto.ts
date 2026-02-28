import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateObservationDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsUUID()
  @IsOptional()
  messageId?: string; // Origem da observação (mensagem WhatsApp)

  // FHIR Resource
  @IsString()
  @IsNotEmpty()
  code: string; // LOINC code (ex: "72514-3" para Pain severity)

  @IsString()
  @IsNotEmpty()
  display: string; // Descrição legível

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  valueQuantity?: number; // Valor numérico

  @IsString()
  @IsOptional()
  valueString?: string; // Valor textual

  @IsString()
  @IsOptional()
  unit?: string; // Unidade de medida

  // Metadados FHIR
  @IsDateString()
  @IsNotEmpty()
  effectiveDateTime: string; // Quando foi coletado

  @IsString()
  @IsOptional()
  status?: string; // Default: "final"

  // Sincronização EHR
  @IsString()
  @IsOptional()
  fhirResourceId?: string; // ID no FHIR server externo
}
