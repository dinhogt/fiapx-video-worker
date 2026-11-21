const SENSITIVE_KEYS = new Set(['password', 'refreshtoken', 'authorization', 'email']);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function redactSensitive<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item: unknown) => redactSensitive(item)) as T;
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = '[Redacted]';
      continue;
    }
    redacted[key] = redactSensitive(nested);
  }
  return redacted as T;
}

export const pinoRedactPaths = [
  'password',
  'refreshToken',
  'authorization',
  'email',
  'req.headers.authorization',
  'req.body.password',
  'req.body.refreshToken',
  'req.body.email',
  '*.password',
  '*.refreshToken',
  '*.authorization',
  '*.email',
];
