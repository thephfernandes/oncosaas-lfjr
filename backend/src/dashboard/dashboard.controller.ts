import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole, JourneyStage } from '@prisma/client';
import { DashboardMetricsDto } from './dto/dashboard-metrics.dto';
import { DashboardStatisticsDto } from './dto/dashboard-statistics.dto';
import { NurseMetricsDto } from './dto/nurse-metrics.dto';
import { NavigationMetricsDto } from './dto/navigation-metrics.dto';
import { PatientWithCriticalStepDto } from './dto/patients-with-critical-steps.dto';
import { PendingAlertDto } from './dto/pending-alert.dto';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, TenantGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @Roles(UserRole.ONCOLOGIST, UserRole.ADMIN, UserRole.COORDINATOR)
  async getMetrics(@CurrentUser() user: any): Promise<DashboardMetricsDto> {
    return this.dashboardService.getMetrics(user.tenantId);
  }

  @Get('statistics')
  @Roles(UserRole.ONCOLOGIST, UserRole.ADMIN, UserRole.COORDINATOR)
  async getStatistics(
    @CurrentUser() user: any,
    @Query('period') period?: '7d' | '30d' | '90d'
  ): Promise<DashboardStatisticsDto> {
    return this.dashboardService.getStatistics(user.tenantId, period || '7d');
  }

  @Get('nurse-metrics')
  @Roles(
    UserRole.NURSE,
    UserRole.NURSE_CHIEF,
    UserRole.COORDINATOR,
    UserRole.ADMIN,
    UserRole.ONCOLOGIST
  )
  async getNurseMetrics(@CurrentUser() user: any): Promise<NurseMetricsDto> {
    // Roles de gestão (ADMIN, ONCOLOGIST, COORDINATOR) veem métricas agregadas
    // de toda a equipe; enfermeiros veem apenas suas próprias métricas.
    const isNurseRole =
      user.role === UserRole.NURSE || user.role === UserRole.NURSE_CHIEF;
    return this.dashboardService.getNurseMetrics(
      user.tenantId,
      isNurseRole ? user.id : null,
    );
  }

  @Get('navigation-metrics')
  @Roles(
    UserRole.NURSE,
    UserRole.NURSE_CHIEF,
    UserRole.COORDINATOR,
    UserRole.ADMIN,
    UserRole.ONCOLOGIST
  )
  async getNavigationMetrics(
    @CurrentUser() user: any
  ): Promise<NavigationMetricsDto> {
    return this.dashboardService.getNavigationMetrics(user.tenantId);
  }

  @Get('patients-with-critical-steps')
  @Roles(
    UserRole.ONCOLOGIST,
    UserRole.ADMIN,
    UserRole.COORDINATOR,
    UserRole.NURSE,
    UserRole.NURSE_CHIEF
  )
  async getPatientsWithCriticalSteps(
    @CurrentUser() user: any,
    @Query('journeyStage') journeyStage?: JourneyStage,
    @Query('cancerType') cancerType?: string,
    @Query('maxResults') maxResults?: string,
    @Query('overdueOnly') overdueOnly?: string
  ): Promise<PatientWithCriticalStepDto[]> {
    // Validar e converter maxResults com fallback seguro
    let parsedMaxResults: number | undefined;
    if (maxResults) {
      const parsed = parseInt(maxResults, 10);
      parsedMaxResults =
        !isNaN(parsed) && parsed > 0 ? Math.min(parsed, 100) : undefined;
    }

    return this.dashboardService.getPatientsWithCriticalSteps(user.tenantId, {
      journeyStage,
      cancerType,
      maxResults: parsedMaxResults,
      overdueOnly: overdueOnly === 'true',
    });
  }

  @Get('pending-alerts')
  @Roles(
    UserRole.ONCOLOGIST,
    UserRole.ADMIN,
    UserRole.COORDINATOR,
    UserRole.NURSE,
    UserRole.NURSE_CHIEF
  )
  async getPendingAlerts(
    @CurrentUser() user: any,
    @Query('maxResults') maxResults?: string
  ): Promise<PendingAlertDto[]> {
    if (!user?.tenantId) {return [];}
    const parsed = maxResults
      ? Math.min(Math.max(1, parseInt(maxResults, 10) || 100), 200)
      : 100;
    return this.dashboardService.getPendingAlerts(user.tenantId, parsed);
  }

  @Get('patients-by-indicator')
  @Roles(
    UserRole.ONCOLOGIST,
    UserRole.ADMIN,
    UserRole.COORDINATOR,
    UserRole.NURSE,
    UserRole.NURSE_CHIEF
  )
  async getPatientsByIndicator(
    @CurrentUser() user: any,
    @Query('indicator') indicator: string | undefined,
    @Query('maxResults') maxResults?: string
  ) {
    const parsedMaxResults = maxResults
      ? Math.min(Math.max(1, parseInt(maxResults, 10) || 100), 200)
      : 100;
    const normalized =
      typeof indicator === 'string' ? indicator.trim().toLowerCase() : '';
    const validIndicator = ['alerts', 'messages', 'biomarkers'].includes(
      normalized
    )
      ? (normalized as 'alerts' | 'messages' | 'biomarkers')
      : null;
    if (!validIndicator || !user?.tenantId) {
      return [];
    }
    return this.dashboardService.getPatientsByIndicator(
      user.tenantId,
      validIndicator,
      parsedMaxResults
    );
  }
}
