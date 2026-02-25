# Estrategia de SEO - Portal de Futebol

> Documento de referencia para otimizacao de busca organica no Google Brasil. Todas as decisoes de titulo, URL, meta tags e linkagem interna devem seguir este guia.

---

## 1. Arquitetura de URLs

### Estrutura Base

```
https://[dominio].com.br/
├── /noticias/[slug]                    # Noticias sintese
├── /analise/pre-jogo/[slug]           # Analises pre-jogo
├── /analise/pos-jogo/[slug]           # Analises pos-jogo
├── /transferencias/[slug]              # Radar + noticias de mercado
├── /opiniao/[slug]                     # Colunas de opiniao
├── /estatisticas/[slug]                # Analises de dados
├── /guia/[slug]                        # Conteudo evergreen
├── /brasileirao/[ano]/                 # Hub do Brasileirao
│   ├── /classificacao                  # Tabela atualizada
│   ├── /rodada-[n]                     # Cobertura de rodada
│   └── /artilharia                     # Ranking de goleadores
├── /libertadores/[ano]/                # Hub Libertadores
├── /champions-league/[temporada]/      # Hub Champions
├── /times/[slug-time]/                 # Pagina agregadora por time
├── /autores/[slug-autor]/              # Pagina do autor
└── /sitemap.xml                        # Sitemap dinamico
```

### Regras de Slug

- Sempre em minusculas, sem acentos: `flamengo-x-palmeiras` nao `Flamengo-x-Palmeiras`
- Separado por hifen: `escalacao-do-flamengo-hoje`
- Maximo 60 caracteres no slug
- Incluir keyword principal no slug
- Para jogos: `[time-casa]-x-[time-fora]-[competicao]-[data-YYYY-MM-DD]`
- Para transferencias: `[jogador]-[time]-[acao]` ex: `neymar-santos-proposta-oficial`
- Nunca usar datas no formato dd/mm: usar `2026-02-24`

---

## 2. Padroes de Titulo por Tipo de Conteudo

### Pre-Jogo (MAIOR volume de busca)

**Keyword clusters principais:**
- "escalacao do [time] hoje" (~50k buscas/mes em dia de jogo)
- "[time a] x [time b] onde assistir" (~30k buscas)
- "[time a] x [time b] horario" (~20k buscas)
- "[time a] x [time b] palpite" (~15k buscas)

**Padroes de titulo que rankeiam:**

```
# Padrao 1 (mais completo - preferido)
[Time A] x [Time B]: escalacao, onde assistir e palpite | [Competicao] 2026

# Padrao 2 (focado em escalacao)
Escalacao do [Time] hoje contra o [Adversario]: titulares e desfalques

# Padrao 3 (focado em transmissao)
[Time A] x [Time B] ao vivo: onde assistir, horario e escalacoes | [Competicao]

# Padrao 4 (rodada)
[Time A] x [Time B] pela [Competicao]: tudo sobre o jogo de [dia da semana]
```

**Meta description padrao:**
```
Saiba tudo sobre [Time A] x [Time B] pela [Competicao]: escalacao provavel,
desfalques, onde assistir ao vivo e analise completa. Jogo [dia] as [hora].
```

### Pos-Jogo

**Keywords principais:**
- "resultado [time a] x [time b]" (~40k em dia de jogo)
- "[time a] [placar] [time b]" (~25k)
- "gols [time] hoje" (~15k)

**Padroes de titulo:**

```
# Padrao 1
[Time A] [placar] [Time B]: gols, melhores momentos e analise | [Competicao]

# Padrao 2 (com destaque)
[Time A] vence [Time B] por [placar] com gol de [jogador] | [Competicao]

# Padrao 3 (dramatico)
[Time A] [placar] [Time B]: [fato marcante do jogo] | [Competicao]
```

### Transferencias

**Keywords principais:**
- "[jogador] [time]" (variavel, pode explodir para 200k+)
- "transferencias [time] 2026" (~20k/mes)
- "reforcos do [time] 2026" (~15k/mes)
- "mercado da bola hoje" (~10k/mes)

**Padroes de titulo:**

```
# Padrao 1 (confirmacao)
[Time] anuncia [Jogador]: valores, contrato e detalhes da contratacao

# Padrao 2 (negociacao)
[Jogador] no [Time]? Negociacao avanca e valores sao revelados

# Padrao 3 (radar diario)
Transferencias hoje ([data]): [destaque principal] e mais rumores

# Padrao 4 (compilacao)
Reforcos do [Time] para 2026: quem chega, quem sai e como fica o elenco
```

### Opiniao/Coluna

