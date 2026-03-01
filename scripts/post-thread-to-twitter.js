#!/usr/bin/env node
/**
 * post-thread-to-twitter.js — Posta uma thread no Twitter/X com templates por tipo
 * 
 * Uso:
 *   node scripts/post-thread-to-twitter.js <slug-do-artigo> [--yes] [--silent]
 * 
 * Templates disponíveis:
 *   - post-match: Pós-jogo com estatísticas
 *   - opinion-column: Coluna de opinião (Neide Ferreira)
 *   - stat-analysis: Análise estatística (Thiago Borges)
 *   - pre-match: Pré-jogo com escalação
 *   - news-synthesis: Notícia de mercado/transferência
 *   - transfer-radar: Radar de transferências
 *   - round-coverage: Cobertura de rodada
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

// Ler frontmatter
const content = fs.readFileSync(articlePath, 'utf-8');
const titleMatch = content.match(/title:\s*"([^"]+)"/);
const excerptMatch = content.match(/excerpt:\s*"([^"]+)"/);
const typeMatch = content.match(/type:\s*"([^"]+)"/);
const authorMatch = content.match(/author:\s*"([^"]+)"/);
const categoryMatch = content.match(/category:\s*"([^"]+)"/);
const teamsMatch = content.match(/teams:\s*\[([^\]]+)\]/);
const tagsMatch = content.match(/tags:\s*\[([^\]]+)\]/);

const title = titleMatch ? titleMatch[1] : '';
const excerpt = excerptMatch ? excerptMatch[1] : '';
const type = typeMatch ? typeMatch[1] : 'news-synthesis';
const author = authorMatch ? authorMatch[1] : '';
const category = categoryMatch ? categoryMatch[1] : '';
const teams = teamsMatch ? teamsMatch[1].replace(/"/g, '').split(',').map(t => t.trim()) : [];
const tags = tagsMatch ? tagsMatch[1].replace(/"/g, '').split(',').map(t => t.trim().replace(/\s+/g, '')) : [];
const url = `https://beiradocampo.com.br/${slug}`;

// Extrair hashtags das tags
function getHashtags(tags, max = 3) {
  return tags
    .slice(0, max)
    .map(t => `#${t.replace(/-/g, '').replace(/[ãáâàä]/gi, 'a').replace(/[éêèë]/gi, 'e').replace(/[íîìï]/gi, 'i').replace(/[óôòö]/gi, 'o').replace(/[úûùü]/gi, 'u').replace(/ç/gi, 'c')}`)
    .join(' ');
}

// ===== TEMPLATES DE THREAD =====

/**
 * Template: PÓS-JOGO (post-match)
 * Autores: Patricia Mendes, Neide Ferreira
 */
function createPostMatchThread(title, teams, url, author) {
  const thread = [];
  const hashtags = getHashtags(teams.length >= 2 ? teams : ['paulistao', 'futebol']);
  
  // Tweet 1: Hook com resultado
  thread.push(`🧵 ${title}`);
  
  // Tweet 2: Contexto do jogo
  thread.push(`Análise completa do que aconteceu, o que deu certo — e o que preocupa para a sequência.

Segue o fio 👇`);
  
  // Tweet 3: Dados/estatísticas
  thread.push(`📊 Os números do jogo:

• Posse de bola, finalizações, chances claras
• Destaques individuais
• Padrões táticos observados

Dados que contam uma história.`);
  
  // Tweet 4: Ponto alto
  thread.push(`🏆 O momento decisivo:

Quando e como o jogo foi definido. O lance que mudou tudo — e por que aconteceu.`);
  
  // Tweet 5: Problema/alerta (se aplicável)
  thread.push(`⚠️ O ponto de atenção:

O que não funcionou, o que precisa melhorar, e o que isso significa para o próximo jogo.`);
  
  // Tweet 6: CTA
  thread.push(`Análise completa com estatísticas detalhadas 👇

${url}

${hashtags}`);
  
  return thread;
}

/**
 * Template: COLUNA DE OPINIÃO (opinion-column)
 * Autor: Neide Ferreira
 */
