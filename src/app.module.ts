import { DynamicModule, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import type { IncomingMessage } from 'node:http';
import type { WorkerEnv } from './infrastructure/config/env';
import { APP_ENV_CONFIG } from './infrastructure/config/tokens';
import { HealthService } from './infrastructure/health/health.service';
import { pinoRedactPaths } from './infrastructure/observability/redact';
import {
  CORRELATION_HEADER,
  CorrelationMiddleware,
} from './interfaces/http/correlation.middleware';
import { HealthController } from './interfaces/http/health.controller';
import { MetricsController } from './interfaces/http/metrics.controller';

@Module({})
export class AppModule implements NestModule {
  static forRoot(env: WorkerEnv): DynamicModule {
    return {
      module: AppModule,
      imports: [
        LoggerModule.forRoot({
          pinoHttp: {
            level: env.LOG_LEVEL,
            redact: {
              paths: pinoRedactPaths,
              censor: '[Redacted]',
            },
            customProps: (req: IncomingMessage) => ({
              correlationId: req.headers[CORRELATION_HEADER],
              service: env.OTEL_SERVICE_NAME,
              env: env.APP_ENV,
            }),
          },
        }),
      ],
      controllers: [HealthController, MetricsController],
      providers: [{ provide: APP_ENV_CONFIG, useValue: env }, HealthService],
    };
  }

  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationMiddleware).forRoutes('*');
  }
}
