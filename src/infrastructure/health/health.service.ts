import { Inject, Injectable } from '@nestjs/common';
import { GetQueueAttributesCommand, SQSClient } from '@aws-sdk/client-sqs';
import type { WorkerEnv } from '../config/env';
import { APP_ENV_CONFIG } from '../config/tokens';

export type DependencyCheck = {
  name: string;
  ok: boolean;
  detail?: string;
};

export type ReadyResult = {
  status: 'ok' | 'degraded';
  ready: boolean;
  checks: DependencyCheck[];
};

const CHECK_TIMEOUT_MS = 1500;

@Injectable()
export class HealthService {
  constructor(@Inject(APP_ENV_CONFIG) private readonly env: WorkerEnv) {}

  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  async ready(): Promise<ReadyResult> {
    const checks = await Promise.all([
      this.checkSqs('sqs-process', this.env.VIDEO_PROCESS_QUEUE_URL),
    ]);
    const ready = checks.every((check) => check.ok);
    return {
      status: ready ? 'ok' : 'degraded',
      ready,
      checks,
    };
  }

  private async checkSqs(name: string, queueUrl: string): Promise<DependencyCheck> {
    const client = new SQSClient({
      region: this.env.AWS_REGION,
      endpoint: this.env.AWS_ENDPOINT,
      credentials:
        this.env.AWS_ACCESS_KEY_ID && this.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: this.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: this.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
    });
    try {
      await withTimeout(
        client.send(
          new GetQueueAttributesCommand({
            QueueUrl: queueUrl,
            AttributeNames: ['ApproximateNumberOfMessages'],
          }),
        ),
        CHECK_TIMEOUT_MS,
      );
      return { name, ok: true };
    } catch (error) {
      return {
        name,
        ok: false,
        detail: error instanceof Error ? error.message : 'unavailable',
      };
    } finally {
      client.destroy();
    }
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    timer.unref();
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
