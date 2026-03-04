#!/bin/bash
# ==============================================================================
# search-person-image.sh — Busca foto real de pessoa na Wikipedia e sobe no R2
#
# Uso:
#   ./scripts/search-person-image.sh "SLUG-DO-ARTIGO" "NOME DA PESSOA"
#
# Exemplo:
#   ./scripts/search-person-image.sh "flamengo-demite-filipe-luis-2026" "Filipe Luís"
#
# Fluxo:
#   1. Busca Wikipedia PT (page/summary) → foto?
#   2. Busca Wikipedia EN (page/summary) → foto?
#   3. Se nao encontrar, sai com codigo 1 (NOT_FOUND)
#
# Retorna (ultima linha do stdout):
#   JSON: {"url":"https://...","source":"Wikipedia","license":"CC-BY-SA"}
#   Ou sai com exit code 1 se nao encontrou foto.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Validar argumentos ──────────────────────────────────────────────────────
if [ $# -lt 2 ]; then
  echo "Uso: $0 <slug> <nome-da-pessoa>"
  echo ""
  echo "Exemplo:"
  echo "  $0 \"flamengo-demite-filipe-luis-2026\" \"Filipe Luís\""
  exit 1
fi

SLUG="$1"
PERSON_NAME="$2"
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "🔍 Buscando foto de: $PERSON_NAME"

# ── Funcao: URL-encode para Wikipedia ────────────────────────────────────────
wiki_encode() {
  python3 -c "import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1].replace(' ', '_')))" "$1"
}

# ── Funcao: Buscar imagem na Wikipedia ───────────────────────────────────────
# Args: $1 = lang (pt/en), $2 = person name
# Escreve URL no arquivo $TMP_DIR/found_url se encontrar
# Logs vao para stderr
search_wikipedia() {
  local LANG="$1"
  local NAME="$2"
  local ENCODED
  ENCODED=$(wiki_encode "$NAME")

  echo "  📖 Tentando Wikipedia ${LANG}..." >&2

  local RESPONSE
  RESPONSE=$(curl -s -f "https://${LANG}.wikipedia.org/api/rest_v1/page/summary/${ENCODED}" 2>/dev/null) || {
    echo "    ❌ Nao encontrado na Wikipedia ${LANG}" >&2
    return 1
  }

  # Extrair URL da imagem original
  local IMG_URL
  IMG_URL=$(echo "$RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    orig = data.get('originalimage', {}).get('source', '')
    thumb = data.get('thumbnail', {}).get('source', '')
    url = orig or thumb
    if url:
        print(url)
    else:
        sys.exit(1)
except:
    sys.exit(1)
" 2>/dev/null) || {
    echo "    ❌ Artigo existe mas sem imagem" >&2
    return 1
  }

  echo "    ✅ Imagem encontrada: ${IMG_URL:0:80}..." >&2
  echo "$IMG_URL"
  return 0
}

# ── PASSO 1: Tentar Wikipedia PT ─────────────────────────────────────────────
IMAGE_URL=""
IMAGE_URL=$(search_wikipedia "pt" "$PERSON_NAME") || true

# ── PASSO 2: Tentar Wikipedia EN ─────────────────────────────────────────────
if [ -z "$IMAGE_URL" ]; then
  IMAGE_URL=$(search_wikipedia "en" "$PERSON_NAME") || true
fi

# ── PASSO 3: Nao encontrou ───────────────────────────────────────────────────
if [ -z "$IMAGE_URL" ]; then
  echo "❌ Nenhuma foto encontrada para: $PERSON_NAME"
  echo "   Sugestao: use o fallback download-news-image.sh com uma URL de noticia"
  exit 1
fi

# ── PASSO 4: Download da imagem ──────────────────────────────────────────────
echo "⬇️  Baixando imagem..."

# Detectar extensao
FILE_EXT=$(echo "$IMAGE_URL" | python3 -c "
import sys, os.path, urllib.parse
url = sys.stdin.read().strip()
path = urllib.parse.urlparse(url).path
ext = os.path.splitext(path)[1].lower()
print(ext if ext in ['.jpg', '.jpeg', '.png', '.webp', '.svg'] else '.jpg')
")

TEMP_IMAGE="$TMP_DIR/person${FILE_EXT}"

HTTP_STATUS=$(curl -sL -o "$TEMP_IMAGE" -w "%{http_code}" "$IMAGE_URL")

if [ "$HTTP_STATUS" -lt 200 ] || [ "$HTTP_STATUS" -ge 300 ]; then
  echo "❌ Download falhou (HTTP $HTTP_STATUS)"
  exit 1
fi

IMAGE_SIZE=$(wc -c < "$TEMP_IMAGE" | tr -d ' ')
echo "✅ Download OK: $(( IMAGE_SIZE / 1024 ))KB"

# ── PASSO 5: Upload para R2 via upload-image.sh ─────────────────────────────
echo "⬆️  Enviando para R2..."

UPLOAD_OUTPUT=$("$SCRIPT_DIR/upload-image.sh" "$SLUG" "$TEMP_IMAGE" 2>&1)
# Mostrar logs (tudo menos ultima linha)
echo "$UPLOAD_OUTPUT" | sed '$d'

# Pegar URL da ultima linha do upload-image.sh
R2_URL=$(echo "$UPLOAD_OUTPUT" | tail -1)

echo ""
echo "{\"url\":\"${R2_URL}\",\"source\":\"Wikipedia\",\"license\":\"CC-BY-SA\",\"original\":\"${IMAGE_URL}\"}"
