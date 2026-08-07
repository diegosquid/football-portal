#!/usr/bin/env node
/**
 * ==============================================================================
 * publish-data.js — Publica os JSONs de dados no R2 (sem build, sem deploy)
 * ==============================================================================
 *
 * Por que existe: jogos.json, classificacao.json e probabilidades.json mudam
 * várias vezes por dia. Antes, cada atualização virava commit + push + build
 * completo na Netlify — ~56 builds/mês só de dado, estourando o free tier.
 *
 * Agora o site lê esses arquivos do R2 em runtime (src/lib/content-data.ts).
 * Subir o arquivo aqui já é publicar: as páginas têm revalidate=900 e pegam o
 * dado novo em até 15 min, sem deploy nenhum.
 *
 * Uso:
 *   node scripts/publish-data.js              # sobe todos os arquivos
 *   node scripts/publish-data.js jogos.json   # sobe só um
 *   node scripts/publish-data.js --if-newer   # não sobrescreve remoto mais novo
 *   node scripts/publish-data.js --no-revalidate
 *
 * Rode depois de build-standings.js / build-probabilities.js / archive-matches.js.
 */

const { readFileSync, existsSync } = require("fs");
const { createHash } = require("crypto");
const { join } = require("path");
const path = require("path");
const {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} = require("@aws-sdk/client-s3");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

/**
 * Arquivos servidos em runtime. Espelha o que src/lib/content-data.ts busca.
 *
 * Toda página que lê um destes tem `revalidate`, então subir o arquivo aqui já
 * publica — sem commit, sem push, sem build. Dado novo que NÃO entrar nesta
 * lista fica congelado no último deploy.
 */
const DATA_FILES = [
  "jogos.json",
  "jogos-historico.json",
  "classificacao.json",
  "probabilidades.json",
  "probabilidades-historico.json",
  "artilharia.json",
  "estadios.json",
  "chaveamento.json",
];

const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const BUCKET = process.env.R2_BUCKET_NAME || "beiradocampo";
const PUBLIC_URL = process.env.R2_PUBLIC_URL || "";
const SITE_URL = process.env.SITE_URL || "https://beiradocampo.com.br";
const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || "";
const args = process.argv.slice(2);
const ONLY_IF_NEWER = args.includes("--if-newer");
const NO_REVALIDATE = args.includes("--no-revalidate");

if (!ACCOUNT_ID || !ACCESS_KEY_ID || !SECRET_ACCESS_KEY) {
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

function hash(body) {
  return createHash("sha256").update(body).digest("hex");
}

function dataTimestamp(data) {
  const value = data.generatedAt ?? data.updatedAt;
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

async function loadPublished(fileName) {
  if (!PUBLIC_URL) return null;
  const base = PUBLIC_URL.replace(/\/$/, "");
  const response = await fetch(
    `${base}/data/${fileName}?freshness=${Date.now()}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;
  const body = Buffer.from(await response.arrayBuffer());
  return { body, data: JSON.parse(body.toString("utf-8")) };
}

async function verifyBucket(fileName, expectedBody) {
  const response = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: `data/${fileName}` }),
  );
  if (!response.Body) throw new Error("R2 retornou objeto sem corpo");
  const publishedBody = Buffer.from(await response.Body.transformToByteArray());
  if (hash(publishedBody) !== hash(expectedBody)) {
    throw new Error("verificação do R2 divergiu do arquivo local");
  }
}

async function revalidate(fileNames) {
  if (NO_REVALIDATE || fileNames.length === 0) return;
  if (!REVALIDATE_SECRET) {
    console.log(
      "  ! REVALIDATE_SECRET não configurado; o site atualizará pelo ISR em até 15 min",
    );
    return;
  }

  try {
    const response = await fetch(`${SITE_URL}/api/revalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": REVALIDATE_SECRET,
      },
      body: JSON.stringify({
        tags: fileNames.map(
          (fileName) => `data:${fileName.replace(/\.json$/, "")}`,
        ),
      }),
    });
    if (!response.ok) {
      console.log(
        `  ! revalidação respondeu ${response.status}; o site atualizará pelo ISR`,
      );
      return;
    }
    console.log(`  ✓ revalidação disparada (${fileNames.length} arquivo(s))`);
  } catch (err) {
    console.log(
      `  ! revalidação falhou (${err.message}); o site atualizará pelo ISR`,
    );
  }
}

async function publish(fileName) {
  const filePath = join(process.cwd(), "content", fileName);
  if (!existsSync(filePath)) {
    console.log(`  - ${fileName}: não existe localmente, pulando`);
    return false;
  }

  const body = readFileSync(filePath);
  let localData;

  // Valida antes de subir: JSON quebrado no R2 derruba o dado do site inteiro.
  try {
    localData = JSON.parse(body.toString("utf-8"));
  } catch (err) {
    console.error(`  ✗ ${fileName}: JSON inválido (${err.message}) — não subiu`);
    return false;
  }

  if (ONLY_IF_NEWER) {
    try {
      const published = await loadPublished(fileName);
      if (published) {
        const localTime = dataTimestamp(localData);
        const publishedTime = dataTimestamp(published.data);
        const sameBody = hash(body) === hash(published.body);

        if (sameBody) {
          console.log(`  = ${fileName}: R2 já está atualizado`);
          return true;
        }
        if (
          localTime !== null &&
          publishedTime !== null &&
          publishedTime > localTime
        ) {
          console.log(`  = ${fileName}: R2 é mais novo; arquivo local não foi publicado`);
          return true;
        }
        if (
          localTime !== null &&
          publishedTime !== null &&
          publishedTime === localTime
        ) {
          console.error(
            `  ✗ ${fileName}: mesmo timestamp, mas conteúdo local e remoto divergem`,
          );
          return false;
        }
      }
    } catch (err) {
      console.log(
        `  ! ${fileName}: não foi possível comparar com o R2 (${err.message}); publicando`,
      );
    }
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: `data/${fileName}`,
      Body: body,
      ContentType: "application/json",
      // Curto de propósito: quem controla a frescura é o revalidate do Next,
      // não a borda do R2. `immutable` aqui congelaria o dado.
      CacheControl: "public, max-age=60",
    }),
  );

  await verifyBucket(fileName, body);

  const kb = (body.length / 1024).toFixed(1);
  console.log(
    `  ✓ ${fileName} (${kb} KB) publicado e verificado → ${PUBLIC_URL}/data/${fileName}`,
  );
  return true;
}

async function main() {
  const requested = args.filter(
    (arg) => arg !== "--if-newer" && arg !== "--no-revalidate",
  );
  const files = requested.length > 0 ? requested : DATA_FILES;

  console.log(`Publicando ${files.length} arquivo(s) de dados no R2...`);

  let ok = 0;
  const successfulFiles = [];
  for (const file of files) {
    try {
      if (await publish(file)) {
        ok++;
        successfulFiles.push(file);
      }
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }

  await revalidate(successfulFiles);

  console.log(`\n${ok}/${files.length} publicados.`);
  if (ok < files.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
