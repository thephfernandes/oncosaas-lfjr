import { Module } from '@nestjs/common';
import { AlertsGateway } from './alerts.gateway';
import { MessagesGateway } from './messages.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [PrismaModule, JwtModule, ConfigModule],
  providers: [AlertsGateway, MessagesGateway],
  exports: [AlertsGateway, MessagesGateway],
})
export class GatewaysModule {}
