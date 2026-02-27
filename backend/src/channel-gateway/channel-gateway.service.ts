import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from '../gateways/messages.gateway';
import { WhatsAppChannel } from './channels/whatsapp.channel';
import {
  hashPhoneNumber,
  normalizePhoneNumber,
} from '../common/utils/phone.util';
import { OutgoingMessage, SendResult } from './interfaces/channel.interface';

@Injectable()
export class ChannelGatewayService {
  private readonly logger = new Logger(ChannelGatewayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly messagesGateway: MessagesGateway,
    private readonly whatsAppChannel: WhatsAppChannel
  ) {}

  /**
   * Process an incoming message from any channel.
   * 1. Find patient by phone hash
   * 2. Get or create active conversation
   * 3. Save message to DB
   * 4. Emit WebSocket event
   * 5. Forward to agent service for processing
   */
  async processIncomingMessage(
    phone: string,
    content: string,
    channel: ChannelType,
    externalMessageId: string,
    timestamp: Date,
    type: 'TEXT' | 'AUDIO' | 'IMAGE' | 'DOCUMENT' = 'TEXT',
    mediaUrl?: string,
    audioDuration?: number
  ) {
    // 1. Find patient by phone hash
    const normalizedPhone = normalizePhoneNumber(phone);
    const phoneHash = hashPhoneNumber(phone);

    const patient = await this.prisma.patient.findFirst({
      where: { phoneHash },
    });

    if (!patient) {
      this.logger.warn(
        `No patient found for phone hash. Normalized: ${normalizedPhone.substring(0, 5)}***`
      );
      return null;
    }

    const tenantId = patient.tenantId;

    // 2. Get or create active conversation
    const conversation = await this.getOrCreateConversation(
      patient.id,
      tenantId,
      channel
    );

    // 3. Save message
    const message = await this.prisma.message.create({
      data: {
        tenantId,
        patientId: patient.id,
        conversationId: conversation.id,
        channel,
        whatsappMessageId: externalMessageId,
        whatsappTimestamp: timestamp,
        type,
        direction: 'INBOUND',
        content,
        audioUrl: mediaUrl,
        audioDuration,
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    // 4. Update conversation metadata
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessageAt: new Date(),
        messageCount: { increment: 1 },
      },
    });

    // 5. Emit WebSocket event
    this.messagesGateway.emitNewMessage(tenantId, message);

    this.logger.log(
      `Incoming ${channel} message from patient ${patient.id} in conversation ${conversation.id}`
    );

    return {
      message,
      conversation,
      patient,
      tenantId,
    };
  }

  /**
   * Send a message to a patient via the appropriate channel
   */
  async sendMessage(
    patientId: string,
    tenantId: string,
    content: string,
    channel: ChannelType = ChannelType.WHATSAPP,
    conversationId?: string
  ): Promise<{ message: any; sendResult: SendResult }> {
    const patient = await this.prisma.patient.findFirst({
      where: { id: patientId, tenantId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient ${patientId} not found`);
    }

    const outgoing: OutgoingMessage = {
      to: normalizePhoneNumber(patient.phone),
      content,
      channel,
    };

    // Send via appropriate channel
    let sendResult: SendResult;
    switch (channel) {
      case ChannelType.WHATSAPP:
        sendResult = await this.whatsAppChannel.send(outgoing);
        break;
      default:
        sendResult = {
          success: false,
          error: `Channel ${channel} not yet implemented`,
        };
    }

    // Save outbound message
    const message = await this.prisma.message.create({
      data: {
        tenantId,
        patientId,
        conversationId,
        channel,
        whatsappMessageId: sendResult.externalMessageId || `out_${Date.now()}`,
        whatsappTimestamp: new Date(),
        type: 'TEXT',
        direction: 'OUTBOUND',
        content,
        processedBy: 'AGENT',
      },
      include: {
        patient: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    // Update conversation
    if (conversationId) {
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          messageCount: { increment: 1 },
        },
      });
    }

    // Emit WebSocket event
    this.messagesGateway.emitMessageSent(tenantId, message);

    return { message, sendResult };
  }

  /**
   * Get or create an active conversation for a patient on a channel
   */
  private async getOrCreateConversation(
    patientId: string,
    tenantId: string,
    channel: ChannelType
  ) {
    // Look for an existing active conversation
    const existing = await this.prisma.conversation.findFirst({
      where: {
        patientId,
        tenantId,
        channel,
        status: { in: ['ACTIVE', 'WAITING'] },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (existing) {
      return existing;
    }

    // Create new conversation
    return this.prisma.conversation.create({
      data: {
        tenantId,
        patientId,
        channel,
        status: 'ACTIVE',
        handledBy: 'AGENT',
        lastMessageAt: new Date(),
      },
    });
  }
}
