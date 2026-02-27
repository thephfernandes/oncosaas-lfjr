import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewaysModule } from '../gateways/gateways.module';
import { ChannelGatewayController } from './channel-gateway.controller';
import { ChannelGatewayService } from './channel-gateway.service';
import { WhatsAppChannel } from './channels/whatsapp.channel';

@Module({
  imports: [PrismaModule, GatewaysModule],
  controllers: [ChannelGatewayController],
  providers: [ChannelGatewayService, WhatsAppChannel],
  exports: [ChannelGatewayService, WhatsAppChannel],
})
export class ChannelGatewayModule {}
