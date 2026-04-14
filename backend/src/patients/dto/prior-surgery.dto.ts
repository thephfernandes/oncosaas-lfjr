import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  Max,
  MaxLength,
  IsInt,
} from 'class-validator';
import { IsPlainText } from '../../common/validators/is-plain-text.decorator';

export class PriorSurgeryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  @IsPlainText()
  procedureName: string;

  @IsInt()
  @IsOptional()
  @Min(1900)
  @Max(2100)
  year?: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @IsPlainText()
  institution?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  @IsPlainText()
  notes?: string;
}
