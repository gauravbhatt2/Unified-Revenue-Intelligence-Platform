import { Request, Response, NextFunction } from 'express';

export function authHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  // Public bootstrap routes
  if (req.path.startsWith('/tenants')) {
    return next();
  }

  const tenantId = String(req.headers['x-tenant-id'] || '').trim();
  const userId = String(req.headers['x-user-id'] || '').trim();

  if (!tenantId || !userId) {
    return res.status(401).json({
      message: 'Authenticated tenant context required via x-tenant-id and x-user-id headers',
    });
  }

  return next();
}
