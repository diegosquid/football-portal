#!/usr/bin/env node
/**
 * validate-frontmatter.js — valida campos SEO do frontmatter antes do commit
 *
 * Uso:
 *   node scripts/validate-frontmatter.js <slug>
 *
 * Exit codes:
 *   0 = OK
 *   1 = erros bloqueantes (não commitar)
 *   2 = uso incorreto / arquivo não encontrado
 */

const fs = require("fs");
const path = require("path");

const slug = process.argv[2];
if (!slug) {
  console.error("Uso: node scripts/validate-frontmatter.js <slug>");
  process.exit(2);
}

const filePath = path.join(
  __dirname,
  "..",
  "content",
  "articles",
  `${slug}.mdx`,
);
if (!fs.existsSync(filePath)) {
  console.error(`Arquivo nao encontrado: ${filePath}`);
  process.exit(2);
}

const raw = fs.readFileSync(filePath, "utf8");
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---/);
if (!fmMatch) {
  console.error("Frontmatter nao encontrado no MDX");
  process.exit(1);
}
const fm = fmMatch[1];

function getScalar(field) {
  const quoted = new RegExp(`^${field}:\\s*"([^"]*)"\\s*$`, "m");
  const unquoted = new RegExp(`^${field}:\\s*(.+?)\\s*$`, "m");
  const m = fm.match(quoted);
  if (m) return m[1];
  const m2 = fm.match(unquoted);
  if (!m2) return null;
  return m2[1].replace(/^"|"$/g, "").trim();
}

function countFAQItems() {
  const lines = fm.split("\n");
  let inFaq = false;
  let count = 0;
  for (const line of lines) {
    if (/^faq:\s*$/.test(line)) {
      inFaq = true;
      continue;
    }
    if (inFaq) {
      if (/^\S/.test(line)) {
        inFaq = false;
        continue;
      }
      if (/^\s+-\s+question:/.test(line)) count++;
    }
  }
  return count;
}

function faqHasEmptyAnswer() {
  const lines = fm.split("\n");
  let inFaq = false;
  for (const line of lines) {
    if (/^faq:\s*$/.test(line)) {
      inFaq = true;
      continue;
    }
    if (inFaq) {
      if (/^\S/.test(line)) {
        inFaq = false;
        continue;
      }
      const m = line.match(/^\s+answer:\s*"?(.*?)"?\s*$/);
      if (m && (!m[1] || m[1].length < 10)) return true;
    }
  }
  return false;
}

function detectType(s) {
  if (/^radar-transferencias-\d{4}-\d{2}-\d{2}/.test(s)) return "transfer-radar";
  if (/^opiniao-/.test(s)) return "opinion";
  if (/-\d+x\d+-/.test(s)) return "post-match";
  if (/-x-[a-z]/.test(s) && !/-\d+x\d+-/.test(s)) return "pre-match";
  if (/^brasileirao-2026-rodada-\d+/.test(s)) return "round-coverage";
  if (/regulamento|guia-|entenda-|como-funciona/.test(s)) return "evergreen";
  return "news";
}

const type = detectType(slug);
const errors = [];
const warnings = [];

const title = getScalar("title");
const excerpt = getScalar("excerpt");
const seoDescription = getScalar("seoDescription");
const faqCount = countFAQItems();
const faqRequired = ["pre-match", "post-match", "evergreen"].includes(type);

// title
if (!title) {
  errors.push("title ausente");
} else if (title.length > 120) {
  errors.push(`title tem ${title.length} chars (max 120)`);
} else if (title.length > 70) {
  warnings.push(`title tem ${title.length} chars (ideal 50-70)`);
}

// excerpt
if (!excerpt) {
  errors.push("excerpt ausente");
} else if (excerpt.length > 300) {
  errors.push(`excerpt tem ${excerpt.length} chars (max 300)`);
}

// seoDescription
if (!seoDescription) {
  errors.push("seoDescription ausente (obrigatorio em todos os artigos)");
} else {
  if (seoDescription.length > 160) {
    errors.push(
      `seoDescription tem ${seoDescription.length} chars (max 160)`,
    );
  }
  if (seoDescription.length < 80) {
    warnings.push(
      `seoDescription tem ${seoDescription.length} chars (ideal 120-160)`,
    );
  }
  if (excerpt && excerpt.trim() === seoDescription.trim()) {
    warnings.push(
      "seoDescription e identico ao excerpt — escreva descricoes distintas",
    );
  }
}

// faq
if (faqRequired) {
  if (faqCount === 0) {
    errors.push(
      `faq ausente (obrigatorio para tipo "${type}") — incluir 3-5 perguntas/respostas`,
    );
  } else if (faqCount < 3) {
    errors.push(`faq tem ${faqCount} item(s), minimo 3`);
  } else if (faqCount > 5) {
    warnings.push(`faq tem ${faqCount} itens (ideal 3-5)`);
  }
  if (faqCount > 0 && faqHasEmptyAnswer()) {
    errors.push("faq tem respostas vazias ou muito curtas (< 10 chars)");
  }
} else if (faqCount > 0 && faqCount < 3) {
  warnings.push(`faq com ${faqCount} item(s) — se for usar, ideal 3-5`);
}

// output
console.log(`\nValidacao SEO: ${slug}`);
console.log(`Tipo detectado: ${type}`);
console.log(`title: ${title ? `${title.length} chars` : "AUSENTE"}`);
console.log(`excerpt: ${excerpt ? `${excerpt.length} chars` : "AUSENTE"}`);
console.log(
  `seoDescription: ${seoDescription ? `${seoDescription.length} chars` : "AUSENTE"}`,
);
console.log(`faq: ${faqCount} itens`);

if (warnings.length) {
  console.log("\nAvisos:");
  for (const w of warnings) console.log(`  - ${w}`);
}

if (errors.length) {
  console.log("\nErros (bloqueiam commit):");
  for (const e of errors) console.log(`  - ${e}`);
  process.exit(1);
}

console.log("\nOK — frontmatter valido");
process.exit(0);
