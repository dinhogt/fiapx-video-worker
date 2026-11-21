import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { loadEnv } from './infrastructure/config/env';
import { shutdownOpenTelemetry, startOpenTelemetry } from './infrastructure/observability/otel';
import { ProblemDetailsFilter } from './interfaces/http/problem-details.filter';

async function bootstrap(): Promise<void> {
  const env = loadEnv();

  startOpenTelemetry({
    serviceName: env.OTEL_SERVICE_NAME,
    endpoint: env.OTEL_EXPORTER_OTLP_ENDPOINT || undefined,
  });

  const app = await NestFactory.create(AppModule.forRoot(env), { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.use(helmet());
  app.useGlobalFilters(new ProblemDetailsFilter());

  await app.listen(env.PORT);

  const shutdown = async (): Promise<void> => {
    await app.close();
    await shutdownOpenTelemetry();
  };
  process.once('SIGTERM', () => {
    void shutdown();
  });
  process.once('SIGINT', () => {
    void shutdown();
  });
}

bootstrap().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
