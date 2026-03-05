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
# Carrega explicitamente a chave usada pelo GitHub (id_diego)
eval "$(ssh-agent -s)" >/dev/null 2>&1
ssh-add --apple-use-keychain "$HOME/.ssh/id_diego" 2>/dev/null || ssh-add "$HOME/.ssh/id_diego" 2>/dev/null || true

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

# Checagem de espaçamento — SKIP se último artigo foi há menos de 45 min
ULTIMO_MDX=$(ls -t "$PROJECT_DIR/content/articles/"*.mdx 2>/dev/null | head -1)
if [ -n "$ULTIMO_MDX" ]; then
  ULTIMO_EPOCH=$(stat -f %m "$ULTIMO_MDX" 2>/dev/null || stat -c %Y "$ULTIMO_MDX" 2>/dev/null)
  AGORA_EPOCH=$(date +%s)
  DIFF_MIN=$(( (AGORA_EPOCH - ULTIMO_EPOCH) / 60 ))
  ULTIMO_NOME=$(basename "$ULTIMO_MDX")
  if [ "$DIFF_MIN" -lt 45 ]; then
    log "SKIP: ultimo artigo ($ULTIMO_NOME) publicado ha ${DIFF_MIN} min (minimo: 45 min)"
    # Limpa ssh-agent antes de sair
    [ -n "${SSH_AGENT_PID:-}" ] && kill "$SSH_AGENT_PID" 2>/dev/null || true
    log "=== CRON END ==="
    exit 0
  fi
  log "Ultimo artigo: $ULTIMO_NOME (ha ${DIFF_MIN} min) — OK, prosseguindo"
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

# Limpa ssh-agent pra nao acumular processos
[ -n "${SSH_AGENT_PID:-}" ] && kill "$SSH_AGENT_PID" 2>/dev/null || true

log "=== CRON END ==="
