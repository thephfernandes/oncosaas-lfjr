import { IsString, IsNotEmpty, IsUUID } from 'class-validator';
import { IsPlainText } from '../../common/validators/is-plain-text.decorator';

export class CreateInternalNoteDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsString()
  @IsNotEmpty()
  @IsPlainText()
  content: string;
}
