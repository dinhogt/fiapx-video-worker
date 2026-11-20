export type Success<T> = { readonly ok: true; readonly value: T };
export type Failure = { readonly ok: false; readonly code: string };
export type Result<T> = Success<T> | Failure;

export function success<T>(value: T): Success<T> {
  return { ok: true, value };
}

export function failure(code: string): Failure {
  return { ok: false, code };
}
