import { PartialType } from '@nestjs/mapped-types';
import { CreateInternalNoteDto } from './create-internal-note.dto';
import { IsString, IsOptional } from 'class-validator';

export class UpdateInternalNoteDto extends PartialType(CreateInternalNoteDto) {
  @IsString()
  @IsOptional()
  content?: string;
}
