# Tipos de Conteudo - Portal de Futebol

> Cada tipo de conteudo tem estrutura, extensao, SEO e autor-padrao definidos. O agente de IA deve seguir o template correspondente ao gerar cada artigo.

---

## 1. NOTICIA SINTESE (Breaking News Synthesis)

**Codigo interno:** `news-synthesis`

**O que e:** Nao e copia de uma unica fonte. E a SINTESE de 3+ fontes sobre o mesmo assunto, adicionando contexto, historico e impacto.

**Quando publicar:** Assim que detectar uma noticia relevante em multiplas fontes confiaveis.

**Autor padrao:** Renato Caldeira (mercado), Marcos V. Santos (Europa)

**Extensao:** 600-900 palavras

**Estrutura MDX:**

```mdx
---
title: "[Titulo otimizado para SEO]"
slug: "[slug-com-keywords]"
type: "news-synthesis"
publishedAt: "2026-02-24T10:30:00-03:00"
updatedAt: "2026-02-24T14:00:00-03:00"
author:
  name: "Renato Caldeira"
  slug: "renato-caldeira"
  role: "Editor-Chefe"
  avatar: "/authors/renato-caldeira.webp"
category: "mercado-da-bola"
tags: ["flamengo", "transferencias", "serie-a"]
teams: ["flamengo"]
competition: "brasileirao-serie-a"
seo:
  metaTitle: "[Ate 60 caracteres]"
  metaDescription: "[Ate 155 caracteres com CTA implicito]"
  keywords: ["keyword1", "keyword2", "keyword3"]
featuredImage:
  url: "/images/2026/02/slug-da-imagem.webp"
  alt: "[Descricao acessivel da imagem]"
  caption: "[Credito da imagem]"
relatedArticles: ["slug-artigo-1", "slug-artigo-2"]
---

## [Subtitulo contextualizando - o que aconteceu]

[Paragrafo lide: QUEM, O QUE, QUANDO, ONDE - maximo 3 linhas]

[Paragrafo de contexto: por que isso importa, historico recente]

## O que se sabe ate agora

[Consolidacao das informacoes de multiplas fontes]

[Dados concretos: valores, datas, condicoes]

## Impacto para [time/competicao]

[Analise: como isso afeta o elenco, a temporada, as financas]

## Proximo capitulo

[O que esperar: proximos passos, datas importantes, cenarios possiveis]

---

*Informacoes atualizadas ate [horario]. Acompanhe o portal para novidades.*
```

**Checklist:**
- [ ] Minimo 3 fontes consultadas
- [ ] Nenhum paragrafo copiado na integra
- [ ] Contexto historico adicionado
- [ ] Link interno para artigo relacionado
- [ ] Meta description com urgencia/curiosidade

---

## 2. ANALISE PRE-JOGO

**Codigo interno:** `pre-match`

**O que e:** Analise completa antes de um jogo importante, com escalacoes provaveis, confronto direto, desfalques e palpite fundamentado.

**Quando publicar:** 4-12 horas antes do jogo (de manha para jogos noturnos, dia anterior para jogos matutinos)

**Autor padrao:** Patricia Mendes (Brasileirao), Marcos V. Santos (Europa), Thiago Borges (com foco em dados)

**Extensao:** 1000-1500 palavras

**Estrutura MDX:**

