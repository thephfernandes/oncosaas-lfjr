import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Request,
  UseGuards,
  ParseUUIDPipe,
  Logger,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantGuard } from '../auth/guards/tenant.guard';
import { ConversationService } from './conversation.service';
import { DecisionGateService } from './decision-gate.service';
import { AgentService } from './agent.service';
import { ApproveDecisionDto } from './dto/agent-response.dto';
import { ConversationStatus, ChannelType } from '@prisma/client';

@Controller('agent')
@UseGuards(JwtAuthGuard, TenantGuard)
export class AgentController {
  private readonly logger = new Logger(AgentController.name);

  constructor(
    private readonly conversationService: ConversationService,
    private readonly decisionGateService: DecisionGateService,
    private readonly agentService: AgentService
  ) {}

  // ==========================================
  // CONVERSATIONS
  // ==========================================

  @Get('conversations')
  async listConversations(
    @Request() req: any,
    @Query('status') status?: ConversationStatus,
    @Query('channel') channel?: ChannelType,
    @Query('patientId') patientId?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset?: number
  ) {
    return this.conversationService.findAll(req.user.tenantId, {
      status,
      channel,
      patientId,
      limit: Math.min(limit || 50, 100),
      offset,
    });
  }

  @Get('conversations/:id')
  async getConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    return this.conversationService.findOne(id, req.user.tenantId);
  }

  @Get('conversations/:id/history')
  async getConversationHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number
  ) {
    // Verify conversation belongs to tenant
    await this.conversationService.findOne(id, req.user.tenantId);
    return this.conversationService.getRecentHistory(
      id,
      Math.min(limit || 50, 200)
    );
  }

  @Patch('conversations/:id/escalate')
  async escalateConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    return this.conversationService.escalateToNursing(
      id,
      req.user.tenantId,
      req.user.sub
    );
  }

  @Patch('conversations/:id/return-to-agent')
  async returnToAgent(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    return this.conversationService.returnToAgent(id, req.user.tenantId);
  }

  @Patch('conversations/:id/close')
  async closeConversation(
    @Param('id', ParseUUIDPipe) id: string,
    @Request() req: any
  ) {
    return this.conversationService.close(id, req.user.tenantId);
  }

  // ==========================================
  // CLINICAL CONTEXT
  // ==========================================

  @Get('patients/:patientId/clinical-context')
  async getClinicalContext(
    @Param('patientId', ParseUUIDPipe) patientId: string,
    @Request() req: any
  ) {
    return this.agentService.buildClinicalContext(patientId, req.user.tenantId);
  }

  // ==========================================
  // DECISIONS
  // ==========================================

  @Get('decisions/pending')
  async getPendingDecisions(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number
  ) {
    return this.decisionGateService.getPendingDecisions(
      req.user.tenantId,
      Math.min(limit || 50, 100)
    );
  }

  @Post('decisions/:id/approve')
  async approveDecision(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ApproveDecisionDto,
    @Request() req: any
  ) {
    if (dto.approved) {
      return this.decisionGateService.approveDecision(
        id,
        req.user.tenantId,
        req.user.sub
      );
    }
    return this.decisionGateService.rejectDecision(
      id,
      req.user.tenantId,
      req.user.sub,
      dto.rejectionReason || 'Rejected'
    );
  }
}
