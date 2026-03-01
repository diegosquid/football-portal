#!/usr/bin/env node
/**
 * post-thread-to-twitter.js — Posta uma thread no Twitter/X
 *
 * Uso:
 *   node scripts/post-thread-to-twitter.js <slug-do-artigo> [--yes] [--silent]
 *
 * Formato: Thread com múltiplos tweets (máx 280 chars cada)
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
    process.exit(0);
  }
  error('❌ Credenciais do Twitter não configuradas no .env.local');
  process.exit(0);
}

// Validar argumento
const slug = process.argv[2];
if (!slug || slug.startsWith('-')) {
  if (silent) process.exit(0);
  error('❌ Uso: node post-thread-to-twitter.js <slug-do-artigo> [--yes] [--silent]');
  process.exit(0);
}

const articlePath = path.join(__dirname, '..', 'content', 'articles', `${slug}.mdx`);

// Verificar se o arquivo existe
if (!fs.existsSync(articlePath)) {
  if (silent) process.exit(0);
  error(`❌ Artigo não encontrado: ${articlePath}`);
  process.exit(0);
}

// Ler e extrair dados do frontmatter
const content = fs.readFileSync(articlePath, 'utf-8');
const titleMatch = content.match(/title:\s*"([^"]+)"/);
const excerptMatch = content.match(/excerpt:\s*"([^"]+)"/);
const teamsMatch = content.match(/teams:\s*\[([^\]]+)\]/);

if (!titleMatch) {
  if (silent) process.exit(0);
  error('❌ Não foi possível extrair o título do artigo');
  process.exit(0);
}

const title = titleMatch[1];
const excerpt = excerptMatch ? excerptMatch[1] : '';
const teams = teamsMatch ? teamsMatch[1].replace(/"/g, '').split(',').map(t => t.trim()) : [];
const url = `https://beiradocampo.com.br/${slug}`;

// Criar thread baseada no tipo de artigo
function createThread(title, excerpt, teams, url) {
  const thread = [];
  
  // Tweet 1: Hook + contexto
  const hook = title.includes('Corinthians') && title.includes('Novorizontino') 
    ? `🧵 Corinthians 1x0 Novorizontino: o jogo que parecia fácil e quase escapou.`
    : title.includes('Flamengo') && title.includes('crise')
    ? `🧵 O Flamengo está vivendo a pior crise dos últimos 10 anos.`
    : `🧵 ${title}`;
  
  thread.push(hook);
  
  // Tweet 2: Contexto/introdução
  if (title.includes('Corinthians') && title.includes('Novorizontino')) {
    thread.push(`Yuri Alberto decidiu, mas o Timão sofreu mais do que deveria contra um time da Série B.

O que deu errado — e o que isso diz sobre a final 👇`);
  } else if (title.includes('Flamengo') && title.includes('crise')) {
    thread.push(`Os números são assustadores — e vão além do "time ruim".

Segue o fio 👇`);
  }
  
  // Tweet 3: Dado/estatística
  if (title.includes('Corinthians')) {
    thread.push(`📊 Os números não mentem:

• Posse de bola: 58% Corinthians
• Finalizações: 14x8 (só 3 no gol)
• Grandes chances: 2x1

Domínio estatístico, eficiência baixa.
O mesmo problema de 2025.`);
  } else if (title.includes('Flamengo')) {
    thread.push(`📊 Os números da crise:

• 4 derrotas em 6 jogos
• Média de 0,8 gols/jogo
• Pior início desde 2014

Não é só fase ruim. É padrão.`);
  }
  
  // Tweet 4: Análise/opinião
  if (title.includes('Corinthians')) {
    thread.push(`⚠️ O ponto de virada:

Novorizontino cresceu no 2º tempo.
Corinthians recuou, perdeu o meio, quase pagou caro.

Augusto Melo deve resolver isso antes da final — ou o Palmeiras não vai perdoar.`);
  } else if (title.includes('Flamengo')) {
    thread.push(`⚠️ O problema vai além do técnico:

Filipe Luís herdou um elenco desmontado e uma direção sem plano.

Trocar técnico agora seria colocar mais lenha na fogueira.`);
  }
  
  // Tweet 5: Destaque individual
  if (title.includes('Corinthians')) {
    thread.push(`🏆 Yuri Alberto, o cara dos momentos grandes:

• 12 gols em 2026
• 4 deles em mata-mata
• Decisivo quando precisa ser

Sem ele, não teria final.`);
  }
  
  // Tweet final: CTA + link
  thread.push(`Análise completa + estatísticas detalhadas 👇

${url}`);
  
  return thread;
}

const thread = createThread(title, excerpt, teams, url);

log('📝 Artigo:', slug);
log('📰 Título:', title);
log('');
log('🐦 Thread prevista:');
log('---');
thread.forEach((tweet, i) => {
  log(`\n[${i + 1}/${thread.length}] (${tweet.length}/280 chars):`);
  log(tweet);
});
log('---');
log('');

// Função para postar thread
async function postThread() {
  try {
    log('⏳ Conectando à API do Twitter...');

    const client = new TwitterApi({
      appKey: CONSUMER_KEY,
      appSecret: CONSUMER_SECRET,
      accessToken: ACCESS_TOKEN,
      accessSecret: ACCESS_SECRET,
    });

    const user = await client.v2.me();
    log(`✅ Conectado como: @${user.data.username}`);
    log('');

    // Postar thread
    let previousTweetId = null;
    const tweetUrls = [];

    for (let i = 0; i < thread.length; i++) {
      const tweetText = thread[i];
      log(`⏳ Postando tweet ${i + 1}/${thread.length}...`);

      const tweetOptions = previousTweetId 
        ? { reply: { in_reply_to_tweet_id: previousTweetId } }
        : {};

      const { data: tweet } = await client.v2.tweet(tweetText, tweetOptions);
      previousTweetId = tweet.id;
      
      const tweetUrl = `https://x.com/${user.data.username}/status/${tweet.id}`;
      tweetUrls.push(tweetUrl);
      
      log(`✅ Tweet ${i + 1} postado!`);
      
      // Pequeno delay entre tweets para evitar rate limit
      if (i < thread.length - 1) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    log('');
    log('✅ Thread completa postada com sucesso!');
    log(`🔗 URL inicial: ${tweetUrls[0]}`);
    
    console.log(`TWITTER_THREAD_SUCCESS: ${tweetUrls[0]}`);

  } catch (err) {
    const errorCode = err.code || 'UNKNOWN';
    const errorMessage = err.message || 'Erro desconhecido';

    if (silent) {
      console.log(`TWITTER_SKIPPED: ${errorCode} - ${errorMessage.substring(0, 100)}`);
      process.exit(0);
    }

    error('❌ Erro ao postar thread:');
    error(errorMessage);

    if (errorCode === 401) {
      error('\n⚠️  Erro de autenticação. Verifique as credenciais.');
    } else if (errorCode === 403 || errorCode === 402) {
      error('\n⚠️  Erro de permissão ou créditos insuficientes.');
    } else if (errorCode === 429) {
      error('\n⚠️  Rate limit atingido.');
    }

    console.log(`TWITTER_FAILED: ${errorCode}`);
    process.exit(0);
  }
}

// Confirmar antes de postar
if (yes || silent) {
  postThread();
} else {
  log('⚠️  Modo de simulação. Use --yes ou -y para postar de verdade.');
  log('');
  log('Para postar, execute:');
  log(`  node scripts/post-thread-to-twitter.js ${slug} --yes`);
}
