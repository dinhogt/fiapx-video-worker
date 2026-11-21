import type { Config } from 'jest';

// Gate de cobertura de 80% (RNF-08, B15). Integration: *.int-spec.ts via `yarn test:int`.
const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.(spec|int-spec)\\.ts$',
  transform: { '^.+\\.ts$': 'ts-jest' },
  testEnvironment: 'node',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/main.ts',
    '!src/infrastructure/observability/otel.ts',
    '!src/**/*.module.ts',
    '!src/**/index.ts',
  ],
  coverageReporters: ['text-summary', 'lcov'],
  coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } },
};
export default config;
