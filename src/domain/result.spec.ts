import { failure, success } from './result';

describe('result', () => {
  it('wraps a success value', () => {
    expect(success(1)).toEqual({ ok: true, value: 1 });
  });

  it('wraps a failure code', () => {
    expect(failure('INVALID')).toEqual({ ok: false, code: 'INVALID' });
  });
});