```mdx
---
title: "[Time A] x [Time B]: escalacao, onde assistir e analise | [Competicao] [ano]"
slug: "[time-a]-x-[time-b]-[competicao]-[data]"
type: "pre-match"
publishedAt: "2026-02-24T08:00:00-03:00"
author:
  name: "Patricia Mendes"
  slug: "patricia-mendes"
  role: "Analista Tatica"
  avatar: "/authors/patricia-mendes.webp"
category: "analise-tatica"
tags: ["escalacao", "time-a", "time-b", "competicao"]
teams: ["time-a", "time-b"]
competition: "brasileirao-serie-a"
matchData:
  homeTeam: "Time A"
  awayTeam: "Time B"
  date: "2026-02-24T21:30:00-03:00"
  stadium: "Nome do Estadio"
  competition: "Brasileirao Serie A - Rodada 5"
  broadcaster: "Premiere"
seo:
  metaTitle: "[Time A] x [Time B] hoje: escalacao e onde assistir"
  metaDescription: "Tudo sobre [Time A] x [Time B] pela [competicao]: escalacao provavel, desfalques, onde assistir e analise completa."
  keywords: ["time a x time b", "escalacao time a hoje", "onde assistir time a"]
featuredImage:
  url: "/images/2026/02/pre-jogo-slug.webp"
  alt: "[Descricao acessivel]"
  caption: "[Credito]"
relatedArticles: []
---

## Ficha tecnica

| | |
|---|---|
| **Jogo** | [Time A] x [Time B] |
| **Competicao** | [Campeonato] - [Rodada/Fase] |
| **Data e horario** | [dia], [data] - [horario] (horario de Brasilia) |
| **Local** | [Estadio], [cidade] |
| **Onde assistir** | [canais/streaming] |
| **Arbitro** | [nome] ([estado]) |

## Momento das equipes

### [Time A]
[Ultimos 5 resultados, forma recente, posicao na tabela, contexto]

### [Time B]
[Ultimos 5 resultados, forma recente, posicao na tabela, contexto]

## Escalacao provavel do [Time A]

[Formacao tatica]

[Escalacao completa - titular por posicao]

**Desfalques:** [lista com motivo - lesao, suspensao, etc.]

**Duvida:** [jogadores em duvida e por que]

## Escalacao provavel do [Time B]

[Mesmo formato]

## Confronto direto

[Ultimos 5 jogos entre as equipes com resultados]

[Estatistica relevante do historico]

## Ponto tatico: o que observar

[Analise de 2-3 aspectos taticos que podem decidir o jogo]

## Palpite da redacao

[Placar sugerido com justificativa baseada em dados/contexto - nunca "achismo"]
```

**Checklist:**
- [ ] Escalacao atualizada (conferir coletivas do dia)
- [ ] Desfalques confirmados
- [ ] Dados de confronto direto corretos
- [ ] Informacao de onde assistir correta
- [ ] Titulo contem "escalacao" + "onde assistir" (termos mais buscados)

---

## 3. ANALISE POS-JOGO

**Codigo interno:** `post-match`

**O que e:** Analise apos o jogo com contexto tatico, destaques individuais e consequencias para a classificacao.

**Quando publicar:** 1-3 horas apos o fim do jogo

**Autor padrao:** Patricia Mendes (tatica), Neide Ferreira (opiniao forte)

**Extensao:** 800-1200 palavras

**Estrutura MDX:**

```mdx
---
title: "[Time A] [placar] [Time B]: [destaque principal] | [Competicao]"
slug: "[time-a]-[placar]-[time-b]-[competicao]-[data]"
type: "post-match"
publishedAt: "2026-02-24T23:45:00-03:00"
author:
  name: "Patricia Mendes"
  slug: "patricia-mendes"
  role: "Analista Tatica"
  avatar: "/authors/patricia-mendes.webp"
category: "pos-jogo"
tags: ["resultado", "time-a", "time-b"]
teams: ["time-a", "time-b"]
competition: "brasileirao-serie-a"
matchResult:
  homeTeam: "Time A"
  awayTeam: "Time B"
  score: "2x1"
  scorers: ["Jogador A 23'", "Jogador B 67'", "Jogador C 89'"]
seo:
  metaTitle: "[Time A] [placar] [Time B]: gols e melhores momentos"
  metaDescription: "Resultado: [Time A] [placar] [Time B] pela [competicao]. Gols, destaques e analise completa do jogo."
  keywords: ["resultado time a x time b", "gols time a", "placar time a hoje"]
relatedArticles: []
---

## O que aconteceu

[Resumo factual do jogo em 3-4 linhas - sem opiniao ainda]

## Os gols

### [Jogador] - [minuto]'
[Descricao da jogada que resultou no gol]

### [Jogador] - [minuto]'
[Descricao da jogada]

## Analise tatica

[O que cada tecnico propôs, o que funcionou, o que nao funcionou]

[Mudancas que fizeram diferenca]

## Destaque: [Nome do jogador]

[Por que esse jogador foi o diferencial - com dados se possivel]

## O que muda na tabela

[Impacto na classificacao, distancia pro lider/Z4, proximos jogos]

## Proximos compromissos

| Time | Proximo jogo | Data |
|------|-------------|------|
| [Time A] | vs [Adversario] | [data] |
| [Time B] | vs [Adversario] | [data] |
```

