/** Regras de camada (ADR-002). Execução: yarn depcruise (depcruise src --config .dependency-cruiser.cjs) */
/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'domain-isolated',
      severity: 'error',
      from: { path: '^src/domain' },
      to: { path: '^src/(application|infrastructure|interfaces)|@nestjs|@prisma|@aws-sdk|ioredis' },
    },
    {
      name: 'application-no-adapters',
      severity: 'error',
      from: { path: '^src/application', pathNot: '\\.spec\\.ts$' },
      to: { path: '^src/(infrastructure|interfaces)|@prisma|@aws-sdk|ioredis' },
    },
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'no-orphans',
      severity: 'warn',
      from: { orphan: true, pathNot: '\\.d\\.ts$|main\\.ts$' },
      to: {},
    },
  ],
  options: { doNotFollow: { path: 'node_modules' }, tsConfig: { fileName: 'tsconfig.json' } },
};
