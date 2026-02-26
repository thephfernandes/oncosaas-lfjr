import { Module } from '@nestjs/common';
import { WhatsAppConnectionsController } from './whatsapp-connections.controller';
import { WhatsAppConnectionsService } from './whatsapp-connections.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WhatsAppConnectionsController],
  providers: [WhatsAppConnectionsService],
  exports: [WhatsAppConnectionsService],
})
export class WhatsAppConnectionsModule {}
