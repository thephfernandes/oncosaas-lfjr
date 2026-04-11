import { IsEnum, IsNotEmpty, IsOptional, IsString, ValidateIf } from 'class-validator';

export type SuggestionAction = 'ACCEPT' | 'REJECT' | 'EDIT';

export class UpdateSuggestionDto {
  @IsEnum(['ACCEPT', 'REJECT', 'EDIT'])
  @IsNotEmpty()
  action: SuggestionAction;

  @ValidateIf((o) => o.action === 'EDIT')
  @IsString()
  @IsNotEmpty({ message: 'editedText é obrigatório quando action é EDIT' })
  @IsOptional()
  editedText?: string;
}