---

## 4. RADAR DE TRANSFERENCIAS

**Codigo interno:** `transfer-radar`

**O que e:** Compilacao diaria dos principais rumores e movimentacoes do mercado da bola, com nivel de confiabilidade para cada rumor.

**Quando publicar:** 1x por dia, de manha (melhores rumores do dia anterior + novos)

**Autor padrao:** Renato Caldeira

**Extensao:** 800-1200 palavras

**Estrutura MDX:**

```mdx
---
title: "Radar de Transferencias [data]: [destaque do dia]"
slug: "radar-transferencias-[data]"
type: "transfer-radar"
publishedAt: "2026-02-24T07:00:00-03:00"
author:
  name: "Renato Caldeira"
  slug: "renato-caldeira"
  role: "Editor-Chefe"
  avatar: "/authors/renato-caldeira.webp"
category: "mercado-da-bola"
tags: ["transferencias", "mercado-da-bola", "rumores"]
seo:
  metaTitle: "Transferencias do dia [data]: rumores e confirmacoes"
  metaDescription: "Acompanhe as ultimas transferencias do futebol brasileiro e europeu. Rumores quentes, negociacoes e confirmacoes de [data]."
  keywords: ["transferencias hoje", "mercado da bola", "rumores futebol"]
relatedArticles: []
---

## Negociacoes quentes 🔥

### [Jogador] - [Time origem] → [Time destino]
**Status:** 🟢 Muito provavel / 🟡 Em negociacao / 🔴 Esfriou

[Detalhes da negociacao: valores, condicoes, interesse]

[O que falta para fechar]

---

### [Jogador 2] ...
[Mesmo formato]

## Confirmados hoje ✅

- **[Jogador]** assinou com o **[Time]** por [periodo]. Valor: [valor ou nao divulgado].

## Rumores para acompanhar

| Jogador | De | Para | Chance |
|---------|------|------|--------|
| [Nome] | [Clube] | [Clube] | 🟡 Media |

## Saiu do radar ❌

- **[Jogador]** nao vai mais para o **[Time]**. Motivo: [breve explicacao].
```

---

## 5. COLUNA DE OPINIAO

**Codigo interno:** `opinion-column`

**O que e:** Texto de opiniao com posicionamento claro sobre um tema polemico ou relevante da semana.

**Quando publicar:** Dias fixos por autor (ver Calendario Editorial)

**Autor padrao:** Neide Ferreira (principal), outros em rodizio

**Extensao:** 700-1000 palavras

**Estrutura MDX:**

