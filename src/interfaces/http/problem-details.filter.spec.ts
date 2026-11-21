import { BadRequestException, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import type { Request, Response } from 'express';
import { ProblemDetailsFilter } from './problem-details.filter';
import { CORRELATION_HEADER } from './correlation.middleware';

function createHost(response: Response, request: Request): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getResponse: () => response,
      getRequest: () => request,
    }),
  } as ArgumentsHost;
}

function createResponse(): {
  response: Response;
  body: Record<string, unknown>;
  statusCode: { value: number };
  contentType: { value: string };
} {
  const body: Record<string, unknown> = {};
  const statusCode = { value: 0 };
  const contentType = { value: '' };
  const response = {
    status: (code: number) => {
      statusCode.value = code;
      return response;
    },
    type: (type: string) => {
      contentType.value = type;
      return response;
    },
    json: (payload: Record<string, unknown>) => {
      Object.assign(body, payload);
      return response;
    },
  } as unknown as Response;
  return { response, body, statusCode, contentType };
}

describe('ProblemDetailsFilter', () => {
  it('returns RFC 7807 problem details without a stack', () => {
    const filter = new ProblemDetailsFilter();
    const { response, body, statusCode, contentType } = createResponse();
    const request = {
      header: (name: string) => (name === CORRELATION_HEADER ? 'corr-1' : undefined),
      originalUrl: '/auth/login',
      url: '/auth/login',
    } as unknown as Request;

    filter.catch(new NotFoundException('Recurso não encontrado'), createHost(response, request));

    expect(statusCode.value).toBe(404);
    expect(contentType.value).toBe('application/problem+json');
    expect(body).toEqual({
      type: 'about:blank#404',
      title: 'Não encontrado',
      status: 404,
      detail: 'Recurso não encontrado',
      instance: '/auth/login',
      correlationId: 'corr-1',
    });
    expect(body).not.toHaveProperty('stack');
  });

  it('includes field errors for bad requests', () => {
    const filter = new ProblemDetailsFilter();
    const { response, body } = createResponse();
    const request = {
      header: () => 'corr-2',
      originalUrl: '/auth/register',
      url: '/auth/register',
    } as unknown as Request;

    filter.catch(
      new BadRequestException({
        message: 'Dados inválidos',
        errors: [{ field: 'email', message: 'e-mail inválido' }],
      }),
      createHost(response, request),
    );

    expect(body.errors).toEqual([{ field: 'email', message: 'e-mail inválido' }]);
  });

  it('maps unknown errors to a generic internal problem', () => {
    const filter = new ProblemDetailsFilter();
    const { response, body, statusCode } = createResponse();
    const request = {
      header: () => undefined,
      originalUrl: '',
      url: '/boom',
    } as unknown as Request;

    filter.catch(new Error('secret stack'), createHost(response, request));

    expect(statusCode.value).toBe(500);
    expect(body.title).toBe('Erro interno');
    expect(body.detail).toBe('Ocorreu um erro interno.');
    expect(body.correlationId).toBe('unknown');
    expect(body.instance).toBe('/boom');
  });

  it('accepts string and array HttpException payloads', () => {
    const filter = new ProblemDetailsFilter();
    const first = createResponse();
    const request = {
      header: () => 'corr-3',
      originalUrl: '/x',
      url: '/x',
    } as unknown as Request;

    filter.catch(
      new HttpException('falha textual', HttpStatus.CONFLICT),
      createHost(first.response, request),
    );
    expect(first.body.detail).toBe('falha textual');
    expect(first.body.title).toBe('Conflito');

    const second = createResponse();
    filter.catch(
      new BadRequestException({ message: ['a', 'b'], detail: 'ignored' }),
      createHost(second.response, request),
    );
    expect(second.body.detail).toBe('a; b');
  });

  it('uses detail when message is absent', () => {
    const filter = new ProblemDetailsFilter();
    const { response, body } = createResponse();
    const request = {
      header: () => 'corr-4',
      originalUrl: '/y',
      url: '/y',
    } as unknown as Request;

    filter.catch(
      new HttpException({ detail: 'sem mensagem' }, HttpStatus.UNAUTHORIZED),
      createHost(response, request),
    );
    expect(body.detail).toBe('sem mensagem');
    expect(body.title).toBe('Não autenticado');
  });
});
