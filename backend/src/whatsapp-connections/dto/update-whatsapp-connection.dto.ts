import { PartialType } from '@nestjs/mapped-types';
import { CreateWhatsAppConnectionDto } from './create-whatsapp-connection.dto';
import { IsOptional, IsBoolean } from 'class-validator';

export class UpdateWhatsAppConnectionDto extends PartialType(
  CreateWhatsAppConnectionDto
) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
