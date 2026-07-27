/**
 * Gera o par de chaves VAPID (P-256) para Web Push.
 *
 *   node scripts/generate-vapid-keys.js
 *
 * - VAPID_PUBLIC_KEY: NÃO é segredo. Vai no wrangler.toml [vars] e também
 *   no navegador (applicationServerKey).
 * - VAPID_PRIVATE_KEY: É SEGREDO. Só em `wrangler secret put`.
 *
 * Rode UMA vez. Trocar as chaves depois invalida todas as inscrições
 * existentes — os usuários teriam que aceitar a notificação de novo.
 */

const { generateKeyPairSync } = require("crypto");

const { publicKey, privateKey } = generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
});

const pubJwk = publicKey.export({ format: "jwk" });
const privJwk = privateKey.export({ format: "jwk" });

const b64urlToBuf = (s) => Buffer.from(s, "base64url");

// Chave pública no formato "uncompressed point": 0x04 || X || Y  (65 bytes)
const uncompressed = Buffer.concat([
  Buffer.from([0x04]),
  b64urlToBuf(pubJwk.x),
  b64urlToBuf(pubJwk.y),
]);

const VAPID_PUBLIC_KEY = uncompressed.toString("base64url");
const VAPID_PRIVATE_KEY = privJwk.d; // já em base64url

// Sanidade: a pública tem que ter 65 bytes e começar com 0x04.
if (uncompressed.length !== 65 || uncompressed[0] !== 0x04) {
  console.error("✗ chave pública com formato inesperado");
  process.exit(1);
}

const { readFileSync, writeFileSync, existsSync, appendFileSync } = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");

/* --- 1. Chave PÚBLICA (não é segredo) — grava nos dois lugares --- */

// .env.local do site
const envPath = path.join(root, ".env.local");
const envLine = `NEXT_PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}`;
const envCurrent = existsSync(envPath) ? readFileSync(envPath, "utf-8") : "";
if (envCurrent.includes("NEXT_PUBLIC_VAPID_PUBLIC_KEY=")) {
  console.log("• .env.local já tem NEXT_PUBLIC_VAPID_PUBLIC_KEY — não sobrescrevi");
} else {
  appendFileSync(envPath, `\n# Web Push (chave pública — vai pro navegador)\n${envLine}\n`);
  console.log("✓ chave pública gravada em .env.local");
}

// wrangler.toml do Worker
const tomlPath = path.join(root, "workers", "api", "wrangler.toml");
if (existsSync(tomlPath)) {
  const toml = readFileSync(tomlPath, "utf-8");
  if (/VAPID_PUBLIC_KEY = ""/.test(toml)) {
    writeFileSync(
      tomlPath,
      toml.replace('VAPID_PUBLIC_KEY = ""', `VAPID_PUBLIC_KEY = "${VAPID_PUBLIC_KEY}"`),
    );
    console.log("✓ chave pública gravada em workers/api/wrangler.toml");
  } else {
    console.log("• wrangler.toml já tem VAPID_PUBLIC_KEY — não sobrescrevi");
  }
}

/* --- 2. Chave PRIVADA (SEGREDO) — só num arquivo ignorado pelo git --- */

const privPath = path.join(root, "workers", "api", ".vapid-private.key");
writeFileSync(privPath, VAPID_PRIVATE_KEY + "\n", { mode: 0o600 });

console.log("✓ chave privada gravada em workers/api/.vapid-private.key (ignorada pelo git)");
console.log(`✓ formato validado (${uncompressed.length} bytes, prefixo 0x04)\n`);

console.log("PRÓXIMOS PASSOS");
console.log("  1. Carregar o segredo no Worker:");
console.log("     cd workers/api");
console.log("     wrangler secret put VAPID_PRIVATE_KEY < .vapid-private.key\n");
console.log("  2. Guardar a privada no seu gerenciador de senhas:");
console.log("     cat workers/api/.vapid-private.key\n");
console.log("  3. Apagar o arquivo:");
console.log("     rm workers/api/.vapid-private.key\n");
console.log("  A privada NÃO é recuperável. Se perder, todas as inscrições morrem.\n");
