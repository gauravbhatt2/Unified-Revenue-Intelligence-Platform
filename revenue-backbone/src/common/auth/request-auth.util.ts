import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export interface RequestAuthContext {
  tenantId: string;
  userId: string;
}

export function getRequestAuth(req: Request): RequestAuthContext {
  const tenantId = String(req.headers['x-tenant-id'] || '').trim();
  const userId = String(req.headers['x-user-id'] || '').trim();

  if (!tenantId) {
    throw new UnauthorizedException('Missing x-tenant-id header');
  }
  if (!userId) {
    throw new UnauthorizedException('Missing x-user-id header');
  }

  return { tenantId, userId };
}
