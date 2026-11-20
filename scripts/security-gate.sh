#!/usr/bin/env bash
# Gate de segurança (B15 / V6.1 / V7.1). Falha se houver segredo ou arquivo proibido versionado.
set -euo pipefail
forbidden=$(git ls-files | grep -E '(^|/)\.env($|\.)|\.tfstate|(^|/)backend\.hcl$|\.pem$|\.key$' | grep -vE '\.env(\.local)?\.example$' || true)
if [[ -n "$forbidden" ]]; then echo "Arquivos proibidos versionados:"; echo "$forbidden"; exit 1; fi
gitleaks detect --no-banner --redact --exit-code 1
yarn npm audit --severity high --environment production
echo "security-gate OK"
