import type { NextFunction, Request, Response } from 'express';
import {
  CorrelationMiddleware,
  CORRELATION_HEADER,
  readCorrelationId,
} from './correlation.middleware';

describe('CorrelationMiddleware', () => {
  it('reuses an incoming correlation id', () => {
    const middleware = new CorrelationMiddleware();
    const req = {
      header: (name: string) => (name === CORRELATION_HEADER ? 'abc-123' : undefined),
      headers: {} as Record<string, string>,
    } as unknown as Request;
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      },
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect(req.headers[CORRELATION_HEADER]).toBe('abc-123');
    expect(headers[CORRELATION_HEADER]).toBe('abc-123');
    expect(next).toHaveBeenCalled();
  });

  it('generates a correlation id when the header is missing', () => {
    const middleware = new CorrelationMiddleware();
    const req = {
      header: () => undefined,
      headers: {} as Record<string, string>,
    } as unknown as Request;
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (name: string, value: string) => {
        headers[name] = value;
      },
    } as unknown as Response;
    const next = jest.fn() as NextFunction;

    middleware.use(req, res, next);

    expect(req.headers[CORRELATION_HEADER]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(headers[CORRELATION_HEADER]).toBe(req.headers[CORRELATION_HEADER]);
  });

  it('ignores blank correlation headers', () => {
    const middleware = new CorrelationMiddleware();
    const req = {
      header: () => '   ',
      headers: {} as Record<string, string>,
    } as unknown as Request;
    const res = { setHeader: jest.fn() } as unknown as Response;
    middleware.use(req, res, jest.fn() as NextFunction);
    expect(req.headers[CORRELATION_HEADER]).not.toBe('   ');
  });

  it('reads correlation id from the request', () => {
    const req = {
      header: (name: string) => (name === CORRELATION_HEADER ? 'from-req' : undefined),
    } as unknown as Request;
    expect(readCorrelationId(req)).toBe('from-req');
    expect(readCorrelationId({ header: () => undefined } as unknown as Request)).toBe('unknown');
  });
});
