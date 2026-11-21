import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';
import { readCorrelationId } from './correlation.middleware';

export type ProblemDetails = {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  correlationId: string;
  errors?: Array<{ field: string; message: string }>;
};

@Catch()
export class ProblemDetailsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = readCorrelationId(request);

    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    const title = titleForStatus(status);
    const detail =
      exception instanceof HttpException ? extractDetail(exception) : 'Ocorreu um erro interno.';

    const body: ProblemDetails = {
      type: `about:blank#${status}`,
      title,
      status,
      detail,
      instance: request.originalUrl || request.url,
      correlationId,
    };

    const fieldErrors = extractFieldErrors(exception);
    if (fieldErrors) {
      body.errors = fieldErrors;
    }

    response.status(status).type('application/problem+json').json(body);
  }
}

function titleForStatus(status: number): string {
  const titles: Record<number, string> = {
    [HttpStatus.BAD_REQUEST]: 'Requisição inválida',
    [HttpStatus.UNAUTHORIZED]: 'Não autenticado',
    [HttpStatus.FORBIDDEN]: 'Acesso negado',
    [HttpStatus.NOT_FOUND]: 'Não encontrado',
    [HttpStatus.CONFLICT]: 'Conflito',
    [HttpStatus.TOO_MANY_REQUESTS]: 'Muitas requisições',
    [HttpStatus.SERVICE_UNAVAILABLE]: 'Serviço indisponível',
  };
  return titles[status] ?? (status >= 500 ? 'Erro interno' : 'Erro');
}

function extractDetail(exception: HttpException): string {
  const payload = exception.getResponse();
  if (typeof payload === 'string') {
    return payload;
  }
  if (typeof payload === 'object' && payload !== null) {
    const record = payload as Record<string, unknown>;
    if (typeof record.message === 'string') {
      return record.message;
    }
    if (Array.isArray(record.message)) {
      return record.message.map(String).join('; ');
    }
    if (typeof record.detail === 'string') {
      return record.detail;
    }
  }
  return exception.message;
}

function extractFieldErrors(
  exception: unknown,
): Array<{ field: string; message: string }> | undefined {
  if (!(exception instanceof HttpException) || exception.getStatus() !== 400) {
    return undefined;
  }
  const payload = exception.getResponse();
  if (typeof payload !== 'object' || payload === null) {
    return undefined;
  }
  const record = payload as Record<string, unknown>;
  if (!Array.isArray(record.errors)) {
    return undefined;
  }
  return record.errors
    .map((item) => {
      if (typeof item !== 'object' || item === null) {
        return undefined;
      }
      const error = item as Record<string, unknown>;
      if (typeof error.field !== 'string' || typeof error.message !== 'string') {
        return undefined;
      }
      return { field: error.field, message: error.message };
    })
    .filter((item): item is { field: string; message: string } => item !== undefined);
}