```mdx
---
title: "[Titulo provocativo com posicionamento claro]"
slug: "[slug-descritivo]"
type: "opinion-column"
publishedAt: "2026-02-24T11:00:00-03:00"
author:
  name: "Neide Ferreira"
  slug: "neide-ferreira"
  role: "Colunista"
  avatar: "/authors/neide-ferreira.webp"
category: "opiniao"
tags: ["coluna", "opiniao", "tema"]
isOpinion: true
seo:
  metaTitle: "[Titulo provocativo - ate 60 chars]"
  metaDescription: "[Resumo da tese - ate 155 chars]"
  keywords: ["opiniao futebol", "tema especifico"]
relatedArticles: []
---

> **Coluna de [Nome do Autor]** | Publicada toda [dia da semana]

[Paragrafo de abertura FORTE - tese principal em 2-3 linhas]

[Desenvolvimento: argumentos, exemplos, dados de apoio]

[Contra-argumento reconhecido e rebatido]

[Conclusao provocativa - chamada para reflexao ou posicionamento firme]

---

*[Nome] e colunista do [Portal]. As opinioes expressas neste texto sao de responsabilidade da autora e nao necessariamente refletem a posicao editorial do portal.*
```

---

## 6. ANALISE ESTATISTICA

**Codigo interno:** `stat-analysis`

**O que e:** Artigo baseado em dados e estatisticas, com tabelas, comparativos e insights numericos.

**Quando publicar:** 2-3x por semana, geralmente no meio da semana (terca, quarta)

**Autor padrao:** Thiago Borges

**Extensao:** 900-1400 palavras

**Estrutura MDX:**

```mdx
---
title: "[Insight baseado em dados]: os numeros de [tema]"
slug: "[slug-descritivo-com-dados]"
type: "stat-analysis"
publishedAt: "2026-02-24T09:00:00-03:00"
author:
  name: "Thiago Borges"
  slug: "thiago-borges"
  role: "Analista de Dados"
  avatar: "/authors/thiago-borges.webp"
category: "estatisticas"
tags: ["estatisticas", "dados", "analise"]
seo:
  metaTitle: "[Dado impactante]: numeros de [tema]"
  metaDescription: "Analise estatistica completa sobre [tema]. Dados, comparativos e insights que voce nao vai encontrar em outro lugar."
  keywords: ["estatisticas futebol", "dados tema", "numeros tema"]
relatedArticles: []
---

## O numero que importa

[Dado principal em destaque - pode usar negrito ou heading grande]

[Contexto: de onde vem esse dado, por que surpreende]

## Os dados completos

[Tabela markdown com os dados principais]

| Jogador | Stat 1 | Stat 2 | Stat 3 |
|---------|--------|--------|--------|
| ... | ... | ... | ... |

## O que os numeros dizem

[Analise interpretativa dos dados - narrativa]

[Comparativos com temporadas anteriores ou outros jogadores]

## Conclusao: o que esperar

[Projecao baseada nos dados, sem achismo]

---

*Dados coletados de [fontes]. Metodologia: [breve explicacao].*
```

---

## 7. GUIA EVERGREEN (SEO Long-tail)

**Codigo interno:** `evergreen-guide`

**O que e:** Conteudo atemporal que responde perguntas frequentes e rankeia para long-tail keywords o ano todo.

**Quando publicar:** 1-2x por semana

**Autor padrao:** Qualquer autor, de acordo com o tema

**Extensao:** 1500-2500 palavras

**Exemplos de temas:**
- "Regulamento do Brasileirao 2026: tudo que voce precisa saber"
- "Como funciona o VAR no futebol brasileiro"
- "Tabela da Libertadores 2026: grupos, datas e onde assistir"
- "Maiores artilheiros da historia do [time]"
- "Como funciona a janela de transferencias no Brasil"

**Estrutura MDX:**