function createOpinionThread(title, excerpt, url, author) {
  const thread = [];
  
  // Tweet 1: Hook provocativo
  thread.push(`💬 ${title}

Por @neideferreira — e ela não está pedindo licença pra falar.`);
  
  // Tweet 2: A tese
  thread.push(`A opinião em uma frase:

O problema não é o que aconteceu. É o que isso revela sobre o que ainda vai acontecer.`);
  
  // Tweet 3: O argumento 1
  thread.push(`🎯 Argumento principal:

Por que a situação atual é mais grave (ou mais simples) do que parece. Sem clubismo, sem favor.`);
  
  // Tweet 4: A prova
  thread.push(`📋 Os fatos que sustentam:

Números, histórico, comparações. Opinião sem dado é só achismo.`);
  
  // Tweet 5: A conclusão
  thread.push(`⚡ A conclusão:

O que precisa mudar — e quem precisa mudar. Direto, sem rodeios.`);
  
  // Tweet 6: CTA
  thread.push(`Leia a coluna completa 👇

${url}

#opiniao #futebol`);
  
  return thread;
}

/**
 * Template: ANÁLISE ESTATÍSTICA (stat-analysis)
 * Autor: Thiago Borges
 */
function createStatAnalysisThread(title, teams, url, author) {
  const thread = [];
  const teamName = teams[0] || 'Time';
  
  // Tweet 1: Hook com dado
  thread.push(`📊 ${title}

Os números contam uma história que os holofotes não contam.`);
  
  // Tweet 2: O dado principal
  thread.push(`🔍 O número que importa:

Um dado estatístico surpreendente — e o que ele revela sobre o desempenho real do time.`);
  
  // Tweet 3: Contexto
  thread.push(`📈 Comparativo histórico:

Como esse número se compara às últimas temporadas? Estamos vendo algo raro — ou padrão?`);
  
  // Tweet 4: Implicação tática
  thread.push(`⚽ O que isso muda em campo:

Como esse dado afeta o jogo? Onde o time ganha ou perde por causa disso?`);
  
  // Tweet 5: Projeção
  thread.push(`🔮 Projeção:

Se esse padrão continuar, o que esperar nas próximas rodadas? A matemática é implacável.`);
  
  // Tweet 6: CTA
  thread.push(`Análise estatística completa com gráficos 👇

${url}

#estatisticas #${teamName} #futebol`);
  
  return thread;
}

/**
 * Template: PRÉ-JOGO (pre-match)
 * Autor: Patricia Mendes
 */
function createPreMatchThread(title, teams, url, author) {
  const thread = [];
  const matchup = teams.length >= 2 ? `${teams[0]} x ${teams[1]}` : title;
  
  // Tweet 1: Hook
  thread.push(`⚽ ${matchup}

Tudo que você precisa saber antes do apito inicial.`);
  
  // Tweet 2: O contexto
  thread.push(`📋 O que está em jogo:

Posição na tabela, momento das equipes, e o que esse resultado muda para cada lado.`);
  
  // Tweet 3: Escalação e desfalques
  thread.push(`👥 Escalação provável + desfalques:

Quem entra, quem sai, e quem não pode jogar. A escalação muda tudo.`);
  
  // Tweet 4: Chave tática
  thread.push(`🎯 O duelo decisivo:

O confronto individual que pode definir o jogo — e quem leva vantagem.`);
  
  // Tweet 5: Palpite
  thread.push(`🔮 Projeção:

Como o jogo deve se desenhar? E o placar mais provável?`);
  
  // Tweet 6: CTA
  thread.push(`Análise completa + onde assistir 👇

${url}

#prejogo #futebol`);
  
  return thread;
}

/**
 * Template: NOTÍCIA / TRANSFERÊNCIA (news-synthesis)
 * Autor: Renato Caldeira
 */
