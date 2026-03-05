import { Module } from '@nestjs/common';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GatewaysModule } from '../gateways/gateways.module';
import { AgentModule } from '../agent/agent.module';

@Module({
  imports: [PrismaModule, GatewaysModule, AgentModule],
  controllers: [MessagesController],
  providers: [MessagesService],
  exports: [MessagesService],
})
export class MessagesModule {}
