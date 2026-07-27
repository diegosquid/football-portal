# beiradocampo-api — Worker + D1

API no Cloudflare para **notificações push** e **newsletter**, substituindo o Supabase.

```
Site (Vercel)                 Cloudflare Worker              D1
  opt-in de push  ──POST──►   /push/subscribe        ──►  push_subscriptions
  form newsletter ──POST──►   /newsletter            ──►  newsletter_subscribers

  Cron 08:05 BRT  ──►  busca /api/palpites-do-dia no site
                       └─►  dispara push para todos os inscritos
                            (sem payload — o service worker busca o texto)
```

## Setup (uma vez)

**1. Instalar o wrangler e logar**

```bash
npm install -g wrangler
wrangler login
```

**2. Criar o banco D1**

```bash
cd workers/api
wrangler d1 create beiradocampo
```

Copie o `database_id` devolvido para o `wrangler.toml`.

**3. Criar as tabelas**

```bash
wrangler d1 execute beiradocampo --remote --file=./schema.sql
```

**4. Gerar as chaves VAPID**

```bash
node ../../scripts/generate-vapid-keys.js
```

O script imprime onde cada chave vai. Resumo:

| Chave | Onde | Segredo? |
|---|---|---|
| `VAPID_PUBLIC_KEY` | `wrangler.toml` **e** `.env.local` do site (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) | não |
| `VAPID_PRIVATE_KEY` | `wrangler secret put VAPID_PRIVATE_KEY` | **sim** |

> Gere **uma vez só**. Trocar as chaves depois invalida todas as inscrições existentes.

**5. Criar o token do painel admin**

```bash
# gere um token forte
openssl rand -base64 32

wrangler secret put ADMIN_TOKEN
# cole o token gerado
```

Esse token abre o painel em `beiradocampo.com.br/admin`. Guarde no gerenciador de senhas — ele fica só no seu navegador (localStorage), nunca no build.

**6. Deploy**

```bash
wrangler deploy
```

Anote a URL (`https://beiradocampo-api.<subdominio>.workers.dev`) e coloque no `.env.local` do site:

```
NEXT_PUBLIC_API_URL=https://beiradocampo-api.<subdominio>.workers.dev
API_URL=https://beiradocampo-api.<subdominio>.workers.dev
```

Na Vercel, adicione as mesmas duas variáveis.

**7. Migrar a newsletter do Supabase**

```bash
node ../../scripts/migrate-newsletter.js
wrangler d1 execute beiradocampo --remote --file=./import-newsletter.sql
```

## Verificar

```bash
curl https://beiradocampo-api.<subdominio>.workers.dev/health
```

Retorna número de inscritos e o último envio de push.

**Testar o cron sem esperar o horário:**

```bash
wrangler dev --test-scheduled
# noutro terminal:
curl "http://localhost:8787/__scheduled?cron=5+11+*+*+*"
```

## Painel admin

`https://beiradocampo.com.br/admin` — pede o `ADMIN_TOKEN` e mostra:

- inscritos em push (e quantos entraram nos últimos 7 dias)
- inscritos na newsletter
- cliques de hoje, por tipo (30 dias) e por dia (14 dias)
- resultado do último envio de push

A página é `noindex` e está no `Disallow` do robots.txt. O token fica no
localStorage do seu navegador e é validado no Worker — nada é embutido no build.

Endpoints (exigem `Authorization: Bearer <ADMIN_TOKEN>`):

```bash
curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://beiradocampo-api.<subdominio>.workers.dev/admin/stats

curl -H "Authorization: Bearer $ADMIN_TOKEN" \
  https://beiradocampo-api.<subdominio>.workers.dev/admin/clicks
```

## Tracking de cliques

`trackClick()` (em `src/lib/track.ts`) dispara nos dois lugares:

| Destino | Para quê |
|---|---|
| GA4 (`gtag`) | relatórios prontos |
| Worker → D1 | **dado próprio**, consultável, base de atribuição de afiliado |

Usa `sendBeacon`, então o clique é registrado mesmo quando a página já está
navegando para fora. Já está ligado no botão de WhatsApp (`share_whatsapp`).

Para rastrear um novo link (ex.: afiliado de bet):

```ts
trackClick({ event: "afiliado", label: "casa-x", url: destino });
```

## Operação

- **Cron**: `5 11 * * *` UTC = **08:05 BRT**, depois da routine que atualiza os palpites (07h).
- **Só notifica se houver jogo** — o Worker consulta `/api/palpites-do-dia` e aborta se `hasContent: false`.
- **Limpeza automática**: inscrição que responde 404/410 é desativada sozinha.
- **Log**: cada envio grava uma linha em `push_log` (total/ok/falha/removidas).

```bash
wrangler d1 execute beiradocampo --remote \
  --command "SELECT * FROM push_log ORDER BY id DESC LIMIT 10"
```

## Remover o Supabase (depois da migração)

Quando o D1 estiver com todos os e-mails:

1. Apagar o bloco do Supabase em `src/app/api/newsletter/route.ts`
2. Apagar `src/lib/supabase.ts`
3. `npm uninstall @supabase/supabase-js`
4. Remover `NEXT_PUBLIC_SUPABASE_*` do `.env.local` e da Vercel

## Custo

Tudo dentro do free tier do Cloudflare: D1 (5 GB, 5M leituras/dia), Workers (100k req/dia) e 3 cron triggers. O volume aqui é de ordens de grandeza menor.
