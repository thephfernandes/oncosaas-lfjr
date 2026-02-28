import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { ChannelGatewayService } from '../channel-gateway/channel-gateway.service';
import { ScheduledActionStatus } from '@prisma/client';

@Injectable()
export class AgentSchedulerService {
  private readonly logger = new Logger(AgentSchedulerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly channelGateway: ChannelGatewayService
  ) {}

  /**
   * Every minute: check for due scheduled actions and execute them
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async executeScheduledActions() {
    const now = new Date();

    const dueActions = await this.prisma.scheduledAction.findMany({
      where: {
        status: ScheduledActionStatus.PENDING,
        scheduledAt: { lte: now },
      },
      take: 50, // Process in batches
      orderBy: { scheduledAt: 'asc' },
    });

    if (dueActions.length === 0) {
      return;
    }

    this.logger.log(`Processing ${dueActions.length} due scheduled actions`);

    for (const action of dueActions) {
      try {
        // Mark as executing
        await this.prisma.scheduledAction.update({
          where: { id: action.id },
          data: { status: ScheduledActionStatus.EXECUTING },
        });

        switch (action.actionType) {
          case 'CHECK_IN':
            await this.executeCheckIn(action);
            break;
          case 'QUESTIONNAIRE':
            await this.executeQuestionnaire(action);
            break;
          case 'MEDICATION_REMINDER':
          case 'APPOINTMENT_REMINDER':
            await this.executeReminder(action);
            break;
          case 'FOLLOW_UP':
            await this.executeFollowUp(action);
            break;
          default:
            this.logger.warn(
              `No handler for action type: ${action.actionType}`
            );
        }

        // Mark as completed
        await this.prisma.scheduledAction.update({
          where: { id: action.id },
          data: {
            status: ScheduledActionStatus.COMPLETED,
            executedAt: new Date(),
          },
        });

        // Handle recurrence
        if (action.isRecurring && action.recurrenceRule) {
          await this.scheduleNextOccurrence(action);
        }
      } catch (error) {
        this.logger.error(
          `Failed to execute scheduled action ${action.id}`,
          error
        );

        const retryCount = action.retryCount + 1;
        await this.prisma.scheduledAction.update({
          where: { id: action.id },
          data: {
            status:
              retryCount >= action.maxRetries
                ? ScheduledActionStatus.FAILED
                : ScheduledActionStatus.PENDING,
            retryCount,
            lastError: error instanceof Error ? error.message : 'Unknown error',
            // Exponential backoff for retries
            scheduledAt:
              retryCount < action.maxRetries
                ? new Date(Date.now() + Math.pow(2, retryCount) * 60000)
                : undefined,
          },
        });
      }
    }
  }

  private async executeCheckIn(action: any) {
    const payload = action.payload as any;
    const message =
      payload?.message ||
      'Olá! Como você está se sentindo hoje? Algum sintoma novo ou preocupação?';

    await this.channelGateway.sendMessage(
      action.patientId,
      action.tenantId,
      message,
      action.channel,
      action.conversationId
    );
  }

  private async executeQuestionnaire(action: any) {
    const payload = action.payload as any;
    const message =
      payload?.message ||
      'Hora do nosso acompanhamento! Vou fazer algumas perguntas sobre como você está se sentindo. Podemos começar?';

    await this.channelGateway.sendMessage(
      action.patientId,
      action.tenantId,
      message,
      action.channel,
      action.conversationId
    );
  }

  private async executeReminder(action: any) {
    const payload = action.payload as any;
    const message =
      payload?.message || 'Lembrete: você tem um compromisso agendado.';

    await this.channelGateway.sendMessage(
      action.patientId,
      action.tenantId,
      message,
      action.channel,
      action.conversationId
    );
  }

  private async executeFollowUp(action: any) {
    const payload = action.payload as any;
    const message =
      payload?.message ||
      'Olá! Estamos fazendo o acompanhamento. Como você tem se sentido desde a última consulta?';

    await this.channelGateway.sendMessage(
      action.patientId,
      action.tenantId,
      message,
      action.channel,
      action.conversationId
    );
  }

  /**
   * Schedule the next occurrence of a recurring action
   */
  private async scheduleNextOccurrence(action: any) {
    const rule = action.recurrenceRule;
    let nextDate: Date | null = null;

    // Simple recurrence rules
    const now = new Date();
    switch (rule) {
      case 'daily':
        nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'twice_weekly':
        nextDate = new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        nextDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'biweekly':
        nextDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        nextDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        this.logger.warn(`Unknown recurrence rule: ${rule}`);
        return;
    }

    if (nextDate) {
      await this.prisma.scheduledAction.create({
        data: {
          tenantId: action.tenantId,
          patientId: action.patientId,
          conversationId: action.conversationId,
          actionType: action.actionType,
          channel: action.channel,
          scheduledAt: nextDate,
          payload: action.payload,
          isRecurring: true,
          recurrenceRule: rule,
          status: ScheduledActionStatus.PENDING,
        },
      });
    }
  }
}
