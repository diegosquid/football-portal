#!/bin/bash
# ==============================================================================
# upload-image.sh — Faz upload de uma imagem local para o Cloudflare R2
#
# Uso:
#   ./scripts/upload-image.sh "SLUG-DO-ARTIGO" "/caminho/para/imagem.jpg"
#
# Exemplo:
#   ./scripts/upload-image.sh "filipe-luis-100-jogos" "/tmp/imagem.jpg"
#
# Retorna:
#   A URL publica da imagem no stdout (ultima linha)
# ==============================================================================

set -euo pipefail

# Carregar .env.local
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.local"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# Validar argumentos
if [ $# -lt 2 ]; then
  echo "Uso: $0 <slug> <caminho-da-imagem>"
  echo ""
  echo "Exemplo:"
  echo "  $0 \"filipe-luis-100-jogos\" \"/tmp/imagem.jpg\""
  exit 1
fi

SLUG="$1"
IMAGE_PATH="$2"

# Validar variaveis de ambiente
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID nao configurada}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY nao configurada}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID nao configurada}"
: "${R2_BUCKET_NAME:=beiradocampo}"
: "${R2_PUBLIC_URL:=https://pub-b064ffca19cd4d36a0ab9ad642dfe6fd.r2.dev}"

# Validar arquivo
if [ ! -f "$IMAGE_PATH" ]; then
  echo "❌ Arquivo nao encontrado: $IMAGE_PATH"
  exit 1
fi

# Config
R2_ENDPOINT="https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_KEY="articles/${SLUG}.png"
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "📤 Fazendo upload da imagem para: $SLUG"
echo "📁 Arquivo: $IMAGE_PATH"

# Converter para PNG se necessario e redimensionar
FILE_EXT="${IMAGE_PATH##*.}"
if [ "$FILE_EXT" = "jpg" ] || [ "$FILE_EXT" = "jpeg" ]; then
  echo "🔄 Convertendo JPG para PNG..."
  convert "$IMAGE_PATH" -resize 1200x675^ -gravity center -extent 1200x675 "$TMP_DIR/image.png" 2>/dev/null || cp "$IMAGE_PATH" "$TMP_DIR/image.png"
else
  cp "$IMAGE_PATH" "$TMP_DIR/image.png"
fi

IMAGE_SIZE=$(wc -c < "$TMP_DIR/image.png" | tr -d ' ')
echo "📊 Tamanho: $(( IMAGE_SIZE / 1024 ))KB"

# AWS Signature V4 signing
CONTENT_TYPE="image/png"
CONTENT_SHA256=$(openssl dgst -sha256 -hex "$TMP_DIR/image.png" | awk '{print $NF}')
DATE_STAMP=$(date -u +%Y%m%d)
DATETIME=$(date -u +%Y%m%dT%H%M%SZ)
REGION="auto"
SERVICE="s3"

# Canonical request
CANONICAL_URI="/${R2_BUCKET_NAME}/${R2_KEY}"
CANONICAL_QUERYSTRING=""
CANONICAL_HEADERS="content-type:${CONTENT_TYPE}\nhost:${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com\nx-amz-content-sha256:${CONTENT_SHA256}\nx-amz-date:${DATETIME}\n"
SIGNED_HEADERS="content-type;host;x-amz-content-sha256;x-amz-date"

CANONICAL_REQUEST="PUT\n${CANONICAL_URI}\n${CANONICAL_QUERYSTRING}\n${CANONICAL_HEADERS}\n${SIGNED_HEADERS}\n${CONTENT_SHA256}"
CANONICAL_REQUEST_HASH=$(printf "$CANONICAL_REQUEST" | openssl dgst -sha256 -hex | awk '{print $NF}')

# String to sign
CREDENTIAL_SCOPE="${DATE_STAMP}/${REGION}/${SERVICE}/aws4_request"
STRING_TO_SIGN="AWS4-HMAC-SHA256\n${DATETIME}\n${CREDENTIAL_SCOPE}\n${CANONICAL_REQUEST_HASH}"

# Signing key
sign() { printf "$2" | openssl dgst -sha256 -hex -mac HMAC -macopt "hexkey:$1" | awk '{print $NF}'; }
HEX_SECRET=$(printf "AWS4${R2_SECRET_ACCESS_KEY}" | xxd -p -c 256)
K_DATE=$(sign "$HEX_SECRET" "$DATE_STAMP")
K_REGION=$(sign "$K_DATE" "$REGION")
K_SERVICE=$(sign "$K_REGION" "$SERVICE")
K_SIGNING=$(sign "$K_SERVICE" "aws4_request")

SIGNATURE=$(printf "$STRING_TO_SIGN" | openssl dgst -sha256 -hex -mac HMAC -macopt "hexkey:${K_SIGNING}" | awk '{print $NF}')

AUTH_HEADER="AWS4-HMAC-SHA256 Credential=${R2_ACCESS_KEY_ID}/${CREDENTIAL_SCOPE}, SignedHeaders=${SIGNED_HEADERS}, Signature=${SIGNATURE}"

# Upload
echo "⏳ Enviando para R2..."
HTTP_STATUS=$(curl -s -o "$TMP_DIR/upload_response.txt" -w "%{http_code}" -X PUT \
  "${R2_ENDPOINT}/${R2_BUCKET_NAME}/${R2_KEY}" \
  -H "Content-Type: ${CONTENT_TYPE}" \
  -H "x-amz-content-sha256: ${CONTENT_SHA256}" \
  -H "x-amz-date: ${DATETIME}" \
  -H "Authorization: ${AUTH_HEADER}" \
  -H "Cache-Control: public, max-age=31536000, immutable" \
  --data-binary "@$TMP_DIR/image.png")

if [ "$HTTP_STATUS" -ge 200 ] && [ "$HTTP_STATUS" -lt 300 ]; then
  PUBLIC_URL="${R2_PUBLIC_URL}/${R2_KEY}"
  echo "✅ Upload OK (HTTP ${HTTP_STATUS})"
  echo "🔗 URL: ${PUBLIC_URL}"
  echo ""
  echo "$PUBLIC_URL"
else
  echo "❌ Upload falhou (HTTP ${HTTP_STATUS})"
  cat "$TMP_DIR/upload_response.txt"
  exit 1
fi