```mdx
---
title: "[Pergunta ou tema que as pessoas buscam no Google]"
slug: "[slug-long-tail-keyword]"
type: "evergreen-guide"
publishedAt: "2026-02-24T10:00:00-03:00"
updatedAt: "2026-02-24T10:00:00-03:00"
author:
  name: "[Autor]"
  slug: "[slug-autor]"
  role: "[Cargo]"
  avatar: "/authors/[slug].webp"
category: "[categoria]"
tags: ["guia", "regulamento", "tema"]
seo:
  metaTitle: "[Pergunta respondida - ate 60 chars]"
  metaDescription: "[Resposta direta + promessa de profundidade - 155 chars]"
  keywords: ["keyword primaria", "variacao 1", "variacao 2"]
schema:
  type: "FAQPage"
  questions:
    - q: "[Pergunta 1]"
      a: "[Resposta curta para snippet]"
    - q: "[Pergunta 2]"
      a: "[Resposta curta]"
relatedArticles: []
---

## [Introducao respondendo a pergunta principal de forma direta]

[Expansao com contexto]

## [Subtopico 1 - H2 com keyword]

[Conteudo detalhado]

## [Subtopico 2]

[Conteudo detalhado]

## Perguntas frequentes

### [Pergunta 1]?
[Resposta direta e concisa]

### [Pergunta 2]?
[Resposta direta e concisa]

---

*Ultima atualizacao: [data]. Este artigo e atualizado periodicamente.*
```

---

## 8. COBERTURA RODADA COMPLETA

**Codigo interno:** `round-coverage`

**O que e:** Resumo completo de uma rodada do campeonato com todos os resultados, destaques e impacto na classificacao.

**Quando publicar:** Apos o ultimo jogo da rodada (geralmente domingo a noite ou segunda)

**Autor padrao:** Patricia Mendes ou Thiago Borges

**Extensao:** 1200-1800 palavras

**Estrutura MDX:**

```mdx
---
title: "Rodada [N] do Brasileirao: resultados, destaques e classificacao"
slug: "brasileirao-2026-rodada-[n]-resultados"
type: "round-coverage"
publishedAt: "2026-02-24T22:00:00-03:00"
author:
  name: "[Autor]"
  slug: "[slug]"
  role: "[Cargo]"
  avatar: "/authors/[slug].webp"
category: "brasileirao"
tags: ["brasileirao", "rodada", "resultados", "classificacao"]
competition: "brasileirao-serie-a"
round: [N]
seo:
  metaTitle: "Rodada [N] Brasileirao 2026: todos os resultados e classificacao"
  metaDescription: "Confira todos os resultados da rodada [N] do Brasileirao 2026, destaques, goleadas e a classificacao atualizada."
  keywords: ["rodada N brasileirao", "resultados brasileirao hoje", "classificacao brasileirao 2026"]
relatedArticles: []
---

## Todos os resultados

| Jogo | Placar | Estadio |
|------|--------|---------|
| [Time A] x [Time B] | [placar] | [estadio] |
| ... | ... | ... |

## Destaque da rodada: [titulo]

[O resultado/acontecimento mais relevante da rodada]

## Surpresa da rodada

[Resultado inesperado e por que surpreendeu]

## Classificacao atualizada

| Pos | Time | P | J | V | E | D | GP | GC | SG |
|-----|------|---|---|---|---|---|----|----|-----|
| 1 | ... | | | | | | | | |

## Artilharia

| Pos | Jogador | Time | Gols |
|-----|---------|------|------|
| 1 | ... | ... | ... |

## O que vem na proxima rodada

[Jogos-chave da proxima rodada com datas]
```

---

## Resumo de Tipos e Volume Diario Esperado

| Tipo | Freq. Semanal | Palavras | Principal SEO Target |
|------|---------------|----------|---------------------|
| Noticia Sintese | 7-14 | 600-900 | Keywords quentes do dia |
| Pre-Jogo | 5-10 | 1000-1500 | "escalacao [time] hoje" |
| Pos-Jogo | 5-10 | 800-1200 | "resultado [time a] x [time b]" |
| Radar Transferencias | 5-7 | 800-1200 | "transferencias hoje" |
| Coluna de Opiniao | 3-4 | 700-1000 | Temas polemicos trending |
| Analise Estatistica | 2-3 | 900-1400 | "estatisticas [tema]" |
| Guia Evergreen | 1-2 | 1500-2500 | Long-tail perenes |
| Cobertura Rodada | 1-2 | 1200-1800 | "rodada N brasileirao resultados" |