function createNewsThread(title, excerpt, url, author) {
  const thread = [];
  
  // Tweet 1: Hook com fato
  thread.push(`🚨 ${title}`);
  
  // Tweet 2: O que aconteceu
  thread.push(`📰 O fato:

O que foi confirmado, por quem, e quando. Sem especulação — só o que tem fonte.`);
  
  // Tweet 3: O contexto
  thread.push(`💡 Por que isso importa:

Como essa notícia muda o cenário? O impacto imediato e o que vem por aí.`);
  
  // Tweet 4: Reações/Próximos passos
  thread.push(`⏭️ O que vem agora:

Próximos passos, prazos, e o que ainda está em aberto.`);
  
  // Tweet 5: CTA
  thread.push(`Notícia completa com detalhes 👇

${url}

#futebol #noticias`);
  
  return thread;
}

/**
 * Template: RADAR DE TRANSFERÊNCIAS (transfer-radar)
 * Autor: Renato Caldeira
 */
function createTransferRadarThread(title, url, author) {
  const thread = [];
  
  // Tweet 1: Hook
  thread.push(`🔄 Radar de Transferências

As movimentações do dia que você não pode perder.`);
  
  // Tweet 2: Destaque principal
  thread.push(`⭐ A negociação quente:

O nome que está movimentando o mercado — e o estágio atual da conversa.`);
  
  // Tweet 3: Outras movimentações
  thread.push(`📋 Mais do dia:

Outros nomes em pauta, sondagens confirmadas, e negócios fechados.`);
  
  // Tweet 4: Análise de mercado
  thread.push(`💰 O panorama:

Como o mercado está se movendo? Quem está comprando, quem está vendendo?`);
  
  // Tweet 5: CTA
  thread.push(`Radar completo com todos os detalhes 👇

${url}

#transferencias #mercadodabola`);
  
  return thread;
}

/**
 * Template: COBERTURA DE RODADA (round-coverage)
 * Autor: Patricia Mendes
 */
function createRoundCoverageThread(title, url, author) {
  const thread = [];
  
  // Tweet 1: Hook
  thread.push(`📅 Resumo da Rodada

Tudo que aconteceu — e o que mudou na tabela.`);
  
  // Tweet 2: Resultados principais
  thread.push(`⚽ Os resultados:

Os placares, os gols, e as surpresas do fim de semana.`);
  
  // Tweet 3: Destaques
  thread.push(`🌟 Os destaques:

Quem brilhou, quem decepcionou, e o lance da rodada.`);
  
  // Tweet 4: A tabela
  thread.push(`📊 A classificação:

Como ficou a tabela? Quem subiu, quem caiu, e quem está na zona.`);
  
  // Tweet 5: Próximos jogos
  thread.push(`⏭️ O que vem:

Os jogos da próxima rodada e os confrontos decisivos.`);
  
  // Tweet 6: CTA
  thread.push(`Cobertura completa da rodada 👇

${url}

#brasileirao #futebol`);
  
  return thread;
}

// ===== SELETOR DE TEMPLATE =====

function createThread(title, excerpt, type, author, teams, tags, url) {
  log(`📋 Tipo detectado: ${type}`);
  log(`✍️  Autor: ${author}`);
  log(`🏷️  Tags: ${tags.join(', ')}`);
  log('');
  
  switch (type) {
    case 'post-match':
      return createPostMatchThread(title, teams, url, author);
    case 'opinion-column':
      return createOpinionThread(title, excerpt, url, author);
    case 'stat-analysis':
      return createStatAnalysisThread(title, teams, url, author);
    case 'pre-match':
      return createPreMatchThread(title, teams, url, author);
    case 'transfer-radar':
      return createTransferRadarThread(title, url, author);
    case 'round-coverage':
      return createRoundCoverageThread(title, url, author);
    case 'news-synthesis':
    default:
      return createNewsThread(title, excerpt, url, author);
  }
}

// ===== EXECUÇÃO =====

const thread = createThread(title, excerpt, type, author, teams, tags, url);

log('📝 Artigo:', slug);
log('📰 Título:', title);
log('');
log(`🐦 Thread prevista (${thread.length} tweets):`);
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
