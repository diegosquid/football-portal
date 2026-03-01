#!/bin/bash
# ==============================================================================
# post-to-twitter.sh — Posta um artigo no Twitter/X
#
# Uso:
#   ./scripts/post-to-twitter.sh "SLUG-DO-ARTIGO"
#
# Exemplo:
#   ./scripts/post-to-twitter.sh "numeros-brasileirao-2026-4-rodadas-dados"
#
# Requisitos:
#   - Variáveis TWITTER_* configuradas no .env.local
#   - curl instalado
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
if [ $# -lt 1 ]; then
  echo "Uso: $0 <slug-do-artigo>"
  echo ""
  echo "Exemplo:"
  echo "  $0 \"numeros-brasileirao-2026-4-rodadas-dados\""
  exit 1
fi

SLUG="$1"
ARTICLE_FILE="$PROJECT_DIR/content/articles/${SLUG}.mdx"

# Validar variáveis de ambiente
: "${TWITTER_CONSUMER_KEY:?TWITTER_CONSUMER_KEY não configurada no .env.local}"
: "${TWITTER_CONSUMER_SECRET:?TWITTER_CONSUMER_SECRET não configurada no .env.local}"
: "${TWITTER_ACCESS_TOKEN:?TWITTER_ACCESS_TOKEN não configurada no .env.local}"
: "${TWITTER_ACCESS_TOKEN_SECRET:?TWITTER_ACCESS_TOKEN_SECRET não configurada no .env.local}"

# Verificar se o arquivo existe
if [ ! -f "$ARTICLE_FILE" ]; then
  echo "❌ Artigo não encontrado: $ARTICLE_FILE"
  exit 1
fi

echo "📝 Lendo artigo: $SLUG"

# Extrair título do frontmatter
TITLE=$(grep -E "^title:" "$ARTICLE_FILE" | head -1 | sed 's/title: "\(.*\)"/\1/' | sed 's/^title: //' | tr -d '"')

if [ -z "$TITLE" ]; then
  echo "❌ Não foi possível extrair o título do artigo"
  exit 1
fi

echo "📰 Título: $TITLE"

# Criar texto do tweet
URL="https://beiradocampo.com.br/${SLUG}"
TWEET_TEXT="${TITLE}

${URL}"

echo "🐦 Texto do tweet:"
echo "---"
echo "$TWEET_TEXT"
echo "---"

# Postar no Twitter usando API v2
echo "⏳ Postando no Twitter..."

# Nota: A API v2 do Twitter requer OAuth 2.0 ou OAuth 1.0a
# Este é um exemplo simplificado - em produção usar uma biblioteca como twurl ou tweepy

# Usando OAuth 1.0a com curl (simplificado)
# Em um script real, você precisaria implementar a assinatura OAuth 1.0a

echo ""
echo "⚠️  NOTA: Postagem automática requer implementação OAuth 1.0a"
echo "Para testar manualmente, use o tweet-deck ou a API com uma biblioteca Node.js/Python"
echo ""
echo "Credenciais configuradas:"
echo "  Consumer Key: ${TWITTER_CONSUMER_KEY:0:10}..."
echo "  Access Token: ${TWITTER_ACCESS_TOKEN:0:20}..."
echo ""
echo "Texto que seria postado:"
echo "$TWEET_TEXT"
