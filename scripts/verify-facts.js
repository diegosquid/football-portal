#!/usr/bin/env node
/**
 * verify-facts.js - Script de verificação obrigatória de fatos
 * 
 * Uso:
 *   node scripts/verify-facts.js --match "TimeA x TimeB" --date "2026-02-28"
 *   node scripts/verify-facts.js --article "slug-do-artigo"
 */

const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const args = process.argv.slice(2);
const matchArg = args.find((a, i) => args[i - 1] === '--match') || '';
const dateArg = args.find((a, i) => args[i - 1] === '--date') || '';
const articleArg = args.find((a, i) => args[i - 1] === '--article') || '';

function logSection(title) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(title);
  console.log('='.repeat(60));
}

function logCheck(item, status, details = '') {
  const icon = status === 'OK' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${item}${details ? ` - ${details}` : ''}`);
}

async function verifyMatch(match, date) {
  logSection('VERIFICAÇÃO DE RESULTADO DE JOGO');
  
  console.log(`\nJogo: ${match}`);
  console.log(`Data: ${date || 'não especificada'}`);
  
  console.log('\n📋 CHECKLIST OBRIGATÓRIO:');
  console.log('□ Buscar resultado em ge.globo.com');
  console.log('□ Buscar resultado em ESPN Brasil ou Estadão');
  console.log('□ Confirmar placar exato');
  console.log('□ Confirmar time vencedor');
  console.log('□ Confirmar autores dos gols');
  console.log('□ Verificar se houve alteração de resultado');
  
  console.log('\n⚠️  REGRAS:');
  console.log('- Mínimo 2 fontes independentes');
  console.log('- Fontes devem concordar em TODOS os fatos');
  console.log('- Se divergência: PAUSAR e verificar manualmente');
  
  return {
    match,
    date,
    verified: false,
    requiresManualCheck: true
  };
}

async function verifyArticle(slug) {
  const articlePath = path.join(__dirname, '..', 'content', 'articles', `${slug}.mdx`);
  
  if (!fs.existsSync(articlePath)) {
    console.error(`❌ Artigo não encontrado: ${articlePath}`);
    process.exit(1);
  }
  
  const content = fs.readFileSync(articlePath, 'utf-8');
  
  // Extrair dados do frontmatter
  const typeMatch = content.match(/type:\s*"([^"]+)"/);
  const titleMatch = content.match(/title:\s*"([^"]+)"/);
  const teamsMatch = content.match(/teams:\s*\[([^\]]+)\]/);
  
  const type = typeMatch ? typeMatch[1] : 'unknown';
  const title = titleMatch ? titleMatch[1] : '';
  const teams = teamsMatch ? teamsMatch[1].replace(/"/g, '').split(',').map(t => t.trim()) : [];
  
  logSection('VERIFICAÇÃO DE ARTIGO EXISTENTE');
  console.log(`\nSlug: ${slug}`);
  console.log(`Tipo: ${type}`);
  console.log(`Título: ${title}`);
  
  if (type === 'post-match' || content.includes('pos-jogo')) {
    console.log('\n⚠️  TIPO: PÓS-JOGO - Verificação rigorosa obrigatória');
    
    // Tentar extrair resultado do título
    const resultMatch = title.match(/(\d+)\s*x\s*(\d+)/);
    if (resultMatch) {
      console.log(`\nPlacar detectado no título: ${resultMatch[0]}`);
      console.log('⚠️  CONFIRMAR em 2+ fontes oficiais antes de publicar!');
    }
    
    if (teams.length >= 2) {
      console.log(`\nTimes: ${teams.join(' x ')}`);
      console.log('□ Confirmar qual time venceu');
      console.log('□ Confirmar autores dos gols');
    }
  }
  
  return { slug, type, title, teams, requiresVerification: type === 'post-match' };
}

async function main() {
  console.log('🔒 CONTENT HARDENING - VERIFICAÇÃO DE FATOS');
  
  if (articleArg) {
    await verifyArticle(articleArg);
  } else if (matchArg) {
    await verifyMatch(matchArg, dateArg);
  } else {
    console.log('\nUso:');
    console.log('  node scripts/verify-facts.js --match "TimeA x TimeB" --date "YYYY-MM-DD"');
    console.log('  node scripts/verify-facts.js --article "slug-do-artigo"');
    console.log('\nExemplo:');
    console.log('  node scripts/verify-facts.js --match "Novorizontino x Corinthians" --date "2026-02-28"');
  }
  
  console.log('\n');
}

main().catch(console.error);