```
# Padrao 1 (provocativo)
[Afirmacao forte sobre tema polemico] | Coluna [Nome]

# Padrao 2 (pergunta)
[Pergunta polemica]? O que os fatos mostram | Coluna [Nome]
```

### Estatisticas

```
# Padrao 1
[Dado surpreendente]: os numeros de [tema] no [competicao] 2026

# Padrao 2
Os [N] melhores [categoria] do [competicao] 2026: ranking por dados
```

### Guia Evergreen

```
# Padrao 1 (pergunta)
[Pergunta]: guia completo [ano]

# Padrao 2 (lista)
[Tema]: tudo que voce precisa saber em [ano]

# Padrao 3 (tabela)
Tabela do [Competicao] [ano]: classificacao atualizada [mes]
```

---

## 3. Otimizacao On-Page

### Checklist por Artigo

```markdown
SEO ON-PAGE CHECKLIST:

□ Titulo (H1): 50-65 caracteres, keyword no inicio
□ Meta title: ate 60 chars (pode diferir do H1)
□ Meta description: 140-155 chars, com CTA implicito ("Confira", "Saiba")
□ URL: keyword principal no slug, ate 60 chars
□ H2s: minimo 3 subtitulos, keywords secundarias
□ Paragrafo de abertura: keyword principal nas primeiras 100 palavras
□ Imagem featured: alt text descritivo com keyword
□ Links internos: minimo 2 links para artigos do portal
□ Links externos: minimo 1 fonte de autoridade
□ Dados estruturados: schema correto para o tipo de conteudo
□ Atualizacao: campo updatedAt preenchido quando relevante
```

### Schema Markup por Tipo

```json
// NewsArticle - para noticias e pos-jogo
{
  "@type": "NewsArticle",
  "headline": "...",
  "datePublished": "...",
  "dateModified": "...",
  "author": { "@type": "Person", "name": "..." },
  "publisher": { "@type": "Organization", "name": "..." }
}

// SportsEvent - para pre-jogo
{
  "@type": "SportsEvent",
  "name": "Time A vs Time B",
  "startDate": "...",
  "location": { "@type": "Place", "name": "Estadio" },
  "homeTeam": { "@type": "SportsTeam", "name": "..." },
  "awayTeam": { "@type": "SportsTeam", "name": "..." }
}

// FAQPage - para guias evergreen
{
  "@type": "FAQPage",
  "mainEntity": [
    { "@type": "Question", "name": "...", "acceptedAnswer": { "@type": "Answer", "text": "..." } }
  ]
}
```

---

## 4. Estrategia de Keywords

### Clusters de Keywords por Campeonato

**Brasileirao Serie A (maior volume):**
```
- "tabela brasileirao 2026" (220k/mes)
- "classificacao brasileirao" (180k/mes)
- "jogos do brasileirao hoje" (90k/mes)
- "artilheiro brasileirao 2026" (40k/mes)
- "brasileirao serie a 2026 tabela" (35k/mes)
- "regulamento brasileirao 2026" (15k/mes)
- "rebaixamento brasileirao 2026" (20k/mes - cresce no 2o semestre)
```

**Por Time (top 12 - maior torcida):**
```
[Time]: "escalacao do [time] hoje", "noticias do [time]",
        "proximo jogo do [time]", "contratacoes [time] 2026",
        "tabela do [time] 2026", "jogos do [time]"

Replicar para: Flamengo, Corinthians, Palmeiras, Sao Paulo,
Vasco, Gremio, Internacional, Cruzeiro, Atletico-MG,
Fluminense, Botafogo, Santos
```

**Libertadores:**
```
- "libertadores 2026 tabela" (80k/mes)
- "jogos libertadores hoje" (50k/mes)
- "classificacao libertadores 2026" (40k/mes)
- "onde assistir libertadores" (30k/mes)
```

**Champions League:**
```
- "champions league 2025-26" (60k/mes)
- "resultados champions league" (45k/mes)
- "jogos da champions hoje" (35k/mes)
- "classificacao champions league" (30k/mes)
```

### Keywords de Cauda Longa (Oportunidade)

```
# Escalacao (OURO - busca dispara em dia de jogo)
"escalacao do flamengo hoje contra o palmeiras"
"escalacao do corinthians com reforcos"
"quem joga no [time] hoje"

# Transmissao (OURO - altissimo volume)
"que horas joga o [time] hoje"
"onde assistir [time a] x [time b] ao vivo e gratis"
"[time a] x [time b] vai passar em qual canal"

# Transferencias (PRATA - picos em janelas)
"[jogador] vai para o [time]?"
"quanto o [time] pagou por [jogador]"
"salario de [jogador] no [time]"

# Historico (BRONZE - volume constante)
"quantos titulos brasileiros tem o [time]"
"maior goleada da historia do [time]"
"maiores idolos do [time]"
```

