import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ConsentService } from './consent.service';
import { CreateConsentDto } from './dto/create-consent.dto';
import { RevokeConsentDto } from './dto/revoke-consent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '@generated/prisma/client';

@Controller('patients/:patientId/consent')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class ConsentController {
  constructor(private readonly consentService: ConsentService) {}

  /**
   * Registra o consentimento (TCLE) de um paciente.
   * Roles: ADMIN, NURSE, ONCOLOGIST
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.ONCOLOGIST)
  create(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: CreateConsentDto,
    @CurrentUser() user: any,
    @Req() req: Request,
  ) {
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    return this.consentService.createConsent(
      patientId,
      dto,
      user.tenantId,
      ipAddress,
      userAgent,
    );
  }

  /**
   * Revoga o consentimento ativo de um paciente.
   * Role: ADMIN apenas.
   */
  @Delete()
  @Roles(UserRole.ADMIN)
  revoke(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Body() dto: RevokeConsentDto,
    @CurrentUser() user: any,
  ) {
    return this.consentService.revokeConsent(patientId, dto, user.tenantId);
  }

  /**
   * Consulta o status de consentimento de um paciente.
   * Roles: ADMIN, NURSE, ONCOLOGIST
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.NURSE, UserRole.ONCOLOGIST)
  getStatus(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @CurrentUser() user: any,
  ) {
    return this.consentService.getConsentStatus(patientId, user.tenantId);
  }
}
