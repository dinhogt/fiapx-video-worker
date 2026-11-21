import { redactSensitive } from './redact';

describe('redactSensitive', () => {
  it('redacts password, refreshToken, authorization and email', () => {
    const input = {
      password: 'secret-password',
      refreshToken: 'refresh-token',
      authorization: 'Bearer token',
      email: 'user@example.com',
      name: 'Ada',
      nested: {
        email: 'nested@example.com',
        keep: true,
      },
    };

    expect(redactSensitive(input)).toEqual({
      password: '[Redacted]',
      refreshToken: '[Redacted]',
      authorization: '[Redacted]',
      email: '[Redacted]',
      name: 'Ada',
      nested: {
        email: '[Redacted]',
        keep: true,
      },
    });
  });

  it('redacts sensitive keys inside arrays', () => {
    expect(redactSensitive([{ password: 'a' }, { ok: 1 }])).toEqual([
      { password: '[Redacted]' },
      { ok: 1 },
    ]);
  });
});
