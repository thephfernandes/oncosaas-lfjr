import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OncologyNavigationService } from './oncology-navigation.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OncologyNavigationScheduler {
  private readonly logger = new Logger(OncologyNavigationScheduler.name);

  constructor(
    private readonly navigationService: OncologyNavigationService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Verifica etapas atrasadas diariamente às 6h da manhã
   * Executa para todos os tenants do sistema
   */
  @Cron(CronExpression.EVERY_DAY_AT_6AM)
  async handleOverdueStepsCheck() {
    this.logger.log('Iniciando verificação diária de etapas atrasadas...');

    try {
      // Obter todos os tenants ativos
      const tenants = await this.prisma.tenant.findMany({
        select: {
          id: true,
          name: true,
        },
      });

      this.logger.log(
        `Verificando etapas atrasadas para ${tenants.length} tenant(s)`
      );

      let totalChecked = 0;
      let totalMarkedOverdue = 0;
      let totalAlertsCreated = 0;

      for (const tenant of tenants) {
        try {
          const result = await this.navigationService.checkOverdueSteps(
            tenant.id
          );
          totalChecked += result.checked;
          totalMarkedOverdue += result.markedOverdue;
          totalAlertsCreated += result.alertsCreated;

          if (result.alertsCreated > 0) {
            this.logger.log(
              `Tenant ${tenant.name}: ${result.alertsCreated} alerta(s) criado(s) para ${result.markedOverdue} etapa(s) atrasada(s)`
            );
          }
        } catch (error) {
          this.logger.error(
            `Erro ao verificar etapas atrasadas para tenant ${tenant.name}:`,
            error
          );
        }
      }

      this.logger.log(
        `Verificação concluída: ${totalChecked} etapa(s) verificada(s), ${totalMarkedOverdue} marcada(s) como atrasada(s), ${totalAlertsCreated} alerta(s) criado(s)`
      );
    } catch (error) {
      this.logger.error(
        'Erro ao executar verificação de etapas atrasadas:',
        error
      );
    }
  }

  /**
   * Verifica etapas atrasadas a cada hora (para testes ou verificação mais frequente)
   * Pode ser desabilitado em produção se preferir apenas verificação diária
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlyOverdueStepsCheck() {
    // Habilitado para verificação mais frequente durante desenvolvimento
    // Comentar em produção se preferir apenas verificação diária
    this.logger.log('Verificação horária de etapas atrasadas...');
    await this.handleOverdueStepsCheck();
  }
}
