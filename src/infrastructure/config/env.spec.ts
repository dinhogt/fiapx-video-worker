import { loadEnv } from './env';

const validEnv: NodeJS.ProcessEnv = {
  NODE_ENV: 'test',
  APP_ENV: 'test',
  PORT: '3003',
  LOG_LEVEL: 'info',
  AWS_REGION: 'us-east-1',
  AWS_ENDPOINT: 'http://localhost:4566',
  OTEL_SERVICE_NAME: 'video-worker',
  JWT_ISSUER: 'http://localhost:3001',
  JWT_AUDIENCE: 'fiapx-api',
  JWKS_URL: 'http://localhost:3001/.well-known/jwks.json',
  TRUST_GATEWAY_IP: 'false',
  S3_BUCKET: 'fiapx-local-videos',
  VIDEO_PROCESS_QUEUE_URL: 'http://localhost:4566/000000000000/fiapx-local-video-process',
  VIDEO_EVENTS_TOPIC_ARN: 'arn:aws:sns:us-east-1:000000000000:fiapx-local-video-events',
  WORKER_CONCURRENCY: '1',
  MAX_FRAMES: '3600',
  PROCESS_TIMEOUT_MS: '900000',
};

describe('loadEnv', () => {
  it('parses a valid environment without DATABASE_URL', () => {
    const env = loadEnv(validEnv);
    expect(env.PORT).toBe(3003);
    expect(env.WORKER_CONCURRENCY).toBe(1);
    expect(env).not.toHaveProperty('DATABASE_URL');
  });

  it('fails when required values are missing', () => {
    expect(() => loadEnv({})).toThrow(/Invalid configuration/);
  });
});
