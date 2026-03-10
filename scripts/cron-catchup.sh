#!/bin/bash
# cron-catchup.sh — Verifica se o cron principal rodou nas últimas 2h e executa se necessário
# Roda a cada 30min via crontab como fallback para jobs perdidos (ex: Mac dormindo)
# Cron: */30 * * * * /Users/diegodmacedo/Documents/football-portal/scripts/cron-catchup.sh

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/logs"
DATA_BRT=$(TZ="America/Sao_Paulo" date +%Y-%m-%d)
HORA_BRT=$(TZ="America/Sao_Paulo" date +%H%M)

# Skip madrugada (00:30–05:30 BRT) — mesmo padrão do cron-agent.sh
if [ "$HORA_BRT" -ge 30 ] && [ "$HORA_BRT" -le 530 ]; then
  exit 0
fi

# Verifica se já rodou nas últimas 2h (procura logs recentes com "CRON END")
DUAS_HORAS_ATRAS=$(date -v-2H +%s 2>/dev/null || date -d '2 hours ago' +%s 2>/dev/null)

if ls "$LOG_DIR"/cron-${DATA_BRT}-*.log 1>/dev/null 2>&1; then
  for logfile in "$LOG_DIR"/cron-${DATA_BRT}-*.log; do
    FILE_TIME=$(stat -f %m "$logfile" 2>/dev/null || stat -c %Y "$logfile" 2>/dev/null)
    if [ "$FILE_TIME" -ge "$DUAS_HORAS_ATRAS" ] && grep -q "CRON END" "$logfile" 2>/dev/null; then
      # Já rodou com sucesso recentemente — nada a fazer
      exit 0
    fi
  done
fi

# Não rodou recentemente — executar o cron principal
echo "[$(TZ='America/Sao_Paulo' date '+%Y-%m-%d %H:%M:%S')] CATCHUP: cron principal não rodou nas últimas 2h, executando agora..." >> "$LOG_DIR/catchup.log"
exec "$PROJECT_DIR/scripts/cron-agent.sh"
