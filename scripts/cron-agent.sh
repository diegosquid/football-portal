#!/bin/bash
# cron-agent.sh — Executa o agente cron via Claude Code CLI
# Uso: ./scripts/cron-agent.sh
# Cron: 0 */2 * * * /path/to/football-portal/scripts/cron-agent.sh

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
TIMESTAMP=$(TZ="America/Sao_Paulo" date +%Y-%m-%d-%H%M)
LOG_FILE="$LOG_DIR/cron-$TIMESTAMP.log"

mkdir -p "$LOG_DIR"

echo "[$(TZ='America/Sao_Paulo' date)] CRON START" >> "$LOG_FILE"

cd "$PROJECT_DIR"

# Garante que estamos no branch main atualizado
git pull origin main --rebase 2>> "$LOG_FILE" || true

# Executa o agente Claude (--dangerously-skip-permissions para rodar sem confirmacao)
claude -p "Leia o arquivo AGENT.md na raiz do repositorio e execute o fluxo completo da Secao 2. Este e o UNICO arquivo de instrucao. NAO leia CRON.MD nem outros .md de documentacao." \
  --dangerously-skip-permissions \
  --max-turns 30 \
  >> "$LOG_FILE" 2>&1

echo "[$(TZ='America/Sao_Paulo' date)] CRON END" >> "$LOG_FILE"
