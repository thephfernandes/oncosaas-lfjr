import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class RevokeConsentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  version: string;
}
