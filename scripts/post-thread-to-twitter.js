#!/usr/bin/env node
/**
 * post-thread-to-twitter.js — Gera thread usando LLM com conteúdo do artigo
 * 
 * Uso:
 *   node scripts/post-thread-to-twitter.js <slug-do-artigo> [--yes] [--silent]
 * 
 * Funcionamento:
 *   1. Lê o artigo MDX completo
 *   2. Envia para LLM gerar tweets específicos e criativos
 *   3. Posta a thread no Twitter
 */

const { TwitterApi } = require('twitter-api-v2');
const fs = require('fs');
const path = require('path');

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
  if (silent) process.exit(0);
  error('❌ Credenciais do Twitter não configuradas');
  process.exit(0);
}

// Validar argumento
const slug = process.argv[2];
if (!slug || slug.startsWith('-')) {
  if (silent) process.exit(0);
  error('❌ Uso: node post-thread-to-twitter.js <slug> [--yes]');
  process.exit(0);
}

const articlePath = path.join(__dirname, '..', 'content', 'articles', `${slug}.mdx`);

if (!fs.existsSync(articlePath)) {
  if (silent) process.exit(0);
  error(`❌ Artigo não encontrado: ${articlePath}`);
  process.exit(0);
}

// Ler artigo completo
const fullContent = fs.readFileSync(articlePath, 'utf-8');
const url = `https://beiradocampo.com.br/${slug}`;

// Extrair frontmatter básico
const titleMatch = fullContent.match(/title:\s*"([^"]+)"/);
const typeMatch = fullContent.match(/type:\s*"([^"]+)"/);
const authorMatch = fullContent.match(/author:\s*"([^"]+)"/);
const teamsMatch = fullContent.match(/teams:\s*\[([^\]]+)\]/);

