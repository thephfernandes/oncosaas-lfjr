import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateInternalNoteDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
