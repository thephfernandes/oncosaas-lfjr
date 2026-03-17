import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello() {
    return {
      message: 'Oncosaas Backend API',
      version: '0.1.0',
      status: 'running',
      endpoints: {
        health: '/api/v1/health',
        auth: {
          login: 'POST /api/v1/auth/login',
          register: 'POST /api/v1/auth/register',
        },
        patients: 'GET /api/v1/patients',
        messages: 'GET /api/v1/messages',
        alerts: 'GET /api/v1/alerts',
      },
      documentation: 'See README.md for API documentation',
    };
  }

  @Public()
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'oncosaas-backend',
      version: '0.1.0',
    };
  }
}