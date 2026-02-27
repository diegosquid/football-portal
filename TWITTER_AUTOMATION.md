# Automacao de Posts no X (Twitter) — Free Tier

> Guia completo para postar automaticamente no X/Twitter quando um novo artigo for publicado no portal.
> Usa o **Free Tier** da X API (500 posts/mes, custo zero).

---

## Indice

1. [Visao Geral](#1-visao-geral)
2. [Criar Conta de Desenvolvedor no X](#2-criar-conta-de-desenvolvedor-no-x)
3. [Obter as API Keys](#3-obter-as-api-keys)
4. [Autenticacao: OAuth 1.0a (Recomendado)](#4-autenticacao-oauth-10a-recomendado)
5. [Script de Postagem (Node.js)](#5-script-de-postagem-nodejs)
6. [Script de Postagem (Bash + curl)](#6-script-de-postagem-bash--curl)
7. [API Route Next.js (Opcional)](#7-api-route-nextjs-opcional)
8. [Integrar no Fluxo do Cron](#8-integrar-no-fluxo-do-cron)
9. [Formato dos Tweets](#9-formato-dos-tweets)
10. [Limites e Boas Praticas](#10-limites-e-boas-praticas)
11. [Variaveis de Ambiente](#11-variaveis-de-ambiente)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Visao Geral

### Fluxo

```
Cron publica artigo (.mdx)
  │
  ├── git commit + push (ja existente)
  │
  └── Posta tweet automaticamente
        │
        ├── Extrai titulo + slug do frontmatter
        ├── Formata tweet (titulo + link + hashtags)
        └── POST https://api.x.com/2/tweets
```

### Limites do Free Tier

| Recurso | Limite |
|---------|--------|
| Posts por mes | 500 |
| Posts por 24h (rate limit) | ~17 (500/30) |
| Apps por conta | 1 projeto, 1 app |
| Leitura de tweets | 1 req / 15 min |
| Custo | **Gratis** |

> Para o portal (~8 artigos/dia = ~240 tweets/mes), o free tier e mais que suficiente.

---

## 2. Criar Conta de Desenvolvedor no X

### Passo a passo

1. Acesse: **https://developer.x.com/en/portal/petition/essential/basic-info**
2. Faca login com a conta do X onde os tweets serao postados (ex: @beiradocampo)
3. Selecione **"Sign up for Free Account"**
4. Descreva o uso em 250+ caracteres. Exemplo:

```
I am building an automated news portal that publishes football articles
daily. The Twitter integration will automatically share article headlines
and links when new content is published on our website. Each tweet will
contain the article title, a brief description, and a link to the full
article on our portal. This helps our readers stay updated with the
latest football news directly on their Twitter feed.
```

5. Aceite os termos de uso
6. Pronto — voce tera acesso ao **Developer Portal**

---

## 3. Obter as API Keys

### 3.1 Criar Projeto e App

1. No Developer Portal, va em **Projects & Apps**
2. Crie um novo projeto (ex: "Beira do Campo")
3. Crie um app dentro do projeto (ex: "Portal Bot")

### 3.2 Gerar as 4 Chaves (OAuth 1.0a)

No app criado, va em **Keys and Tokens** e gere:

| Chave | Variavel de Ambiente | Descricao |
|-------|---------------------|-----------|
| API Key | `X_API_KEY` | Consumer key do app |
| API Key Secret | `X_API_SECRET` | Consumer secret do app |
| Access Token | `X_ACCESS_TOKEN` | Token de acesso da SUA conta |
| Access Token Secret | `X_ACCESS_TOKEN_SECRET` | Secret do token de acesso |

> **IMPORTANTE:** Na aba **User authentication settings**, configure:
> - **App permissions:** "Read and Write" (nao so Read!)
> - **Type of App:** "Web App, Automated App or Bot"
> - **Callback URL:** `https://seudominio.com.br/callback` (pode ser qualquer URL valida)
> - **Website URL:** `https://seudominio.com.br`

### 3.3 Salvar no .env.local

```env
# X (Twitter) API — Free Tier
X_API_KEY=sua-api-key
X_API_SECRET=seu-api-secret
X_ACCESS_TOKEN=seu-access-token
X_ACCESS_TOKEN_SECRET=seu-access-token-secret
```

---

## 4. Autenticacao: OAuth 1.0a (Recomendado)

### Por que OAuth 1.0a e nao OAuth 2.0?

| | OAuth 1.0a | OAuth 2.0 (PKCE) |
|--|-----------|------------------|
| Setup | 4 chaves fixas, sem refresh | Precisa de auth flow + refresh a cada 2h |
| Ideal para | Bots e automacao | Apps interativos com login de usuario |
| Complexidade | Baixa (uma vez) | Alta (token management) |
| Free Tier | Funciona | Funciona |

**Para automacao (cron/bot), OAuth 1.0a e muito mais simples.** As 4 chaves sao fixas e nunca expiram.

### Endpoint

```
POST https://api.x.com/2/tweets
Content-Type: application/json
Authorization: OAuth oauth_consumer_key="...", oauth_token="...", oauth_signature="...", ...

{
  "text": "Conteudo do tweet aqui"
}
```

---

## 5. Script de Postagem (Node.js)

### 5.1 Instalar dependencia

```bash
npm install twitter-api-v2
```

### 5.2 Script: `scripts/post-tweet.mjs`

```javascript
#!/usr/bin/env node
// ==============================================================================
// post-tweet.mjs — Posta tweet automaticamente via X API v2 (Free Tier)
//
// Uso:
//   node scripts/post-tweet.mjs "Texto do tweet aqui"
//
// Ou com slug (gera tweet a partir do frontmatter do artigo):
//   node scripts/post-tweet.mjs --article "slug-do-artigo"
//
// Requisitos:
//   - npm install twitter-api-v2
//   - Variaveis X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
// ==============================================================================

import { TwitterApi } from "twitter-api-v2";
import { readFileSync } from "fs";
import { resolve } from "path";

// ── Carregar .env.local ─────────────────────────────────────────────
function loadEnv() {
  try {
    const envFile = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8");
    for (const line of envFile.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIndex = trimmed.indexOf("=");
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // .env.local pode nao existir em producao
  }
}

loadEnv();

// ── Config ──────────────────────────────────────────────────────────
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://beiradocampo.com.br";

const client = new TwitterApi({
  appKey: process.env.X_API_KEY,
  appSecret: process.env.X_API_SECRET,
  accessToken: process.env.X_ACCESS_TOKEN,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET,
});

// ── Extrair frontmatter de um artigo MDX ────────────────────────────
function getArticleMeta(slug) {
  const filePath = resolve(process.cwd(), `content/articles/${slug}.mdx`);
  const content = readFileSync(filePath, "utf-8");
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) throw new Error(`Frontmatter nao encontrado: ${slug}`);

  const fm = frontmatterMatch[1];
  const get = (key) => {
    const match = fm.match(new RegExp(`^${key}:\\s*"?(.+?)"?\\s*$`, "m"));
    return match ? match[1].replace(/^"|"$/g, "") : null;
  };
  const getArray = (key) => {
    const match = fm.match(new RegExp(`^${key}:\\s*\\[(.+?)\\]`, "m"));
    if (!match) return [];
    return match[1].split(",").map((s) => s.trim().replace(/"/g, ""));
  };

  return {
    title: get("title"),
    slug: get("slug") || slug,
    excerpt: get("excerpt"),
    category: get("category"),
    tags: getArray("tags"),
    teams: getArray("teams"),
  };
}

// ── Formatar tweet ──────────────────────────────────────────────────
function formatTweet(meta) {
  const url = `${SITE_URL}/${meta.slug}`;

  // Hashtags: pegar as 2-3 tags mais relevantes
  const hashtags = meta.tags
    .slice(0, 3)
    .map((t) => `#${t.replace(/-/g, "").replace(/\s+/g, "")}`)
    .join(" ");

  // Tweet: titulo + link + hashtags
  // Limite: 280 chars. URL conta como ~23 chars (t.co).
  // Entao temos ~257 chars pro resto.
  let tweet = `${meta.title}\n\n${url}`;

  // Adicionar hashtags se couber
  if (tweet.length + 1 + hashtags.length <= 280) {
    tweet += `\n${hashtags}`;
  }

  return tweet;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);

  let tweetText;

  if (args[0] === "--article" && args[1]) {
    // Modo artigo: gerar tweet a partir do MDX
    const meta = getArticleMeta(args[1]);
    tweetText = formatTweet(meta);
    console.log(`📰 Artigo: ${meta.title}`);
  } else if (args[0] && args[0] !== "--article") {
    // Modo texto livre
    tweetText = args.join(" ");
  } else {
    console.error("Uso:");
    console.error('  node scripts/post-tweet.mjs "Texto do tweet"');
    console.error('  node scripts/post-tweet.mjs --article "slug-do-artigo"');
    process.exit(1);
  }

  // Validar
  if (tweetText.length > 280) {
    console.error(`❌ Tweet muito longo: ${tweetText.length} chars (max 280)`);
    process.exit(1);
  }

  console.log(`\n🐦 Tweet (${tweetText.length}/280 chars):`);
  console.log(`───────────────────────────────`);
  console.log(tweetText);
  console.log(`───────────────────────────────\n`);

  // Postar
  try {
    const { data } = await client.v2.tweet(tweetText);
    console.log(`✅ Tweet postado!`);
    console.log(`🔗 https://x.com/i/status/${data.id}`);
  } catch (error) {
    console.error(`❌ Erro ao postar:`, error.message || error);
    if (error.data) console.error(`   Detalhes:`, JSON.stringify(error.data));
    process.exit(1);
  }
}

main();
```

### 5.3 Uso

```bash
# Tweet a partir de um artigo
node scripts/post-tweet.mjs --article "neymar-noite-gala-santos-vasco-brasileirao-2026"

# Tweet com texto livre
node scripts/post-tweet.mjs "Novo artigo no Beira do Campo! Confira as ultimas noticias."
```

### 5.4 Output esperado

```
📰 Artigo: Neymar brilha em 'noite de gala' pelo Santos: dois gols contra o Vasco

🐦 Tweet (198/280 chars):
───────────────────────────────
Neymar brilha em 'noite de gala' pelo Santos: dois gols contra o Vasco

https://beiradocampo.com.br/neymar-noite-gala-santos-vasco-brasileirao-2026
#santos #neymar #brasileirao
───────────────────────────────

✅ Tweet postado!
🔗 https://x.com/i/status/1234567890
```

---

## 6. Script de Postagem (Bash + curl)

Alternativa sem Node.js, usando apenas bash e python3 para assinar OAuth 1.0a.

### `scripts/post-tweet.sh`

```bash
#!/bin/bash
# ==============================================================================
# post-tweet.sh — Posta tweet via X API v2 usando OAuth 1.0a (sem dependencias)
#
# Uso:
#   ./scripts/post-tweet.sh "Texto do tweet aqui"
#
# Requisitos:
#   - curl, python3, openssl
#   - Variaveis no .env.local: X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
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

# Validar
: "${X_API_KEY:?X_API_KEY nao configurada}"
: "${X_API_SECRET:?X_API_SECRET nao configurada}"
: "${X_ACCESS_TOKEN:?X_ACCESS_TOKEN nao configurada}"
: "${X_ACCESS_TOKEN_SECRET:?X_ACCESS_TOKEN_SECRET nao configurada}"

TWEET_TEXT="$1"

if [ -z "$TWEET_TEXT" ]; then
  echo "Uso: $0 \"Texto do tweet\""
  exit 1
fi

if [ ${#TWEET_TEXT} -gt 280 ]; then
  echo "❌ Tweet muito longo: ${#TWEET_TEXT} chars (max 280)"
  exit 1
fi

echo "🐦 Postando tweet (${#TWEET_TEXT}/280 chars)..."

# Gerar OAuth 1.0a signature via python3
RESPONSE=$(python3 - "$TWEET_TEXT" <<'PYEOF'
import sys, os, time, hashlib, hmac, base64, urllib.parse, json, uuid

tweet_text = sys.argv[1]

# Credenciais
consumer_key = os.environ["X_API_KEY"]
consumer_secret = os.environ["X_API_SECRET"]
access_token = os.environ["X_ACCESS_TOKEN"]
access_token_secret = os.environ["X_ACCESS_TOKEN_SECRET"]

# Parametros OAuth
url = "https://api.x.com/2/tweets"
method = "POST"
timestamp = str(int(time.time()))
nonce = uuid.uuid4().hex

oauth_params = {
    "oauth_consumer_key": consumer_key,
    "oauth_nonce": nonce,
    "oauth_signature_method": "HMAC-SHA256",
    "oauth_timestamp": timestamp,
    "oauth_token": access_token,
    "oauth_version": "1.0",
}

# Criar signature base string
params_str = "&".join(
    f"{urllib.parse.quote(k, safe='')}={urllib.parse.quote(v, safe='')}"
    for k, v in sorted(oauth_params.items())
)

base_string = (
    f"{method}&{urllib.parse.quote(url, safe='')}&{urllib.parse.quote(params_str, safe='')}"
)

signing_key = (
    f"{urllib.parse.quote(consumer_secret, safe='')}&{urllib.parse.quote(access_token_secret, safe='')}"
)

signature = base64.b64encode(
    hmac.new(signing_key.encode(), base_string.encode(), hashlib.sha256).digest()
).decode()

oauth_params["oauth_signature"] = signature

# Construir Authorization header
auth_header = "OAuth " + ", ".join(
    f'{urllib.parse.quote(k, safe="")}="{urllib.parse.quote(v, safe="")}"'
    for k, v in sorted(oauth_params.items())
)

# Fazer request
import urllib.request

req = urllib.request.Request(url, method="POST")
req.add_header("Authorization", auth_header)
req.add_header("Content-Type", "application/json")
req.data = json.dumps({"text": tweet_text}).encode()

try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read())
        tweet_id = data.get("data", {}).get("id", "?")
        print(f"OK:{tweet_id}")
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"ERROR:{e.code}:{body}", file=sys.stderr)
    sys.exit(1)
PYEOF
)

if [[ "$RESPONSE" == OK:* ]]; then
  TWEET_ID="${RESPONSE#OK:}"
  echo "✅ Tweet postado!"
  echo "🔗 https://x.com/i/status/${TWEET_ID}"
else
  echo "❌ Falha ao postar tweet"
  exit 1
fi
```

```bash
chmod +x scripts/post-tweet.sh
```

---

## 7. API Route Next.js (Opcional)

Se preferir uma API route no portal (util para futuras integracoes):

### `src/app/api/twitter/post/route.ts`

```typescript
import { NextResponse } from "next/server";
import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_TOKEN_SECRET!,
});

export async function POST(request: Request) {
  // Proteger endpoint com secret
  const { text, secret } = await request.json();

  if (secret !== process.env.TWITTER_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!text || text.length > 280) {
    return NextResponse.json({ error: "Tweet invalido" }, { status: 400 });
  }

  try {
    const { data } = await client.v2.tweet(text);
    return NextResponse.json({
      id: data.id,
      url: `https://x.com/i/status/${data.id}`,
    });
  } catch (error: any) {
    console.error("[twitter] Erro:", error);
    return NextResponse.json(
      { error: error.message, details: error.data },
      { status: 500 }
    );
  }
}
```

---

## 8. Integrar no Fluxo do Cron

### 8.1 Adicionar ao CRON.MD (Passo 7 atualizado)

No fluxo de cada execucao, adicionar apos o git push:

```
├── PASSO 7: SALVAR, COMMITAR E DIVULGAR
│   ├── Salvar arquivo MDX
│   ├── git add + commit + push
│   └── POSTAR TWEET
│       ├── Extrair titulo e slug do artigo recem-criado
│       ├── Formatar tweet: titulo + URL + hashtags
│       ├── Executar: node scripts/post-tweet.mjs --article "SLUG"
│       └── Se falhar → logar erro, nao bloquear publicacao
```

### 8.2 Comando para o agente cron

Apos o `git push`, o agente deve rodar:

```bash
# Postar tweet do artigo recem-publicado
node scripts/post-tweet.mjs --article "SLUG-DO-ARTIGO"
```

### 8.3 Exemplo completo no cron

```bash
# 1. Salvar artigo
# (ja feito pelo agente)

# 2. Commit + Push
git add content/articles/neymar-noite-gala-santos-vasco-brasileirao-2026.mdx
git commit -m "content(news): Neymar brilha com dois gols contra o Vasco"
git push origin main

# 3. Postar tweet
node scripts/post-tweet.mjs --article "neymar-noite-gala-santos-vasco-brasileirao-2026"
```

---

## 9. Formato dos Tweets

### 9.1 Template Padrao

```
[TITULO DO ARTIGO]

[URL DO ARTIGO]
[HASHTAGS]
```

### 9.2 Budget de caracteres

| Parte | Chars |
|-------|-------|
| URL (t.co encurta para ~23 chars) | ~23 |
| Quebras de linha | ~3 |
| Hashtags (2-3) | ~30-50 |
| **Sobra para titulo** | **~200** |

### 9.3 Exemplos por tipo de artigo

**Noticia:**
```
Flamengo anuncia reforço de peso para o meio-campo na temporada 2026

https://beiradocampo.com.br/flamengo-anuncia-reforco-meio-campo-temporada-2026
#flamengo #transferencias #brasileirao
```

**Pre-jogo:**
```
Flamengo x Lanus: escalação, onde assistir e análise tática — Recopa 2026

https://beiradocampo.com.br/flamengo-x-lanus-escalacao-onde-assistir-recopa-2026
#flamengo #recopa
```

**Opiniao:**
```
O VAR está matando a emoção do futebol brasileiro? Neide Ferreira não tem medo de falar

https://beiradocampo.com.br/opiniao-var-esta-matando-emocao-futebol
#opiniao #VAR #futebol
```

**Analise com dados:**
```
Os números do Brasileirão 2026: o que 4 rodadas revelam sobre o campeonato

https://beiradocampo.com.br/numeros-brasileirao-2026-4-rodadas-dados
#brasileirao #estatisticas
```

### 9.4 Regras de hashtags

```
PRIORIDADE:
1. Nome do time principal (ex: #flamengo, #palmeiras)
2. Competicao (ex: #brasileirao, #libertadores, #championsleague)
3. Tema (ex: #transferencias, #neymar, #VAR)

MAX: 3 hashtags por tweet
FORMATO: sem acentos, sem hifens, tudo junto (ex: #brasileirao, nao #brasileirão)
```

---

## 10. Limites e Boas Praticas

### 10.1 Rate Limits (Free Tier)

| Endpoint | Limite |
|----------|--------|
| POST /2/tweets | 500/mes total |
| POST /2/tweets | ~17/dia (media) |
| Por 15 minutos | Nao documentado oficialmente, mas ~1-5 |

### 10.2 Boas praticas

- **Nunca postar tweets duplicados** — X pode suspender a conta
- **Espaco minimo entre tweets:** 5 minutos (evitar spam flag)
- **Nao exceder 10-12 tweets por dia** mesmo que o limite permita mais
- **Variar o formato:** nao usar sempre o mesmo template exato
- **Se o tweet falhar, nao bloquear a publicacao do artigo**
- **Logar todos os tweets postados** para controle

### 10.3 Monitoramento

```bash
# Ver quantos tweets restam no mes
# O header x-rate-limit-remaining no response indica o restante
```

### 10.4 O que NAO fazer

- ❌ Postar o mesmo tweet 2x
- ❌ Postar mais de 15 tweets em 1 hora
- ❌ Incluir links encurtados suspeitos (bit.ly etc — usar URL do dominio direto)
- ❌ Fazer mass-follow/unfollow (suspensao)
- ❌ Postar durante madrugada (ninguem ve, gasta cota)

---

## 11. Variaveis de Ambiente

Adicionar ao `.env.local`:

```env
# X (Twitter) API — Free Tier OAuth 1.0a
X_API_KEY=                         # Consumer Key (API Key)
X_API_SECRET=                      # Consumer Secret (API Key Secret)
X_ACCESS_TOKEN=                    # Access Token (da sua conta)
X_ACCESS_TOKEN_SECRET=             # Access Token Secret

# Opcional: proteger API route
TWITTER_WEBHOOK_SECRET=            # Secret para proteger /api/twitter/post
```

Adicionar a Vercel (se usar API route):

```bash
vercel env add X_API_KEY
vercel env add X_API_SECRET
vercel env add X_ACCESS_TOKEN
vercel env add X_ACCESS_TOKEN_SECRET
```

---

## 12. Troubleshooting

### Erro 401 Unauthorized

```
Causa: Chaves invalidas ou permissao incorreta
Solucao:
  1. Verificar se as 4 chaves estao corretas no .env.local
  2. No Developer Portal → App → User authentication settings
  3. Confirmar: App permissions = "Read and Write" (nao so "Read"!)
  4. Regenerar Access Token e Secret APOS mudar permissoes
```

### Erro 403 Forbidden

```
Causa: Free tier nao permite este endpoint, ou conta suspensa
Solucao:
  1. Confirmar que a conta esta no Free tier (nao em "Essential" antigo)
  2. Verificar se o app nao foi suspenso no Developer Portal
  3. POST /2/tweets funciona no Free tier — verificar se o endpoint esta correto
```

### Erro 429 Too Many Requests

```
Causa: Rate limit excedido
Solucao:
  1. Esperar o reset (header x-rate-limit-reset indica quando)
  2. Reduzir frequencia de postagem
  3. Implementar retry com backoff exponencial
```

### Tweet duplicado rejeitado

```
Causa: X rejeita tweets com texto identico postados recentemente
Solucao:
  1. Variar minimamente o texto (adicionar emoji, mudar hashtags)
  2. Verificar se o artigo nao ja foi tweetado antes
```

### Chaves nao carregam

```
Causa: .env.local nao esta sendo lido
Solucao:
  1. Verificar se o arquivo existe na raiz do projeto
  2. Verificar se nao tem espacos ao redor do "="
  3. Verificar se as chaves nao tem aspas extras
```

---

## Resumo Rapido (Copiar e Colar)

### Setup em 5 minutos:

```bash
# 1. Instalar dependencia
npm install twitter-api-v2

# 2. Adicionar chaves ao .env.local
echo 'X_API_KEY=sua-key' >> .env.local
echo 'X_API_SECRET=seu-secret' >> .env.local
echo 'X_ACCESS_TOKEN=seu-token' >> .env.local
echo 'X_ACCESS_TOKEN_SECRET=seu-token-secret' >> .env.local

# 3. Criar o script (copiar scripts/post-tweet.mjs deste guia)

# 4. Testar
node scripts/post-tweet.mjs "Testando automacao do Beira do Campo! 🔴⚫"

# 5. Usar no cron apos cada artigo
node scripts/post-tweet.mjs --article "slug-do-artigo"
```

---

> **Links uteis:**
> - [X Developer Portal](https://developer.x.com)
> - [X API v2 - Create Post](https://docs.x.com/x-api/posts/create-post)
> - [twitter-api-v2 (npm)](https://www.npmjs.com/package/twitter-api-v2)
> - [Pricing e Limites](https://getlate.dev/blog/twitter-api-pricing)