---

## 5. Estrategia de Link Building Interno

### Principios

1. **Todo artigo deve ter minimo 2 links internos**
2. **Links devem ser contextuais** (dentro do texto, nao lista no final)
3. **Anchor text descritivo** (nunca "clique aqui", sempre keyword relevante)
4. **Paginas hub devem agregar links** (pagina do time, pagina do campeonato)

### Modelo de Linkagem

```
PAGINA HUB DO TIME (ex: /times/flamengo/)
  ├── Links para TODAS as noticias do Flamengo
  ├── Links para pre/pos jogos do Flamengo
  ├── Links para transferencias do Flamengo
  └── Atualizada automaticamente

ARTIGO DE NOTICIA
  ├── Link para pagina hub do time
  ├── Link para ultimo artigo relacionado do mesmo time
  ├── Link para guia evergreen relevante
  └── Link para coluna de opiniao se tiver

ANALISE PRE-JOGO
  ├── Link para pagina hub de cada time
  ├── Link para ultima analise pos-jogo do mesmo time
  ├── Link para estatisticas relevantes
  └── Link para tabela do campeonato

ANALISE POS-JOGO
  ├── Link para pre-jogo correspondente
  ├── Link para pagina hub de cada time
  ├── Link para tabela atualizada
  └── Link para proximo jogo do time
```

### Mapa de Links Automaticos

O sistema de build deve gerar links automaticamente:

```javascript
// Regras de auto-linkagem no conteudo MDX
const autoLinkRules = {
  // Nomes de times linkam para hub
  "Flamengo": "/times/flamengo/",
  "Palmeiras": "/times/palmeiras/",
  // ... todos os times

  // Competicoes linkam para hub
  "Brasileirao": "/brasileirao/2026/",
  "Libertadores": "/libertadores/2026/",
  "Champions League": "/champions-league/2025-26/",

  // Maximo 1 auto-link por termo por artigo
  // Nao auto-linkar dentro de headings
  // Nao auto-linkar se ja tem link manual proximo
};
```

---

## 6. Google Discover e Google News

### Otimizacao para Google Discover

O Google Discover prioriza conteudo com:
- **Imagens grandes** (minimo 1200x675px, aspect ratio 16:9)
- **Titulos envolventes** sem ser clickbait
- **E-E-A-T forte** (byline de autor, bio, expertise)
- **Freshness** - conteudo recente e atualizado

**Regras para Discover:**
- Todas as imagens featured devem ser >= 1200px de largura
- Usar `max-image-preview: large` no robots meta tag
- Nunca usar titulos enganosos ou exagerados
- Manter freshness: atualizar artigos relevantes (updatedAt)

### Otimizacao para Google News

**Requisitos tecnicos:**
- Sitemap de noticias: `/sitemap-news.xml`
- Publicacao consistente (diaria)
- Byline de autor em todos os artigos
- Secao clara de categoria
- Data de publicacao em ISO 8601

**Regras de conteudo:**
- Nao duplicar titulos de outros portais
- Adicionar analise/contexto unico em cada noticia
- Manter imparcialidade em noticias (opiniao so em colunas marcadas)
- Corrigir erros rapidamente e marcar como atualizado

---

## 7. Velocidade e Core Web Vitals

**Metas:**
- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1

**Implementacao:**
- Imagens em WebP/AVIF com lazy loading
- Font display: swap para fontes customizadas
- SSG (Static Site Generation) para artigos
- ISR (Incremental Static Regeneration) para tabelas ao vivo
- Prefetch de links internos no viewport

---

## 8. Monitoramento e KPIs

### Metricas Semanais a Acompanhar

| Metrica | Meta Mes 1 | Meta Mes 3 | Meta Mes 6 |
|---------|-----------|-----------|-----------|
| Artigos publicados/semana | 40-50 | 50-60 | 55-70 |
| Sessoes organicas/dia | 100 | 1.000 | 10.000 |
| Paginas indexadas | 200 | 800 | 2.000 |
| Keywords no top 10 | 20 | 100 | 500 |
| Cliques Google News/dia | 0 | 50 | 500 |
| Impressoes Discover/dia | 0 | 200 | 5.000 |
| Tempo medio na pagina | 1:30 | 2:00 | 2:30 |
| Bounce rate | < 70% | < 65% | < 55% |

### Ferramentas Necessarias

- Google Search Console (obrigatorio)
- Google Analytics 4 (obrigatorio)
- Google News Publisher Center (registrar ASAP)
- Ahrefs ou SEMrush (monitoramento de keywords)
- PageSpeed Insights (Core Web Vitals)
