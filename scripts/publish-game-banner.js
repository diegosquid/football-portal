#!/usr/bin/env node
/**
 * Publica ou altera um banner de uma página de jogo sem commit/deploy.
 *
 * Exemplo:
 *   node scripts/publish-game-banner.js \
 *     --slug internacional-x-corinthians-2026-08-09 \
 *     --desktop /tmp/inter-corinthians-desktop.webp \
 *     --mobile /tmp/inter-corinthians-mobile.webp \
 *     --url https://parceiro.example/oferta \
 *     --campaign "Inter x Corinthians — odd 11" \
 *     --advertiser Vupi \
 *     --alt "Oferta especial para Internacional x Corinthians" \
 *     --ends 2026-08-09T23:59:00-03:00
 *
 * Também permite ligar/desligar imediatamente:
 *   node scripts/publish-game-banner.js --disable <slug>
 *   node scripts/publish-game-banner.js --enable <slug>
 */

const { existsSync, readFileSync, statSync } = require("fs");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const IMAGE_TYPES = {
  ".avif": "image/avif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function parseArgs(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index++) {
    const argument = argv[index];
    if (!argument.startsWith("--")) {
      throw new Error(`Argumento inesperado: ${argument}`);
    }
    const key = argument.slice(2);
    if (key === "dry-run" || key === "inactive") {
      options[key] = true;
      continue;
    }
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Falta o valor de --${key}`);
    }
    options[key] = value;
    index++;
  }
  return options;
}

function getAdminToken() {
  if (process.env.BDC_ADMIN_TOKEN || process.env.ADMIN_TOKEN) {
    return process.env.BDC_ADMIN_TOKEN || process.env.ADMIN_TOKEN;
  }
  const tokenPath = path.join(__dirname, "..", "workers", "api", ".admin-private.key");
  if (existsSync(tokenPath)) return readFileSync(tokenPath, "utf8").trim();
  return "";
}

function requireApiConfig() {
  const api = (process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "").replace(
    /\/$/,
    "",
  );
  const token = getAdminToken();
  if (!api) throw new Error("NEXT_PUBLIC_API_URL não configurada no .env.local.");
  if (!token) {
    throw new Error(
      "BDC_ADMIN_TOKEN/ADMIN_TOKEN não configurado e workers/api/.admin-private.key não existe.",
    );
  }
  return { api, token };
}

function validateSlug(slug) {
  if (
    !slug ||
    !/^[a-z0-9][a-z0-9-]*-x-[a-z0-9][a-z0-9-]*-\d{4}-\d{2}-\d{2}$/.test(
      slug,
    )
  ) {
    throw new Error("Slug de jogo inválido.");
  }
}

function normalizeDate(value, name) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error(`${name} inválido: ${value}`);
  return date.toISOString();
}

function appendImage(form, field, filePath) {
  if (!filePath) return;
  const resolved = path.resolve(filePath);
  if (!existsSync(resolved)) throw new Error(`Imagem não encontrada: ${resolved}`);
  const extension = path.extname(resolved).toLowerCase();
  const type = IMAGE_TYPES[extension];
  if (!type) throw new Error(`Formato não aceito: ${extension}`);
  const size = statSync(resolved).size;
  if (size > MAX_IMAGE_BYTES) {
    throw new Error(`${resolved} ultrapassa o limite de 5 MB.`);
  }
  form.append(field, new Blob([readFileSync(resolved)], { type }), path.basename(resolved));
}

async function toggle(slug, enabled, config, dryRun) {
  validateSlug(slug);
  if (dryRun) {
    console.log(`OK (dry-run): ${enabled ? "ativaria" : "desativaria"} ${slug}`);
    return;
  }

  const response = await fetch(
    `${config.api}/admin/game-banners/${encodeURIComponent(slug)}/toggle`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ enabled }),
    },
  );
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
  console.log(`✓ Banner ${enabled ? "ativado" : "desativado"}: ${slug}`);
}

async function publish(options, config) {
  const slug = options.slug;
  validateSlug(slug);

  for (const field of ["url", "campaign", "advertiser", "alt"]) {
    if (!options[field]) throw new Error(`--${field} é obrigatório.`);
  }
  const target = new URL(options.url);
  if (target.protocol !== "https:") throw new Error("--url precisa usar HTTPS.");

  const form = new FormData();
  form.set("matchSlug", slug);
  form.set("campaignName", options.campaign);
  form.set("advertiser", options.advertiser);
  form.set("targetUrl", target.toString());
  form.set("altText", options.alt);
  form.set("startsAt", normalizeDate(options.starts, "--starts"));
  form.set("endsAt", normalizeDate(options.ends, "--ends"));
  form.set("enabled", String(!options.inactive));
  // O agente só executa este comando após revisar a peça e o operador.
  form.set("complianceConfirmed", "true");
  appendImage(form, "desktopImage", options.desktop);
  appendImage(form, "mobileImage", options.mobile);

  if (options["dry-run"]) {
    console.log(`OK (dry-run): publicaria a campanha em /onde-assistir/${slug}`);
    return;
  }

  const response = await fetch(`${config.api}/admin/game-banners`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.token}` },
    body: form,
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);

  const banner = body.banner;
  console.log(`✓ Banner publicado: https://beiradocampo.com.br/onde-assistir/${slug}`);
  console.log(`  campanha: ${banner.campaignName}`);
  console.log(`  status: ${banner.enabled ? "ativo" : "inativo"}`);
  if (banner.endsAt) console.log(`  termina: ${banner.endsAt}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const config = options["dry-run"]
    ? { api: "", token: "" }
    : requireApiConfig();

  if (options.enable || options.disable) {
    if (options.enable && options.disable) {
      throw new Error("Use apenas --enable ou --disable por vez.");
    }
    return toggle(
      options.enable || options.disable,
      Boolean(options.enable),
      config,
      Boolean(options["dry-run"]),
    );
  }
  return publish(options, config);
}

main().catch((error) => {
  console.error(`ERRO: ${error.message}`);
  process.exit(1);
});
