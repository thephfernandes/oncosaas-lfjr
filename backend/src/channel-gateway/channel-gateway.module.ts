import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewaysModule } from '../gateways/gateways.module';
import { AgentModule } from '../agent/agent.module';
import { ChannelGatewayController } from './channel-gateway.controller';
import { ChannelGatewayService } from './channel-gateway.service';
import { WhatsAppChannel } from './channels/whatsapp.channel';

@Module({
  imports: [PrismaModule, GatewaysModule, forwardRef(() => AgentModule)],
  controllers: [ChannelGatewayController],
  providers: [ChannelGatewayService, WhatsAppChannel],
  exports: [ChannelGatewayService, WhatsAppChannel],
})
export class ChannelGatewayModule {}
