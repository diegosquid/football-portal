#!/bin/bash
# ==============================================================================
# generate-image.sh — Gera imagem com Gemini e faz upload no Cloudflare R2
#
# Uso:
#   ./scripts/generate-image.sh "SLUG-DO-ARTIGO" "PROMPT EM INGLES"
#
# Exemplo:
#   ./scripts/generate-image.sh "flamengo-x-palmeiras-2026" \
#     "Maracana stadium packed with Flamengo fans in red and black, night match"
#
# Requisitos:
#   - curl, python3, openssl (todos presentes por padrao no macOS/Linux)
#   - Variaveis de ambiente configuradas no .env.local (carregadas automaticamente)
#
# Retorna:
#   A URL publica da imagem no stdout (ultima linha)
# ==============================================================================

set -euo pipefail

# ── Carregar .env.local ───────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_DIR/.env.local"

if [ -f "$ENV_FILE" ]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# ── Validar argumentos ───────────────────────────────────────────────────────
if [ $# -lt 2 ]; then
  echo "Uso: $0 <slug> <prompt>"
  echo ""
  echo "Exemplo:"
  echo "  $0 \"flamengo-x-palmeiras-2026\" \"Maracana stadium packed with fans\""
  exit 1
fi

SLUG="$1"
PROMPT="$2"

# ── Validar variaveis de ambiente ─────────────────────────────────────────────
: "${GEMINI_API_KEY:?GEMINI_API_KEY nao configurada no .env.local}"
: "${R2_ACCESS_KEY_ID:?R2_ACCESS_KEY_ID nao configurada no .env.local}"
: "${R2_SECRET_ACCESS_KEY:?R2_SECRET_ACCESS_KEY nao configurada no .env.local}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID nao configurada no .env.local}"
: "${R2_BUCKET_NAME:=beiradocampo}"
: "${R2_PUBLIC_URL:=https://pub-b064ffca19cd4d36a0ab9ad642dfe6fd.r2.dev}"

# ── Config ────────────────────────────────────────────────────────────────────
GEMINI_MODEL="gemini-3.1-flash-image-preview"
GEMINI_ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent"
R2_ENDPOINT="https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com"
R2_KEY="articles/${SLUG}.png"
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "🎨 Gerando imagem para: $SLUG"
echo "📝 Prompt: ${PROMPT:0:80}..."

# ── PASSO 1: Gerar imagem com Gemini ─────────────────────────────────────────
SYSTEM_PROMPT="You are a photojournalistic image generator for a Brazilian football news portal. Generate images with AUTHENTIC PHOTOJOURNALISTIC STYLE — never cartoon or illustration. STYLE REQUIREMENTS: Natural lighting (daylight or stadium floodlights), realistic film grain texture, dynamic angles from field-level photographer perspective, shallow depth of field (background blur), realistic colors without oversaturation, professional sports photography aesthetic (300mm lens look). For matches: capture atmosphere, crowd, stadium lights. For transfers: conceptual photojournalism with silhouettes and team colors. For opinions: documentary-style environmental shots. For statistics: realistic data/workspace environments. IMPORTANT: NO text, NO watermarks, NO logos, NO identifiable faces of real people, NO cartoon or illustrated styles — ONLY photorealistic photojournalism."

GEMINI_BODY=$(cat <<EOF
{
  "contents": [{
    "parts": [{"text": "${SYSTEM_PROMPT}\n\nGenerate an image: ${PROMPT}"}]
  }],
  "generationConfig": {
    "responseModalities": ["IMAGE", "TEXT"]
  }
}
EOF
)

echo "⏳ Chamando Gemini API..."
GEMINI_RESPONSE=$(curl -s -X POST \
  "${GEMINI_ENDPOINT}?key=${GEMINI_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$GEMINI_BODY")

# Extrair imagem base64 do response (campo inlineData.data)
IMAGE_BASE64=$(echo "$GEMINI_RESPONSE" | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    parts = data['candidates'][0]['content']['parts']
    for p in parts:
        if 'inlineData' in p and p['inlineData'].get('mimeType','').startswith('image/'):
            print(p['inlineData']['data'])
            sys.exit(0)
        if 'inline_data' in p and p['inline_data'].get('mime_type','').startswith('image/'):
            print(p['inline_data']['data'])
            sys.exit(0)
    # Nao encontrou imagem — mostrar texto de erro
    for p in parts:
        if 'text' in p:
            print('ERROR:' + p['text'], file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'ERROR: {e}', file=sys.stderr)
    print(f'Response: {json.dumps(data)[:200]}', file=sys.stderr)
    sys.exit(1)
")

if [ -z "$IMAGE_BASE64" ]; then
  echo "❌ Gemini nao retornou imagem"
  exit 1
fi

# Decodificar base64 para arquivo
echo "$IMAGE_BASE64" | base64 -d > "$TMP_DIR/image.png"
IMAGE_SIZE=$(wc -c < "$TMP_DIR/image.png" | tr -d ' ')
echo "✅ Imagem gerada: $(( IMAGE_SIZE / 1024 ))KB"

# ── PASSO 2: Upload para Cloudflare R2 (S3 API com AWS Signature v4) ─────────
echo "⏳ Fazendo upload para R2..."

# AWS Signature V4 signing
DATE_STAMP=$(date -u +%Y%m%d)
DATETIME=$(date -u +%Y%m%dT%H%M%SZ)
REGION="auto"
SERVICE="s3"
CONTENT_TYPE="image/png"
CONTENT_SHA256=$(openssl dgst -sha256 -hex "$TMP_DIR/image.png" | awk '{print $NF}')

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
