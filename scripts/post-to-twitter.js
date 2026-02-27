#!/usr/bin/env node
/**
 * post-to-twitter.js — Posta um artigo no Twitter/X
 * 
 * Uso:
 *   node scripts/post-to-twitter.js <slug-do-artigo> [--yes] [--silent]
 * 
 * Exemplos:
 *   node scripts/post-to-twitter.js numeros-brasileirao-2026-4-rodadas-dados --yes
 *   node scripts/post-to-twitter.js numeros-brasileirao-2026-4-rodadas-dados --yes --silent
 */

const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const CONSUMER_KEY = process.env.TWITTER_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const ACCESS_SECRET = process.env.TWITTER_ACCESS_TOKEN_SECRET;

const silent = process.argv.includes('--silent') || process.argv.includes('-s');
const yes = process.argv.includes('--yes') || process.argv.includes('-y');

function log(...args) {
  if (!silent) console.log(...args);
}

function error(...args) {
  console.error(...args);
}

// Validar credenciais
if (!CONSUMER_KEY || !CONSUMER_SECRET || !ACCESS_TOKEN || !ACCESS_SECRET) {
  if (silent) {
    process.exit(0); // Silencioso: sai sem erro
  }
  error('❌ Credenciais do Twitter não configuradas no .env.local');
  process.exit(0); // Não falha o job, apenas loga
}

// Validar argumento
const slug = process.argv[2];
if (!slug || slug.startsWith('-')) {
  if (silent) process.exit(0);
  error('❌ Uso: node post-to-twitter.js <slug-do-artigo> [--yes] [--silent]');
  process.exit(0);
}

const articlePath = path.join(__dirname, '..', 'content', 'articles', `${slug}.mdx`);

// Verificar se o arquivo existe
if (!fs.existsSync(articlePath)) {
  if (silent) process.exit(0);
  error(`❌ Artigo não encontrado: ${articlePath}`);
  process.exit(0);
}

// Ler e extrair título do frontmatter
const content = fs.readFileSync(articlePath, 'utf-8');
const titleMatch = content.match(/title:\s*"([^"]+)"/);

if (!titleMatch) {
  if (silent) process.exit(0);
  error('❌ Não foi possível extrair o título do artigo');
  process.exit(0);
}

const title = titleMatch[1];
const url = `https://beiradocampo.com.br/${slug}`;
const tweetText = `${title}\n\n${url}`;

log('📝 Artigo:', slug);
log('📰 Título:', title);
log('');
log('🐦 Texto do tweet:');
log('---');
log(tweetText);
log('---');
log('');

// Função para postar
async function postTweet() {
  try {
    log('⏳ Conectando à API do Twitter...');
    
    const client = new TwitterApi({
      appKey: CONSUMER_KEY,
      appSecret: CONSUMER_SECRET,
      accessToken: ACCESS_TOKEN,
      accessSecret: ACCESS_SECRET,
    });

    // Verificar credenciais
    const user = await client.v2.me();
    log(`✅ Conectado como: @${user.data.username}`);
    log('');

    // Postar tweet (usar v2 — Free Tier bloqueia v1.1 para tweets)
    log('⏳ Postando tweet...');
    const { data: tweet } = await client.v2.tweet(tweetText);

    log('✅ Tweet postado com sucesso!');
    log(`🔗 URL: https://x.com/${user.data.username}/status/${tweet.id}`);
    log(`🆔 ID: ${tweet.id}`);

    // Sempre loga sucesso, mesmo em silent mode (para o cron saber)
    console.log(`TWITTER_SUCCESS: https://x.com/${user.data.username}/status/${tweet.id}`);
    
  } catch (err) {
    const errorCode = err.code || 'UNKNOWN';
    const errorMessage = err.message || 'Erro desconhecido';
    
    // Em modo silencioso, apenas loga o erro e sai com sucesso
    if (silent) {
      console.log(`TWITTER_SKIPPED: ${errorCode} - ${errorMessage.substring(0, 100)}`);
      process.exit(0);
    }
    
    error('❌ Erro ao postar tweet:');
    error(errorMessage);
    
    if (errorCode === 401) {
      error('\n⚠️  Erro de autenticação. Verifique as credenciais.');
    } else if (errorCode === 403 || errorCode === 402) {
      error('\n⚠️  Erro de permissão ou créditos insuficientes.');
    } else if (errorCode === 429) {
      error('\n⚠️  Rate limit atingido.');
    }
    
    // Não falha o job, apenas loga
    console.log(`TWITTER_FAILED: ${errorCode}`);
    process.exit(0);
  }
}

// Confirmar antes de postar (modo interativo)
if (yes || silent) {
  postTweet();
} else {
  log('⚠️  Modo de simulação. Use --yes ou -y para postar de verdade.');
  log('');
  log('Para postar, execute:');
  log(`  node scripts/post-to-twitter.js ${slug} --yes`);
}
