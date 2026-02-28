import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Logger,
  RawBodyRequest,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../auth/decorators/public.decorator';
import { ChannelGatewayService } from './channel-gateway.service';
import { WhatsAppChannel } from './channels/whatsapp.channel';

@Controller('channel-gateway')
export class ChannelGatewayController {
  private readonly logger = new Logger(ChannelGatewayController.name);

  constructor(
    private readonly gatewayService: ChannelGatewayService,
    private readonly whatsAppChannel: WhatsAppChannel,
    private readonly configService: ConfigService
  ) {}

  /**
   * WhatsApp webhook verification (GET)
   * Meta sends a GET request to verify the webhook URL
   */
  @Get('webhook/whatsapp')
  @Public()
  verifyWhatsAppWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response
  ) {
    const verifyToken =
      this.configService.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN') ||
      'onconav-webhook-verify';

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('WhatsApp webhook verified successfully');
      return res.status(200).send(challenge);
    }

    this.logger.warn('WhatsApp webhook verification failed');
    return res.status(403).send('Forbidden');
  }

  /**
   * WhatsApp webhook receiver (POST)
   * Receives incoming messages from Meta
   */
  @Post('webhook/whatsapp')
  @Public()
  @HttpCode(HttpStatus.OK)
  async handleWhatsAppWebhook(
    @Body() body: any,
    @Req() req: RawBodyRequest<Request>
  ) {
    // Validate webhook signature in production
    const signature = req.headers['x-hub-signature-256'] as string;
    if (signature && req.rawBody) {
      const isValid = this.whatsAppChannel.validateWebhookSignature(
        req.rawBody,
        signature
      );
      if (!isValid) {
        this.logger.warn('Invalid WhatsApp webhook signature');
        return { status: 'invalid_signature' };
      }
    }

    // Parse incoming messages
    const messages = this.whatsAppChannel.parseWebhookPayload(body);

    if (messages.length === 0) {
      // Could be a status update, just acknowledge
      return { status: 'ok' };
    }

    // Process each message
    for (const msg of messages) {
      try {
        const result = await this.gatewayService.processIncomingMessage(
          msg.phone,
          msg.content,
          'WHATSAPP',
          msg.messageId,
          msg.timestamp,
          msg.type,
          msg.mediaUrl
        );

        if (!result) {
          this.logger.warn(`No patient found for phone from WhatsApp message`);
        }
      } catch (error) {
        this.logger.error(
          `Error processing WhatsApp message ${msg.messageId}`,
          error instanceof Error ? error.stack : error
        );
      }
    }

    return { status: 'ok' };
  }
}
