import { articles } from "#content";
import { siteConfig } from "@/lib/site";

/**
 * /llms.txt — arquivo para LLMs (ChatGPT, Claude, Perplexity, etc.)
 * Spec: https://llmstxt.org/
 */
export function GET() {
  const baseUrl = siteConfig.url;

  // 10 artigos mais recentes
  const recentArticles = articles
    .filter((a) => !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const recentLinks = recentArticles
    .map((a) => `- [${a.title}](${baseUrl}/${a.slug}): ${a.excerpt.slice(0, 120)}`)
    .join("\n");

  const content = `# Beira do Campo

> Portal brasileiro de notícias e análises sobre futebol. Cobertura diária do Brasileirão, Copa do Brasil, Libertadores, Sul-Americana, Champions League e futebol internacional. Todo conteúdo é em português do Brasil (pt-BR) e atualizado diariamente.

Beira do Campo publica artigos de pré-jogo, pós-jogo, análises táticas, radar de transferências e colunas de opinião. O portal cobre os 20 clubes da Série A do Brasileirão e as principais competições sul-americanas e europeias. Os artigos são escritos por uma equipe de 5 jornalistas especializados.

## Competições Cobertas

- [Brasileirão Série A](${baseUrl}/categoria/brasileirao): Campeonato Brasileiro — resultados, classificação, análises de rodada e mercado da bola
- [Copa Libertadores](${baseUrl}/categoria/libertadores): Cobertura completa da Libertadores da América — fase de grupos, mata-mata e destaques brasileiros
- [Champions League](${baseUrl}/categoria/champions): Liga dos Campeões da UEFA — jogos, análises e brasileiros na Europa
- [Transferências](${baseUrl}/categoria/transferencias): Radar de transferências — contratações, saídas, negociações e rumores do mercado da bola
- [Análises Táticas](${baseUrl}/categoria/analises): Análises de desempenho, estatísticas avançadas e formações táticas
- [Seleção Brasileira](${baseUrl}/categoria/selecao): Convocações, jogos e bastidores da seleção
- [Futebol Internacional](${baseUrl}/categoria/futebol-internacional): Premier League, La Liga, Serie A, Bundesliga e Ligue 1
- [Opinião](${baseUrl}/categoria/opiniao): Colunas semanais e análises de bastidores

## Jogos de Futebol Hoje

- [Programação Completa](${baseUrl}/jogos-futebol-hoje): Todos os jogos de futebol do dia com horários, canais de TV e onde assistir ao vivo — atualizado diariamente
- [Palmeiras Hoje](${baseUrl}/jogos-futebol-hoje/palmeiras): Jogo do Palmeiras hoje e últimas notícias
- [Flamengo Hoje](${baseUrl}/jogos-futebol-hoje/flamengo): Jogo do Flamengo hoje e últimas notícias
- [Corinthians Hoje](${baseUrl}/jogos-futebol-hoje/corinthians): Jogo do Corinthians hoje e últimas notícias
- [São Paulo Hoje](${baseUrl}/jogos-futebol-hoje/sao-paulo): Jogo do São Paulo hoje e últimas notícias
- [Fluminense Hoje](${baseUrl}/jogos-futebol-hoje/fluminense): Jogo do Fluminense hoje e últimas notícias
- [Botafogo Hoje](${baseUrl}/jogos-futebol-hoje/botafogo): Jogo do Botafogo hoje e últimas notícias
- [Vasco Hoje](${baseUrl}/jogos-futebol-hoje/vasco): Jogo do Vasco hoje e últimas notícias
- [Grêmio Hoje](${baseUrl}/jogos-futebol-hoje/gremio): Jogo do Grêmio hoje e últimas notícias
- [Internacional Hoje](${baseUrl}/jogos-futebol-hoje/internacional): Jogo do Internacional hoje e últimas notícias
- [Cruzeiro Hoje](${baseUrl}/jogos-futebol-hoje/cruzeiro): Jogo do Cruzeiro hoje e últimas notícias

## Times Cobertos

- [Flamengo](${baseUrl}/time/flamengo): Notícias, jogos e análises do Flamengo
- [Palmeiras](${baseUrl}/time/palmeiras): Notícias, jogos e análises do Palmeiras
- [Corinthians](${baseUrl}/time/corinthians): Notícias, jogos e análises do Corinthians
- [São Paulo](${baseUrl}/time/sao-paulo): Notícias, jogos e análises do São Paulo
- [Santos](${baseUrl}/time/santos): Notícias, jogos e análises do Santos
- [Botafogo](${baseUrl}/time/botafogo): Notícias, jogos e análises do Botafogo
- [Fluminense](${baseUrl}/time/fluminense): Notícias, jogos e análises do Fluminense
- [Vasco da Gama](${baseUrl}/time/vasco): Notícias, jogos e análises do Vasco
- [Grêmio](${baseUrl}/time/gremio): Notícias, jogos e análises do Grêmio
- [Internacional](${baseUrl}/time/internacional): Notícias, jogos e análises do Internacional
- [Atlético-MG](${baseUrl}/time/atletico-mg): Notícias, jogos e análises do Atlético-MG
- [Cruzeiro](${baseUrl}/time/cruzeiro): Notícias, jogos e análises do Cruzeiro

## Artigos Recentes

${recentLinks}

## Equipe Editorial

- **Renato Caldeira** — Editor-chefe, especialista em transferências e mercado da bola
- **Patrícia Mendes** — Analista tática, cobertura de futebol feminino
- **Marcos Vinícius Santos** — Correspondente internacional, foco em futebol europeu
- **Neide Ferreira** — Colunista de opinião e cultura do futebol
- **Thiago Borges** — Analista de dados e estatísticas avançadas

## Optional

- [Sobre Nós](${baseUrl}/sobre): Informações sobre o portal e a equipe
- [Política de Privacidade](${baseUrl}/politica-de-privacidade): Política de privacidade
- [Termos de Uso](${baseUrl}/termos-de-uso): Termos de uso do portal
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
