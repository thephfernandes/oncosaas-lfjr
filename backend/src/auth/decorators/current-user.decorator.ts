import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentUser {
  id: string;
  email: string;
  tenantId: string;
  role: string;
  /** Presente quando role é COORDINATOR — define assinatura NURSING vs MEDICAL */
  clinicalSubrole?: string | null;
  tenant?: {
    id: string;
    name: string;
    schemaName: string;
  };
}

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): CurrentUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  }
);
