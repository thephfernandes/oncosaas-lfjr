import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class ProcessEmbeddedSignupDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  /** URL exata da página (origin + pathname). Usada na troca de código com a Meta. */
  @IsString()
  @IsOptional()
  redirect_uri?: string;
}
