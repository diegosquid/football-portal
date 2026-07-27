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

console.log("\n=== Chaves VAPID geradas ===\n");
console.log("1) wrangler.toml  ->  [vars]");
console.log(`VAPID_PUBLIC_KEY = "${VAPID_PUBLIC_KEY}"\n`);

console.log("2) .env.local do site (o navegador precisa da pública)");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY=${VAPID_PUBLIC_KEY}\n`);

console.log("3) Segredo do Worker — rode e cole quando pedir:");
console.log("   wrangler secret put VAPID_PRIVATE_KEY");
console.log(`   ${VAPID_PRIVATE_KEY}\n`);

console.log("   (guarde a privada num gerenciador de senhas; ela não é recuperável)\n");

// Sanidade: a pública tem que ter 65 bytes e começar com 0x04.
if (uncompressed.length !== 65 || uncompressed[0] !== 0x04) {
  console.error("✗ chave pública com formato inesperado");
  process.exit(1);
}
console.log(`✓ formato validado (${uncompressed.length} bytes, prefixo 0x04)\n`);
