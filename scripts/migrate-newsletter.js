/**
 * Exporta os inscritos da newsletter do Supabase e gera o SQL de importação
 * para o D1 — nenhum e-mail se perde na migração.
 *
 *   node scripts/migrate-newsletter.js
 *
 * Depois:
 *   cd workers/api
 *   wrangler d1 execute beiradocampo --remote --file=./import-newsletter.sql
 *
 * Idempotente: o INSERT usa ON CONFLICT DO NOTHING, então rodar duas vezes
 * não duplica ninguém.
 */

const path = require("path");
const { writeFileSync } = require("fs");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const { createClient } = require("@supabase/supabase-js");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("✗ Credenciais do Supabase ausentes no .env.local");
  process.exit(1);
}

/** Escapa aspas simples para SQL. */
const esc = (s) => String(s).replace(/'/g, "''");

async function main() {
  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from("subscribers")
    .select("email, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("✗ Erro ao ler do Supabase:", error.message);
    process.exit(1);
  }

  const rows = (data ?? []).filter((r) => r.email);
  if (rows.length === 0) {
    console.log("Nenhum inscrito no Supabase — nada a migrar.");
    return;
  }

  const values = rows
    .map((r) => {
      const email = esc(r.email.toLowerCase().trim());
      const created = r.created_at
        ? esc(new Date(r.created_at).toISOString().replace("T", " ").slice(0, 19))
        : null;
      return created
        ? `('${email}', '${created}', 'supabase-import')`
        : `('${email}', datetime('now'), 'supabase-import')`;
    })
    .join(",\n  ");

  const sql = `-- Importação da newsletter: Supabase -> D1
-- Gerado por scripts/migrate-newsletter.js em ${new Date().toISOString()}
-- ${rows.length} inscritos

INSERT INTO newsletter_subscribers (email, created_at, source)
VALUES
  ${values}
ON CONFLICT(email) DO NOTHING;
`;

  const out = path.join(__dirname, "..", "workers", "api", "import-newsletter.sql");
  writeFileSync(out, sql);

  console.log(`✓ ${rows.length} inscritos exportados`);
  console.log(`✓ SQL gerado em workers/api/import-newsletter.sql`);
  console.log("\nPara importar:");
  console.log("  cd workers/api");
  console.log("  wrangler d1 execute beiradocampo --remote --file=./import-newsletter.sql\n");
}

main();
