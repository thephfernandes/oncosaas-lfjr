import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
  UnauthorizedException,
  UseGuards,
  Request,
  Req,
  Res,
} from '@nestjs/common';
import type { Request as ExpressRequest, Response } from 'express';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsOptional,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterInstitutionDto } from './dto/register-institution.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { RolesGuard } from './guards/roles.guard';
import { UserRole } from '@generated/prisma/client';
import {
  REFRESH_TOKEN_COOKIE,
  clearAccessTokenCookie,
  clearRefreshTokenCookie,
  setAccessTokenCookie,
  setRefreshTokenCookie,
} from './auth-cookies.util';
import { extractAccessJwtFromHttpRequest } from '@/common/utils/http-jwt.extractor';

class RefreshDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  refresh_token?: string;
}

class ForgotPasswordDto {
  @IsEmail()
  email: string;
}

class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class UpdateTenantSettingsDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  enabledCancerTypes: string[];
}

class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  currentPassword?: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Headers('x-tenant-id') headerTenantId: string | undefined,
    @Res({ passthrough: true }) res: Response
  ) {
    const tenantId = loginDto.tenantId || headerTenantId;
    const result = await this.authService.login(loginDto, tenantId);
    setRefreshTokenCookie(res, result.refresh_token);
    setAccessTokenCookie(res, result.access_token);
    return {
      user: result.user,
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() req: ExpressRequest,
    @Body() body: RefreshDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const fromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    const refreshToken = fromCookie || body.refresh_token;
    if (!refreshToken) {
      throw new UnauthorizedException('refresh_token é obrigatório');
    }
    const result = await this.authService.refresh(refreshToken);
    setRefreshTokenCookie(res, result.refresh_token);
    setAccessTokenCookie(res, result.access_token);
    return {};
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Req() req: ExpressRequest,
    @Body() body: Partial<RefreshDto>,
    @Res({ passthrough: true }) res: Response
  ) {
    const fromCookie = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;
    const refreshToken = fromCookie || body.refresh_token || '';
    await this.authService.logout(refreshToken);
    clearRefreshTokenCookie(res);
    clearAccessTokenCookie(res);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(@Body() body: ForgotPasswordDto) {
    await this.authService.forgotPassword(body.email);
    return {
      message: 'Se o email existir, você receberá um link de redefinição.',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(@Body() body: ResetPasswordDto) {
    await this.authService.resetPassword(body.token, body.password);
    return { message: 'Senha redefinida com sucesso.' };
  }

  /**
   * Emite ticket de uso único (Redis) para o handshake Socket.io quando o cookie
   * HttpOnly não chega à porta do Nest (API relativa no Next).
   */
  @Post('socket-ticket')
  @HttpCode(HttpStatus.OK)
  async socketTicket(@Req() req: ExpressRequest) {
    const token = extractAccessJwtFromHttpRequest(req);
    if (!token) {
      throw new UnauthorizedException();
    }
    const ticket = await this.authService.issueSocketTicket(token);
    return { ticket };
  }

  @Get('profile')
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user?.id ?? req.user?.sub);
  }

  @Patch('profile')
  async updateProfile(@Body() body: UpdateProfileDto, @Request() req) {
    return this.authService.updateProfile(req.user?.id ?? req.user?.sub, body);
  }

  @Patch('tenant-settings')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ONCOLOGIST, UserRole.NURSE_CHIEF, UserRole.COORDINATOR)
  async updateTenantSettings(
    @Body() body: UpdateTenantSettingsDto,
    @Request() req,
  ) {
    return this.authService.updateTenantSettings(
      req.user?.tenantId,
      body.enabledCancerTypes,
    );
  }

  @Public()
  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('register-institution')
  @HttpCode(HttpStatus.CREATED)
  async registerInstitution(
    @Body() dto: RegisterInstitutionDto,
    @Res({ passthrough: true }) res: Response
  ) {
    const result = await this.authService.registerInstitution(dto);
    setRefreshTokenCookie(res, result.refresh_token);
    setAccessTokenCookie(res, result.access_token);
    return {
      user: result.user,
    };
  }
}
