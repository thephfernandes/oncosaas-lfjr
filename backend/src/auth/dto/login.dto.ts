import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  IsUUID,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  /**
   * ID do tenant (opcional no DTO, mas recomendado para ambientes multi-tenant)
   * Se não fornecido, o sistema tentará encontrar o usuário apenas pelo email.
   * ATENÇÃO: Se o mesmo email existir em múltiplos tenants, isso pode causar ambiguidade.
   */
  @IsOptional()
  @IsUUID()
  tenantId?: string;
}
