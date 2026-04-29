import express from 'express';
import request from 'supertest';
import { authHeadersMiddleware } from './auth-headers.middleware';

describe('authHeadersMiddleware', () => {
  const app = express();
  app.use(authHeadersMiddleware);
  app.get('/accounts', (_req, res) => res.status(200).json({ ok: true }));
  app.get('/tenants', (_req, res) => res.status(200).json({ ok: true }));

  it('allows public tenant bootstrap endpoints', async () => {
    const res = await request(app).get('/tenants');
    expect(res.status).toBe(200);
  });

  it('rejects protected route without headers', async () => {
    const res = await request(app).get('/accounts');
    expect(res.status).toBe(401);
  });

  it('allows protected route with tenant/user headers', async () => {
    const res = await request(app)
      .get('/accounts')
      .set('x-tenant-id', 'tenant-123')
      .set('x-user-id', 'user-123');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});
