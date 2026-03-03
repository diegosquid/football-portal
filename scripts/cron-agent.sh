#!/bin/bash
# cron-agent.sh — Executa o agente cron via Claude Code CLI
# Uso: ./scripts/cron-agent.sh
# Cron: 0 */2 * * * /path/to/football-portal/scripts/cron-agent.sh

set -uo pipefail

# PATH completo — cron roda com PATH mínimo (/usr/bin:/bin)
export PATH="/Users/diegodmacedo/.local/bin:/Users/diegodmacedo/.nvm/versions/node/v22.12.0/bin:/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="/Users/diegodmacedo"

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Auth do Claude CLI (token em .env.cron, ignorado pelo git)
source "$PROJECT_DIR/.env.cron"
export CLAUDE_CODE_OAUTH_TOKEN

# SSH agent para git push/pull funcionar
eval "$(ssh-agent -s)" >/dev/null 2>&1
ssh-add --apple-use-keychain 2>/dev/null || true

# Limpa variáveis que impedem execução dentro de outra sessão Claude
unset CLAUDECODE 2>/dev/null || true
unset CLAUDE_CODE 2>/dev/null || true
export CLAUDECODE=""
LOG_DIR="$PROJECT_DIR/logs"
TIMESTAMP=$(TZ="America/Sao_Paulo" date +%Y-%m-%d-%H%M)
LOG_FILE="$LOG_DIR/cron-$TIMESTAMP.log"

mkdir -p "$LOG_DIR"

log() { echo "[$(TZ='America/Sao_Paulo' date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"; }

# Checagem de horário — SKIP entre 00:30 e 05:30 BRT
HORA_BRT=$(TZ="America/Sao_Paulo" date +%H%M)
if [ "$HORA_BRT" -ge 30 ] && [ "$HORA_BRT" -le 530 ]; then
  log "SKIP: madrugada (${HORA_BRT} BRT, faixa 00:30–05:30)"
  exit 0
fi

log "=== CRON START ==="
log "User: $(whoami) | Shell: $SHELL | PATH: $PATH"
log "Node: $(node -v 2>&1 || echo 'NAO ENCONTRADO')"
log "Claude CLI: $(which claude 2>&1 || echo 'NAO ENCONTRADO')"

cd "$PROJECT_DIR"
log "Diretorio: $(pwd)"
log "Branch: $(git branch --show-current 2>&1)"

# Garante que estamos no branch main atualizado
log "--- git pull ---"
if ! git diff --quiet 2>/dev/null; then
  log "Unstaged changes detectadas, fazendo git stash"
  git stash >> "$LOG_FILE" 2>&1 || true
fi
if git pull origin main --rebase >> "$LOG_FILE" 2>&1; then
  log "git pull OK"
else
  log "WARN: git pull falhou (continuando mesmo assim)"
fi

# Executa o agente Claude
log "--- claude agent START ---"
claude -p "Leia o arquivo AGENT.md na raiz do repositorio e execute o fluxo completo da Secao 2. Este e o UNICO arquivo de instrucao. NAO leia CRON.MD nem outros .md de documentacao." \
  --dangerously-skip-permissions \
  --max-turns 50 \
  >> "$LOG_FILE" 2>&1
CLAUDE_EXIT=$?
log "--- claude agent END (exit code: $CLAUDE_EXIT) ---"

if [ $CLAUDE_EXIT -ne 0 ]; then
  log "ERRO: Claude saiu com código $CLAUDE_EXIT"
fi

log "=== CRON END ==="
