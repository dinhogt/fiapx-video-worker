import { HealthService } from './health.service';
import type { WorkerEnv } from '../config/env';

const env: WorkerEnv = {
  NODE_ENV: 'test',
  APP_ENV: 'test',
  PORT: 3003,
  LOG_LEVEL: 'info',
  AWS_REGION: 'us-east-1',
  AWS_ENDPOINT: 'http://127.0.0.1:1',
  AWS_ACCESS_KEY_ID: 'test',
  AWS_SECRET_ACCESS_KEY: 'test',
  OTEL_SERVICE_NAME: 'video-worker',
  JWT_ISSUER: 'http://localhost:3001',
  JWT_AUDIENCE: 'fiapx-api',
  JWKS_URL: 'http://localhost:3001/.well-known/jwks.json',
  TRUST_GATEWAY_IP: false,
  S3_BUCKET: 'fiapx-local-videos',
  VIDEO_PROCESS_QUEUE_URL: 'http://127.0.0.1:1/000000000000/fiapx-local-video-process',
  VIDEO_EVENTS_TOPIC_ARN: 'arn:aws:sns:us-east-1:000000000000:fiapx-local-video-events',
  WORKER_CONCURRENCY: 1,
  MAX_FRAMES: 3600,
  PROCESS_TIMEOUT_MS: 900000,
};

describe('HealthService', () => {
  it('reports live status without dependencies', () => {
    expect(new HealthService(env).live()).toEqual({ status: 'ok' });
  });

  it('marks ready as false when the queue is unreachable', async () => {
    const result = await new HealthService(env).ready();
    expect(result.ready).toBe(false);
    expect(result.checks).toEqual([expect.objectContaining({ name: 'sqs-process', ok: false })]);
  }, 10000);
});
