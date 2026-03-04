#!/bin/bash
# ==============================================================================
# download-news-image.sh — Baixa imagem de URL (ou extrai og:image) e sobe no R2
#
# Uso:
#   ./scripts/download-news-image.sh "SLUG" "URL" ["NOME_DA_FONTE"]
#
# A URL pode ser:
#   - URL direta de imagem (.jpg, .png, .webp)
#   - URL de pagina web (extrai og:image automaticamente)
#
# Exemplos:
#   # URL direta de imagem:
#   ./scripts/download-news-image.sh "cbf-presidente-2026" \
#     "https://example.com/foto.jpg" "CNN Brasil"
#
#   # URL de pagina (extrai og:image):
#   ./scripts/download-news-image.sh "cbf-presidente-2026" \
#     "https://www.cnnbrasil.com.br/esportes/conheca-reinaldo/" "CNN Brasil"
#
# Retorna (ultima linha do stdout):
#   JSON: {"url":"https://r2.../...","source":"CNN Brasil","license":"Reproducao"}
#   Ou sai com exit code 1 se falhar.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ── Validar argumentos ──────────────────────────────────────────────────────
if [ $# -lt 2 ]; then
  echo "Uso: $0 <slug> <url> [nome-da-fonte]"
  echo ""
  echo "Exemplos:"
  echo "  $0 \"cbf-presidente-2026\" \"https://site.com/foto.jpg\" \"CNN Brasil\""
  echo "  $0 \"cbf-presidente-2026\" \"https://site.com/artigo\" \"CNN Brasil\""
  exit 1
fi

SLUG="$1"
URL="$2"
SOURCE_NAME="${3:-Reprodução}"
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "🔗 URL: $URL"
echo "📰 Fonte: $SOURCE_NAME"

# ── Detectar se e URL de imagem ou pagina web ────────────────────────────────
is_image_url() {
  echo "$1" | grep -qiE '\.(jpg|jpeg|png|webp|gif)(\?.*)?$'
}

IMAGE_URL=""

if is_image_url "$URL"; then
  # URL direta de imagem
  IMAGE_URL="$URL"
  echo "📷 URL direta de imagem detectada"
else
  # Pagina web — extrair og:image
  echo "🌐 Pagina web detectada, extraindo og:image..."

  PAGE_HTML=$(curl -sL -A "Mozilla/5.0 (compatible; BeiraDoCampoBot/1.0)" \
    --max-time 15 "$URL" 2>/dev/null) || {
    echo "❌ Falha ao acessar pagina"
    exit 1
  }

  IMAGE_URL=$(echo "$PAGE_HTML" | python3 -c "
import sys, re, html

content = sys.stdin.read()

# Tentar og:image (formato mais comum)
patterns = [
    r'<meta[^>]+property=[\"\\x27]og:image[\"\\x27][^>]+content=[\"\\x27]([^\"\\x27]+)[\"\\x27]',
    r'<meta[^>]+content=[\"\\x27]([^\"\\x27]+)[\"\\x27][^>]+property=[\"\\x27]og:image[\"\\x27]',
    r'<meta[^>]+name=[\"\\x27]twitter:image[\"\\x27][^>]+content=[\"\\x27]([^\"\\x27]+)[\"\\x27]',
    r'<meta[^>]+content=[\"\\x27]([^\"\\x27]+)[\"\\x27][^>]+name=[\"\\x27]twitter:image[\"\\x27]',
]

for pattern in patterns:
    match = re.search(pattern, content, re.IGNORECASE)
    if match:
        url = html.unescape(match.group(1))
        # Limpar &amp; residuais
        url = url.replace('&amp;', '&')
        print(url)
        sys.exit(0)

sys.exit(1)
" 2>/dev/null) || {
    echo "❌ Nenhuma og:image encontrada na pagina"
    exit 1
  }

  echo "✅ og:image encontrada: ${IMAGE_URL:0:80}..."
fi

# ── Download da imagem ───────────────────────────────────────────────────────
echo "⬇️  Baixando imagem..."

# Detectar extensao
FILE_EXT=$(echo "$IMAGE_URL" | python3 -c "
import sys, os.path, urllib.parse
url = sys.stdin.read().strip()
path = urllib.parse.urlparse(url).path
ext = os.path.splitext(path)[1].lower().split('?')[0]
print(ext if ext in ['.jpg', '.jpeg', '.png', '.webp'] else '.jpg')
")

TEMP_IMAGE="$TMP_DIR/news${FILE_EXT}"

HTTP_STATUS=$(curl -sL \
  -A "Mozilla/5.0 (compatible; BeiraDoCampoBot/1.0)" \
  -o "$TEMP_IMAGE" -w "%{http_code}" \
  --max-time 30 "$IMAGE_URL")

if [ "$HTTP_STATUS" -lt 200 ] || [ "$HTTP_STATUS" -ge 300 ]; then
  echo "❌ Download falhou (HTTP $HTTP_STATUS)"
  exit 1
fi

IMAGE_SIZE=$(wc -c < "$TEMP_IMAGE" | tr -d ' ')

# Verificar se o arquivo e realmente uma imagem (minimo 5KB)
if [ "$IMAGE_SIZE" -lt 5000 ]; then
  echo "❌ Arquivo muito pequeno (${IMAGE_SIZE} bytes) — provavelmente nao e uma imagem valida"
  exit 1
fi

echo "✅ Download OK: $(( IMAGE_SIZE / 1024 ))KB"

# ── Upload para R2 via upload-image.sh ───────────────────────────────────────
echo "⬆️  Enviando para R2..."

UPLOAD_OUTPUT=$("$SCRIPT_DIR/upload-image.sh" "$SLUG" "$TEMP_IMAGE" 2>&1)
echo "$UPLOAD_OUTPUT" | sed '$d'

# Pegar URL da ultima linha do upload-image.sh
R2_URL=$(echo "$UPLOAD_OUTPUT" | tail -1)

echo ""
echo "{\"url\":\"${R2_URL}\",\"source\":\"${SOURCE_NAME}\",\"license\":\"Reproducao\",\"original\":\"${IMAGE_URL}\"}"
