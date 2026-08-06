#!/bin/bash
# ==============================================================================
# publish-authorial-image.sh — Publica uma imagem gerada pelo Codex/ImageGen no R2
#
# Uso:
#   ./scripts/publish-authorial-image.sh "SLUG-DO-ARTIGO" "/caminho/imagem.png" \
#     --caption "Ilustração gerada por IA — contexto editorial da imagem" [--version v2]
#
# A imagem é enviada como WebP quando disponível (PNG é o fallback), na mesma pasta
# articles/ usada pelo portal.
# Retorna a URL pública e o bloco de frontmatter pronto para colar no artigo.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

usage() {
  cat <<'EOF'
Uso: publish-authorial-image.sh <slug> <caminho-da-imagem> --caption <legenda> [--version v2]

Exemplo:
  ./scripts/publish-authorial-image.sh "lucho-rodriguez-cruzeiro-2026" \
    "/Users/voce/.codex/generated_images/imagem.png" \
    --caption "Ilustração gerada por IA — Lucho Rodríguez em cenário de estádio para a chegada ao Cruzeiro"

Use --version v2 ao substituir uma imagem já publicada: evita cache antigo ao
criar articles/<slug>-v2.png e retornar a nova URL para o frontmatter.
EOF
}

if [ "${1:-}" = "-h" ] || [ "${1:-}" = "--help" ]; then
  usage
  exit 0
fi

if [ "$#" -lt 4 ]; then
  usage
  exit 1
fi

SLUG="$1"
IMAGE_PATH="$2"
shift 2
CAPTION=""
VERSION=""

while [ "$#" -gt 0 ]; do
  case "$1" in
    --caption)
      [ "$#" -ge 2 ] || { echo "❌ --caption precisa de uma legenda"; exit 1; }
      CAPTION="$2"
      shift 2
      ;;
    --version)
      [ "$#" -ge 2 ] || { echo "❌ --version precisa de um identificador"; exit 1; }
      VERSION="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "❌ Argumento desconhecido: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ ! "$SLUG" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "❌ Slug inválido: use apenas minúsculas, números e hífens"
  exit 1
fi

if [ -n "$VERSION" ] && [[ ! "$VERSION" =~ ^[a-z0-9]+(-[a-z0-9]+)*$ ]]; then
  echo "❌ Versão inválida: use apenas minúsculas, números e hífens"
  exit 1
fi

if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ Arquivo não encontrado: $IMAGE_PATH"
  exit 1
fi

if [ -z "$CAPTION" ]; then
  echo "❌ Informe uma legenda com --caption"
  exit 1
fi

CAPTION_LENGTH=${#CAPTION}
if [ "$CAPTION_LENGTH" -lt 80 ] || [ "$CAPTION_LENGTH" -gt 150 ]; then
  echo "❌ A legenda deve ter entre 80 e 150 caracteres (atual: $CAPTION_LENGTH)"
  exit 1
fi

MIME_TYPE=$(file --brief --mime-type "$IMAGE_PATH")
case "$MIME_TYPE" in
  image/jpeg|image/png|image/webp|image/avif) ;;
  *)
    echo "❌ Arquivo não é uma imagem suportada: $MIME_TYPE"
    exit 1
    ;;
esac

echo "🪄 Publicando imagem autoral para: $SLUG"
echo "📁 Origem: $IMAGE_PATH"

UPLOAD_SLUG="$SLUG"
if [ -n "$VERSION" ]; then
  UPLOAD_SLUG="${SLUG}-${VERSION}"
  echo "🏷️  Versão: $VERSION"
fi

TMP_DIR=$(mktemp -d)
cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT
NORMALIZED_IMAGE="$TMP_DIR/image.png"

if command -v sips >/dev/null 2>&1; then
  # O ImageGen pode devolver imagens bem maiores que a necessidade de uma capa.
  # Mantemos PNG e limitamos o maior lado a 1200px sem alterar o arquivo original.
  echo "🛠️  Normalizando para PNG com até 1200px..."
  sips -s format png -Z 1200 "$IMAGE_PATH" --out "$NORMALIZED_IMAGE" >/dev/null
else
  echo "⚠️  sips indisponível; enviando o arquivo original sem redimensionamento"
  NORMALIZED_IMAGE="$IMAGE_PATH"
fi

UPLOAD_FORMAT="png"
if command -v cwebp >/dev/null 2>&1; then
  UPLOAD_FORMAT="webp"
fi

UPLOAD_OUTPUT=$("$SCRIPT_DIR/upload-image.sh" "$UPLOAD_SLUG" "$NORMALIZED_IMAGE" --format "$UPLOAD_FORMAT" 2>&1) || {
  echo "$UPLOAD_OUTPUT"
  exit 1
}

echo "$UPLOAD_OUTPUT"
R2_URL=$(echo "$UPLOAD_OUTPUT" | tail -n 1)

echo ""
echo "✅ Imagem autoral publicada"
echo "📝 Frontmatter sugerido:"
echo "image: \"$R2_URL\""
echo "imageCaption: \"$CAPTION\""
echo ""
echo "$R2_URL"
