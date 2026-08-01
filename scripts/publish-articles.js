#!/usr/bin/env node
/**
 * ==============================================================================
 * publish-articles.js — Publica artigos no R2 (sem build, sem deploy)
 * ==============================================================================
 *
 * Por que existe: publicar materia exigia commit + push + build completo na
 * Netlify (Velite recompila os 975 MDX + Next regenera as paginas). Eram ~190
 * builds/mes so de artigo, contra os 300 min/mes do plano.
 *
 * Como funciona: o Velite roda AQUI, local, e ja entrega o MDX compilado. Este
 * script grava esse resultado no R2 e chama /api/revalidate. O site le do R2 em
 * runtime (src/lib/articles.ts) — nenhum build envolvido.
 *
 * Uso:
 *   node scripts/publish-articles.js               # so o que mudou (hash) + indice
 *   node scripts/publish-articles.js SLUG [SLUG2]  # artigos especificos + indice
 *   node scripts/publish-articles.js --all         # tudo (seed inicial / resync)
 *   node scripts/publish-articles.js --dry-run     # mostra o que faria
 *   node scripts/publish-articles.js --no-revalidate
 */

const { readFileSync, writeFileSync, existsSync } = require("fs");
const { join } = require("path");
const path = require("path");
const crypto = require("crypto");
const { execFileSync } = require("child_process");
const {
  S3Client,
  PutObjectCommand,
  DeleteObjectsCommand,
} = require("@aws-sdk/client-s3");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const ROOT = join(__dirname, "..");
const VELITE_OUT = join(ROOT, ".velite", "articles.json");
/** slug -> hash do que ja foi publicado. Evita re-subir 975 arquivos por nada. */
const MANIFEST = join(ROOT, ".velite", "publish-manifest.json");

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME || "beiradocampo";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
const SITE_URL = process.env.SITE_URL || "https://beiradocampo.com.br";
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "";

const args = process.argv.slice(2);
const DRY_RUN = args.includes("--dry-run");
const ALL = args.includes("--all");
const NO_REVALIDATE = args.includes("--no-revalidate");
const slugArgs = args.filter((a) => !a.startsWith("--"));

if (!DRY_RUN && (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY)) {
  console.error(
    "ERRO: faltam CLOUDFLARE_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY no .env.local",
  );
  process.exit(1);
}

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY_ID,
    secretAccessKey: SECRET_ACCESS_KEY,
  },
});

/**
 * Campos do indice. PRECISA bater com INDEX_FIELDS em src/lib/articles.ts.
 *
 * Lista explicita em vez de "tudo menos o body": faq/metadata/source so
 * interessam a pagina do artigo (que busca articles/<slug>.json completo) e
 * dobrariam o indice — 1629 KB contra 770 KB, baixados a cada listagem.
 */
const INDEX_FIELDS = [
  "slug",
  "title",
  "excerpt",
  "date",
  "updated",
  "author",
  "category",
  "tags",
  "teams",
  "image",
  "featured",
  "draft",
  "readingTime",
  "permalink",
];

function toSummary(article) {
  const summary = {};
  for (const field of INDEX_FIELDS) summary[field] = article[field];
  return summary;
}

function hashOf(value) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(value))
    .digest("hex")
    .slice(0, 16);
}

function loadManifest() {
  try {
    return JSON.parse(readFileSync(MANIFEST, "utf-8"));
  } catch {
    return {};
  }
}

async function putJson(key, value) {
  if (DRY_RUN) return;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: Buffer.from(JSON.stringify(value)),
      ContentType: "application/json",
      // Curto de proposito: quem controla a frescura e o revalidate do Next.
      CacheControl: "public, max-age=60",
    }),
  );
}

/**
 * Avisa o site que o conteudo mudou. Sem isso o artigo ainda aparece, mas so
 * quando o ISR expirar (ate 15 min) — com isso, entra na hora.
 */
