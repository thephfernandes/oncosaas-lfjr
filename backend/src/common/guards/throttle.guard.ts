import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

/**
 * Guard simples de Rate Limiting
 * Limita requisições por IP para prevenir abusos
 *
 * Configuração:
 * - 100 requisições por minuto para endpoints gerais
 * - 10 requisições por minuto para login/register (mais restritivo)
 * - 200 requisições por minuto para webhooks (WhatsApp pode enviar muitas notificações)
 * - 30 requisições por minuto para health/ready (monitoramento)
 */
@Injectable()
export class ThrottleGuard implements CanActivate {
  private readonly store = new Map<string, RateLimitRecord>();
  private readonly defaultLimit = 100; // requisições
  private readonly defaultTtl = 60000; // 1 minuto em ms
  private readonly loginLimit = 10; // limite mais restritivo para login/register
  private readonly webhookLimit = 200; // limite para webhooks (WhatsApp pode enviar muitas notificações)
  private readonly healthLimit = 30; // limite para health checks
  private readonly cleanupInterval = 60000; // limpar registros antigos a cada minuto

  constructor() {
    // Limpar registros antigos periodicamente para evitar memory leak
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = this.getClientIp(request);
    const path = request.path;

    // Determinar limite baseado no endpoint
    let limit = this.defaultLimit;
    if (this.isLoginEndpoint(path)) {
      limit = this.loginLimit;
    } else if (this.isWebhookEndpoint(path)) {
      limit = this.webhookLimit;
    } else if (this.isHealthEndpoint(path)) {
      limit = this.healthLimit;
    }

    const key = `${ip}:${path}`;

    const now = Date.now();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      // Primeiro request ou TTL expirado
      this.store.set(key, {
        count: 1,
        resetTime: now + this.defaultTtl,
      });
      return true;
    }

    if (record.count >= limit) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Muitas requisições. Tente novamente em alguns segundos.',
          retryAfter,
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    record.count++;
    return true;
  }

  private getClientIp(request: Request): string {
    // Considerar headers de proxy reverso
    const forwarded = request.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded)
        ? forwarded[0]
        : forwarded.split(',')[0];
      return ips.trim();
    }
    return request.ip || request.socket.remoteAddress || 'unknown';
  }

  private isLoginEndpoint(path: string): boolean {
    return path.includes('/auth/login') || path.includes('/auth/register');
  }

  private isWebhookEndpoint(path: string): boolean {
    return (
      path.includes('/webhook') ||
      (path.includes('/whatsapp-connections') && path.includes('/webhook'))
    );
  }

  private isHealthEndpoint(path: string): boolean {
    return (
      path === '/health' ||
      path === '/ready' ||
      path === '/api/v1/health' ||
      path === '/api/v1/ready'
    );
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}
