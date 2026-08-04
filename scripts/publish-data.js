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
 *
 * Rode depois de build-standings.js / build-probabilities.js / archive-matches.js.
 */

const { readFileSync, existsSync } = require("fs");
const { join } = require("path");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

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

async function publish(fileName) {
  const filePath = join(process.cwd(), "content", fileName);
  if (!existsSync(filePath)) {
    console.log(`  - ${fileName}: não existe localmente, pulando`);
    return false;
  }

  const body = readFileSync(filePath);

  // Valida antes de subir: JSON quebrado no R2 derruba o dado do site inteiro.
  try {
    JSON.parse(body.toString("utf-8"));
  } catch (err) {
    console.error(`  ✗ ${fileName}: JSON inválido (${err.message}) — não subiu`);
    return false;
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

  const kb = (body.length / 1024).toFixed(1);
  console.log(`  ✓ ${fileName} (${kb} KB) → ${PUBLIC_URL}/data/${fileName}`);
  return true;
}

async function main() {
  const requested = process.argv.slice(2);
  const files = requested.length > 0 ? requested : DATA_FILES;

  console.log(`Publicando ${files.length} arquivo(s) de dados no R2...`);

  let ok = 0;
  for (const file of files) {
    try {
      if (await publish(file)) ok++;
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }

  console.log(`\n${ok}/${files.length} publicados.`);
  if (ok < files.length) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
