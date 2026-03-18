import { IsString, IsNotEmpty, IsBoolean, IsIn } from 'class-validator';

export class ComorbidityDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['leve', 'moderada', 'grave'])
  severity: string;

  @IsBoolean()
  controlled: boolean;
}