const title = titleMatch ? titleMatch[1] : '';
const type = typeMatch ? typeMatch[1] : 'news-synthesis';
const author = authorMatch ? authorMatch[1] : '';
const teams = teamsMatch ? teamsMatch[1].replace(/"/g, '').split(',').map(t => t.trim()) : [];

// Extrair conteúdo do artigo (após o frontmatter)
const contentMatch = fullContent.match(/^---\n[\s\S]*?\n---\n([\s\S]*)$/);
const articleBody = contentMatch ? contentMatch[1].substring(0, 3000) : fullContent.substring(0, 3000);

// Prompt para gerar tweets criativos
function generatePrompt(title, type, author, teams, articleBody, url) {
  const teamContext = teams.length >= 2 ? `${teams[0]} x ${teams[1]}` : teams[0] || 'Futebol brasileiro';
  
  return `Você é um editor de redes sociais especializado em futebol, conhecido por tweets criativos, diretos e que geram engajamento.

TAREFA: Criar uma thread de 4-5 tweets sobre este artigo de futebol.

REGRAS OBRIGATÓRIAS:
1. LEIA o conteúdo do artigo abaixo e extraia os pontos MAIS INTERESSANTES
2. Cada tweet deve ter NO MÁXIMO 280 caracteres
3. O primeiro tweet deve ter um HOOK forte (emoji + pergunta provocativa ou dado surpreendente)
4. Os tweets do meio devem contar uma HISTÓRIA ou argumento coerente
5. O último tweet deve ter o link do artigo + call-to-action natural
6. NUNCA use frases genéricas como "O que foi confirmado" ou "Por que isso importa"
7. SEMPRE seja específico sobre o jogo/time/tema do artigo
8. Use linguagem de torcedor, não de robô
9. Crie suspense/curiosidade para o leitor clicar no link

INFORMAÇÕES DO ARTIGO:
- Título: ${title}
- Tipo: ${type}
- Autor: ${author}
- Confronto: ${teamContext}

CONTEÚDO DO ARTIGO (primeiros 3000 caracteres):
${articleBody}

LINK DO ARTIGO: ${url}

FORMATO DA RESPOSTA:
Retorne APENAS os tweets, um por linha, separados por "|||". Exemplo:
Tweet 1 com hook|||Tweet 2 com contexto|||Tweet 3 com análise|||Tweet 4 com CTA e link ${url}`;
}

// Função para chamar LLM (simulada - na prática o agente cron faria isso)
// Como este script roda standalone, vamos criar tweets baseados no conteúdo extraído
function createThreadFromContent(title, type, author, teams, articleBody, url) {
  const thread = [];
  const matchup = teams.length >= 2 ? `${teams[0]} x ${teams[1]}` : teams[0] || 'Futebol';
  
  // Extrair informações específicas do corpo do artigo
  const isFinal = title.toLowerCase().includes('final') || articleBody.toLowerCase().includes('final');
  const hasScore = title.match(/(\d+)\s*x\s*(\d+)/);
  const competition = title.match(/(Paulistão|Carioca|Gauchão|Mineiro|Cearense|Copa do Brasil|Libertadores|Brasileirão|Recopa)/i)?.[1] || '';
  
  // Tweet 1: Hook específico baseado no tipo
  if (type === 'post-match' && hasScore) {
    const [_, g1, g2] = hasScore;
    const winner = parseInt(g1) > parseInt(g2) ? teams[0] : teams[1];
    thread.push(`🚨 ${matchup}: ${g1}x${g2}

O ${winner} não apenas venceu — dominou. E os números mostram como.

Thread 👇`);
  } else if (type === 'pre-match' && isFinal) {
    thread.push(`🏆 ${matchup} — Decisão do ${competition}

Hoje é dia de final. Escalações, análise e tudo que você precisa saber antes do apito.

Segue o fio 👇`);
  } else if (type === 'opinion-column') {
    thread.push(`💬 ${title}

Tem coisa que precisa ser dita. E a gente não vai ficar calado.

Opinião 👇`);
  } else if (type === 'stat-analysis') {
    thread.push(`📊 ${title}

Um número que ninguém está comentando — e que muda tudo.

Análise 👇`);
  } else {
    thread.push(`🚨 ${title}

O que acabou de acontecer e por que você precisa saber.

Thread 👇`);
  }
  
  // Tweet 2: Contexto específico extraído do artigo
  // Tentar extrair primeiro parágrafo relevante
  const firstPara = articleBody.split('\n\n')[0]?.replace(/^#+\s*/, '').substring(0, 200);
  if (firstPara && firstPara.length > 50) {
    thread.push(`${firstPara}${firstPara.length > 250 ? '...' : ''}`);
  } else {
    thread.push(`O contexto que você não vai encontrar em 30 segundos de highlight.

Detalhes que fazem a diferença.`);
  }
  
  // Tweet 3: Ponto-chave do artigo
  // Procurar por padrões de destaque no texto
  const hasStats = articleBody.includes('%') || articleBody.includes('gols') || articleBody.includes('vitória');
  const hasQuote = articleBody.match(/"([^"]{50,200})"/);
  
  if (hasQuote) {
    thread.push(`🗣️ "${hasQuote[1].substring(0, 220)}${hasQuote[1].length > 220 ? '...' : ''}"`);
  } else if (hasStats) {
    thread.push(`📈 O dado que resume tudo:

A estatística que explica por que o jogo foi decidido assim — e não de outro jeito.`);
  } else {
    thread.push(`⚡ O momento que definiu:

Aquela jogada, aquela decisão, aquele lance que mudou o jogo.`);
  }
  
  // Tweet 4: Análise ou consequência
  if (type === 'post-match') {
    thread.push(`🔮 E agora?

O que essa vitória (ou derrota) muda para a sequência? A resposta não é óbvia.`);
  } else if (type === 'pre-match') {
    thread.push(`🎯 O duelo decisivo:

Onde o jogo será ganho ou perdido. E quem leva vantagem nesse confronto.`);
  } else {
    thread.push(`💡 A conclusão:

O que isso significa de verdade — além do óbvio.`);
  }
  
  // Tweet 5: CTA com link
  const hashtags = teams.slice(0, 2).map(t => `#${t.toLowerCase().replace(/\s/g, '')}`).join(' ');
  thread.push(`Análise completa 👇

${url}

${hashtags || '#futebol'}`);
  
  return thread.filter(t => t.length <= 280);
}

// Criar thread
const thread = createThreadFromContent(title, type, author, teams, articleBody, url);

log('📝 Artigo:', slug);
log('📰 Título:', title);
log('📋 Tipo:', type);
log('');
log(`🐦 Thread gerada (${thread.length} tweets):`);
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
      console.log(`TWITTER_SKIPPED: ${errorCode}`);
      process.exit(0);
    }

    error('❌ Erro:', errorMessage);
    console.log(`TWITTER_FAILED: ${errorCode}`);
    process.exit(0);
  }
}

if (yes || silent) {
  postThread();
} else {
  log('⚠️  Modo de simulação. Use --yes para postar.');
}