async function revalidate(slugs) {
  if (NO_REVALIDATE || DRY_RUN) return;
  if (!REVALIDATE_SECRET) {
    console.log(
      "  - REVALIDATE_SECRET nao configurado: pulando. O conteudo entra pelo ISR em ate 15 min.",
    );
    return;
  }
  try {
    const res = await fetch(`${SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": REVALIDATE_SECRET,
      },
      body: JSON.stringify({ slugs }),
    });
    if (res.ok) {
      console.log(`  ✓ revalidacao disparada (${slugs.length} slug(s))`);
    } else {
      console.log(
        `  ! revalidacao respondeu ${res.status} — conteudo entra pelo ISR em ate 15 min`,
      );
    }
  } catch (err) {
    console.log(
      `  ! revalidacao falhou (${err.message}) — conteudo entra pelo ISR em ate 15 min`,
    );
  }
}

async function main() {
  console.log("Compilando MDX com o Velite...");
  execFileSync("npx", ["velite", "build"], { cwd: ROOT, stdio: "pipe" });

  if (!existsSync(VELITE_OUT)) {
    console.error(`ERRO: ${VELITE_OUT} nao existe apos o velite build`);
    process.exit(1);
  }

  const articles = JSON.parse(readFileSync(VELITE_OUT, "utf-8"));
  if (!Array.isArray(articles) || articles.length === 0) {
    console.error("ERRO: velite gerou lista de artigos vazia — abortando");
    process.exit(1);
  }

  // Um artigo sem body compilado quebraria a pagina (MDXContent faz new Function).
  const semBody = articles.filter((a) => !a.body || !a.slug);
  if (semBody.length > 0) {
    console.error(
      `ERRO: ${semBody.length} artigo(s) sem body/slug — abortando: ${semBody
        .slice(0, 3)
        .map((a) => a.slug || "?")
        .join(", ")}`,
    );
    process.exit(1);
  }

  const manifest = loadManifest();

  let alvo;
  if (slugArgs.length > 0) {
    alvo = articles.filter((a) => slugArgs.includes(a.slug));
    const faltando = slugArgs.filter(
      (s) => !articles.some((a) => a.slug === s),
    );
    if (faltando.length > 0) {
      console.error(`ERRO: slug(s) nao encontrado(s): ${faltando.join(", ")}`);
      process.exit(1);
    }
  } else if (ALL) {
    alvo = articles;
  } else {
    alvo = articles.filter((a) => manifest[a.slug] !== hashOf(a));
  }

  console.log(
    `${articles.length} artigos no total, ${alvo.length} a publicar${DRY_RUN ? " (dry-run)" : ""}.`,
  );

  // Sobe os artigos em lotes — 975 uploads simultaneos estouraria conexao.
  const LOTE = 20;
  for (let i = 0; i < alvo.length; i += LOTE) {
    const lote = alvo.slice(i, i + LOTE);
    await Promise.all(
      lote.map(async (article) => {
        await putJson(`articles/${article.slug}.json`, article);
        manifest[article.slug] = hashOf(article);
      }),
    );
    if (alvo.length > LOTE) {
      const feito = Math.min(i + LOTE, alvo.length);
      process.stdout.write(`\r  subindo artigos: ${feito}/${alvo.length}`);
    }
  }
  if (alvo.length > LOTE) process.stdout.write("\n");
  for (const a of alvo) {
    if (alvo.length <= LOTE) console.log(`  ✓ ${a.slug}`);
  }

  // Artigo removido do repositorio precisa sair do R2 tambem. O site ja trata
  // isso (src/lib/articles.ts checa o indice antes de servir), mas deixar o
  // objeto para tras acumula lixo no bucket.
  const slugsAtuais = new Set(articles.map((a) => a.slug));
  const orfaos = Object.keys(manifest).filter((s) => !slugsAtuais.has(s));
  if (orfaos.length > 0) {
    if (!DRY_RUN) {
      for (let i = 0; i < orfaos.length; i += 1000) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: BUCKET,
            Delete: {
              Objects: orfaos
                .slice(i, i + 1000)
                .map((s) => ({ Key: `articles/${s}.json` })),
            },
          }),
        );
      }
      for (const s of orfaos) delete manifest[s];
    }
    console.log(`  ✓ ${orfaos.length} artigo(s) removido(s) do R2`);
  }

  // O indice sempre sobe: e ele que faz o artigo aparecer nas listagens.
  const index = articles
    .map(toSummary)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
  await putJson("articles/index.json", index);
  const kb = (JSON.stringify(index).length / 1024).toFixed(0);
  console.log(`  ✓ index.json (${index.length} artigos, ${kb} KB)`);

  if (!DRY_RUN) {
    writeFileSync(MANIFEST, JSON.stringify(manifest, null, 0));
    // Os orfaos entram aqui tambem: sem revalidar o path, a pagina do artigo
    // apagado continua servindo do cache do servidor ate o ISR expirar, mesmo
    // ja tendo sumido do indice e do R2.
    await revalidate([...alvo.map((a) => a.slug), ...orfaos]);
  }

  console.log(
    `\n${alvo.length} artigo(s) publicado(s) em ${PUBLIC_URL}/articles/`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
