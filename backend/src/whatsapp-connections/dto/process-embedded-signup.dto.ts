import { IsString, IsNotEmpty } from 'class-validator';

export class ProcessEmbeddedSignupDto {
  @IsString()
  @IsNotEmpty()
  code: string; // Código trocável retornado pelo Embedded Signup
}
