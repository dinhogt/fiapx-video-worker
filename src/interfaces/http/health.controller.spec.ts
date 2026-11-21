import type { Response } from 'express';
import { HealthController } from './health.controller';
import { HealthService } from '../../infrastructure/health/health.service';

describe('HealthController', () => {
  it('returns live status', () => {
    const health = {
      live: () => ({ status: 'ok' as const }),
    } as HealthService;
    const controller = new HealthController(health);
    expect(controller.live()).toEqual({ status: 'ok' });
  });

  it('returns 503 when dependencies are not ready', async () => {
    const health = {
      ready: () =>
        Promise.resolve({
          status: 'degraded' as const,
          ready: false,
          checks: [{ name: 'postgres', ok: false }],
        }),
    } as HealthService;
    const controller = new HealthController(health);
    let statusCode = 200;
    const res = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
    } as unknown as Response;

    const body = await controller.ready(res);
    expect(statusCode).toBe(503);
    expect(body.ready).toBe(false);
  });
});
