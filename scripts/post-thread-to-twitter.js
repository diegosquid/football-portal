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
  const matchup = teams.length >= 2 ? `${teams[0]} x ${teams[1]}` : title;
  
  // Tweet 1: Hook com resultado
  thread.push(`🧵 ${title}`);
  
  // Tweet 2: Contexto do jogo
  thread.push(`O que aconteceu em campo:

O ${matchup} que definiu a rodada — e o que ninguém está comentando.

Segue a análise 👇`);
  
  // Tweet 3: Dados/estatísticas
  thread.push(`📊 Os números que importam:

• Quem dominou a posse? Quem foi mais eficiente?
• Onde o jogo foi ganho (ou perdido)?
• Quem se destacou individualmente?

A história por trás dos dados.`);
  
  // Tweet 4: Ponto alto
  thread.push(`🏆 O momento decisivo:

O lance, a jogada, ou a decisão tática que mudou o resultado — e por que funcionou (ou não).`);
  
  // Tweet 5: Problema/alerta
  thread.push(`⚠️ O que preocupa:

O erro, a falha, ou o padrão negativo que apareceu — e o que isso significa para a sequência.`);
  
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
  
  // Tweet 1: Hook com dado surpreendente
  thread.push(`📊 ${title}

Um número que desafia o senso comum — e explica muito mais do que parece.`);
  
  // Tweet 2: O dado principal
  thread.push(`🔍 O dado que importa:

A estatística que não aparece nos highlights, mas explica por que o ${teamName} está onde está.`);
  
  // Tweet 3: Contexto histórico
  thread.push(`📈 Comparativo:

Como esse número se compara às últimas temporadas? Estamos vendo algo histórico — ou um padrão preocupante?`);
  
  // Tweet 4: Implicação tática
  thread.push(`⚽ O que isso muda:

Como esse dado afeta o jogo em campo? Onde o ${teamName} ganha ou perde por causa disso?`);
  
  // Tweet 5: Projeção
  thread.push(`🔮 O que esperar:

Se esse padrão continuar, o que acontece nas próximas rodadas? A matemática não mente.`);
  
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
function createPreMatchThread(title, teams, url, author, content) {
  const thread = [];
  const matchup = teams.length >= 2 ? `${teams[0]} x ${teams[1]}` : title;
  const team1 = teams[0] || 'Time A';
  const team2 = teams[1] || 'Time B';
  
  // Tentar extrair informações do conteúdo
  const isFinal = title.toLowerCase().includes('final');
  const competition = title.match(/(Paulistão|Carioca|Gauchão|Mineiro|Cearense|Copa do Brasil|Libertadores|Brasileirão)/i)?.[1] || 'Competição';
  
  // Tweet 1: Hook específico
  if (isFinal) {
    thread.push(`🏆 ${matchup} — Final do ${competition} 2026

O jogo que decide o campeão. Escalações, análise e onde assistir 👇`);
  } else {
    thread.push(`⚽ ${matchup} — ${competition} 2026

Tudo que você precisa saber antes do apito inicial.`);
  }
  
  // Tweet 2: O que está em jogo (específico)
  thread.push(`📋 O que está em jogo:

• ${team1}: busca recuperação ou confirmação?
• ${team2}: tenta surpreender ou manter invencibilidade?

Esse resultado muda a tabela de que forma?`);
  
  // Tweet 3: Escalação
  thread.push(`👥 Escalações prováveis:

Formações, desfalques de última hora, e as dúvidas do treinador.

Quem entra pode mudar o jogo.`);
  
  // Tweet 4: Chave do jogo
  thread.push(`🎯 A chave do jogo:

Onde ${team1} é forte? Onde ${team2} pode explorar?

O duelo tático que vai definir o resultado.`);
  
  // Tweet 5: Palpite
  thread.push(`🔮 Projeção:

Como o jogo se desenha? Quem leva vantagem no confronto direto?

Palpite da redação no artigo.`);
  
  // Tweet 6: CTA
  thread.push(`Análise completa com escalações e onde assistir 👇

${url}

#${team1.toLowerCase().replace(/\s/g, '')} #${team2.toLowerCase().replace(/\s/g, '')} #${competition.toLowerCase().replace(/[ãáâàä]/g, 'a').replace(/[õôóòö]/g, 'o')}`);
  
  return thread;
}

/**
 * Template: NOTÍCIA / TRANSFERÊNCIA (news-synthesis)
 * Autor: Renato Caldeira
 */
function createNewsThread(title, excerpt, url, author) {
  const thread = [];
  
  // Extrair time principal do título
  const teamMatch = title.match(/(Flamengo|Corinthians|Palmeiras|São Paulo|Vasco|Grêmio|Internacional|Atlético-MG|Cruzeiro|Fluminense|Botafogo|Santos)/i);
  const team = teamMatch ? teamMatch[1] : 'Futebol brasileiro';
  
  // Tweet 1: Hook com fato concreto
  thread.push(`🚨 ${title}`);
  
  // Tweet 2: O que aconteceu (específico)
  thread.push(`📰 Os detalhes:

O que foi confirmado, quem está envolvido, e por que isso muda o cenário do ${team}.

Sem rumor, só fato.`);
  
  // Tweet 3: O impacto imediato
  thread.push(`💡 O impacto:

Como essa notícia afeta o dia a dia do clube? O que muda já na próxima semana?`);
  
  // Tweet 4: Contexto/background
  thread.push(`🔍 O contexto:

Por que isso está acontecendo agora? A história recente que levou a esse momento.`);
  
  // Tweet 5: CTA com gancho
  thread.push(`Análise completa com todos os detalhes 👇

${url}

#${team.toLowerCase().replace(/\s/g, '')} #futebol`);
  
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

function createThread(title, excerpt, type, author, teams, tags, url, content) {
  log(`📋 Tipo detectado: ${type}`);
  log(`✍️  Autor: ${author}`);
  log(`🏷️  Tags: ${tags.join(', ')}`);
  log('');
  
  switch (type) {
    case 'post-match':
      return createPostMatchThread(title, teams, url, author, content);
    case 'opinion-column':
      return createOpinionThread(title, excerpt, url, author, content);
    case 'stat-analysis':
      return createStatAnalysisThread(title, teams, url, author, content);
    case 'pre-match':
      return createPreMatchThread(title, teams, url, author, content);
    case 'transfer-radar':
      return createTransferRadarThread(title, url, author, content);
    case 'round-coverage':
      return createRoundCoverageThread(title, url, author, content);
    case 'news-synthesis':
    default:
      return createNewsThread(title, excerpt, url, author, content);
  }
}

// ===== EXECUÇÃO =====

const thread = createThread(title, excerpt, type, author, teams, tags, url, content);

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
