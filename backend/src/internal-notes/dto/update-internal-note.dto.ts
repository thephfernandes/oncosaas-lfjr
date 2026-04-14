import { PartialType } from '@nestjs/mapped-types';
import { CreateInternalNoteDto } from './create-internal-note.dto';
import { IsString, IsOptional } from 'class-validator';
import { IsPlainText } from '../../common/validators/is-plain-text.decorator';

export class UpdateInternalNoteDto extends PartialType(CreateInternalNoteDto) {
  @IsString()
  @IsOptional()
  @IsPlainText()
  content?: string;
}
