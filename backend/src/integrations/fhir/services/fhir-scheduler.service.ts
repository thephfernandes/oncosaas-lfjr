import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { FHIRConfigService } from './fhir-config.service';
import { FHIRSyncService } from './fhir-sync.service';

@Injectable()
export class FHIRSchedulerService {
  private readonly logger = new Logger(FHIRSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: FHIRConfigService,
    private readonly syncService: FHIRSyncService
  ) {}

  /**
   * Sincronização periódica de observações não sincronizadas
   * Executa a cada hora
   */
  @Cron(CronExpression.EVERY_HOUR)
  async syncUnsyncedObservations() {
    this.logger.log('Iniciando sincronização periódica de observações...');

    // Buscar todos os tenants
    const tenants = await this.prisma.tenant.findMany({
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        const config = await this.configService.getConfig(tenant.id);

        if (!config || !config.enabled) {
          continue; // Pular se integração não habilitada
        }

        // Push local → EHR: apenas push ou bidirectional
        if (
          config.syncDirection === 'push' ||
          config.syncDirection === 'bidirectional'
        ) {
          await this.syncService.syncUnsyncedObservations(config, 50);
        }
      } catch (error) {
        this.logger.error(
          `Erro ao sincronizar observações do tenant ${tenant.id}`,
          error
        );
      }
    }

    this.logger.log('Sincronização periódica concluída');
  }

  /**
   * Pull periódico de observações do EHR
   * Executa a cada 6 horas
   */
  @Cron(CronExpression.EVERY_6_HOURS)
  async pullObservationsFromEHR() {
    this.logger.log('Iniciando pull periódico de observações do EHR...');

    const tenants = await this.prisma.tenant.findMany({
      select: { id: true },
    });

    for (const tenant of tenants) {
      try {
        const config = await this.configService.getConfig(tenant.id);

        if (!config || !config.enabled) {
          continue;
        }

        // Pull apenas se configurado para pull ou bidirectional
        if (
          config.syncDirection === 'pull' ||
          config.syncDirection === 'bidirectional'
        ) {
          // Buscar pacientes com ehrPatientId
          const patients = await this.prisma.patient.findMany({
            where: {
              tenantId: tenant.id,
              ehrPatientId: { not: null },
            },
            select: { id: true },
            take: 100, // Limitar para não sobrecarregar
          });

          for (const patient of patients) {
            try {
              await this.syncService.pullObservationsFromEHR(
                config,
                patient.id
              );
            } catch (error) {
              this.logger.error(
                `Erro ao fazer pull de observações do paciente ${patient.id}`,
                error
              );
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `Erro no pull periódico do tenant ${tenant.id}`,
          error
        );
      }
    }

    this.logger.log('Pull periódico concluído');
  }
}
