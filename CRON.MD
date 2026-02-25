# CRON.MD - Guia Operacional do Agente Cron

> Este documento e o UNICO arquivo que o agente cron precisa ler para decidir O QUE fazer, QUANDO fazer, e COMO fazer em cada execucao. Ele referencia os outros documentos (`CONTENT_GUIDELINE.md`, `AUTHOR_PERSONAS.md`, `CONTENT_TYPES.md`, `EDITORIAL_CALENDAR.md`, `SEO_STRATEGY.md`, `IMAGE_STRATEGY.md`) para regras detalhadas de escrita, SEO e imagens.

---

## INDICE

1. [Resumo da Execucao](#1-resumo-da-execucao)
2. [Passo a Passo - Fluxo de Cada Execucao](#2-passo-a-passo---fluxo-de-cada-execucao)
3. [Logica de Horario - O Que Publicar Agora](#3-logica-de-horario---o-que-publicar-agora)
4. [Deduplicacao - Como Nao Repetir Materia](#4-deduplicacao---como-nao-repetir-materia)
5. [Distribuicao de Autores](#5-distribuicao-de-autores)
6. [Balanceamento de Categorias](#6-balanceamento-de-categorias)
7. [Como Pesquisar e Selecionar Pauta](#7-como-pesquisar-e-selecionar-pauta)
8. [Geracao do Artigo](#8-geracao-do-artigo)
9. [Publicacao e Commit](#9-publicacao-e-commit)
10. [Jogos do Dia - Logica Especial](#10-jogos-do-dia---logica-especial)
11. [Tabela de Decisao Rapida](#11-tabela-de-decisao-rapida)
12. [Tratamento de Erros e Edge Cases](#12-tratamento-de-erros-e-edge-cases)
13. [Variaveis de Ambiente](#13-variaveis-de-ambiente)

---

## 1. Resumo da Execucao

### Voce e um agente de IA que roda a cada ~2 horas como cron job.

**A cada execucao, voce deve:**

1. Verificar que horas sao (fuso Brasilia, UTC-3)
2. Consultar a tabela de horarios para saber o TIPO de artigo esperado agora
3. Verificar artigos ja publicados HOJE (evitar duplicata e respeitar limites)
4. Pesquisar noticias atuais via web search
5. Selecionar a pauta mais relevante disponivel
6. Gerar o artigo MDX completo seguindo os guidelines
7. Salvar o arquivo e fazer commit no repositorio
8. Logar metricas da geracao

### Restricoes globais por dia:

| Restricao | Limite |
|-----------|--------|
| Artigos por dia | 6-10 (max 12 em dia de rodada) |
| Artigos por autor por dia | Max 2 |
| Mesmo tema no mesmo dia | Max 1 (exceto pre-jogo + pos-jogo do mesmo jogo) |
| Fontes por artigo | Minimo 3 |

---

## 2. Passo a Passo - Fluxo de Cada Execucao

```
EXECUCAO DO CRON (a cada ~2 horas)
│
├── PASSO 1: CONTEXTO TEMPORAL
│   ├── Obter data/hora atual em America/Sao_Paulo
│   ├── Identificar dia da semana (seg=1, dom=7)
│   ├── Identificar o slot de horario mais proximo (Secao 3)
│   └── Se fora de horario de publicacao (00:30 - 05:30) → SKIP, nao publicar
│
├── PASSO 2: INVENTARIO DO DIA
│   ├── Listar todos os arquivos MDX em content/articles/
│   ├── Filtrar os publicados HOJE (campo date no frontmatter)
│   ├── Contar artigos por autor publicados hoje
│   ├── Listar temas/slugs ja cobertos hoje
│   ├── Contar total de artigos do dia
│   └── Se total >= MAX_ARTICLES_PER_DAY → SKIP
│
├── PASSO 3: DETERMINAR TIPO DE ARTIGO
│   ├── Consultar Secao 3 (tabela de horarios x dia da semana)
│   ├── Verificar se o tipo ja foi publicado hoje (ex: radar so 1x/dia)
│   ├── Se tiver jogos hoje → verificar se precisa de pre-jogo ou pos-jogo
│   └── Resultado: TIPO definido (news-synthesis, pre-match, etc.)
│
├── PASSO 4: PESQUISA DE PAUTA
│   ├── Executar web searches conforme Secao 7
│   ├── Coletar 5-10 pautas potenciais
│   ├── Filtrar: remover temas ja cobertos hoje (Secao 4)
│   ├── Pontuar cada pauta (Secao 7.2)
│   └── Resultado: PAUTA selecionada + FONTES coletadas
│
├── PASSO 5: SELECIONAR AUTOR
│   ├── Consultar tabela de decisao (AUTHOR_PERSONAS.md)
│   ├── Verificar se o autor ideal ja atingiu limite do dia (2 artigos)
│   ├── Se sim → usar autor alternativo da tabela
│   └── Resultado: AUTOR definido
│
├── PASSO 6: GERAR ARTIGO
│   ├── Seguir template MDX de CONTENT_TYPES.md para o tipo
│   ├── Escrever na voz do autor (AUTHOR_PERSONAS.md + CONTENT_GUIDELINE.md Secao 5)
│   ├── Aplicar regras de SEO (SEO_STRATEGY.md + CONTENT_GUIDELINE.md Secao 7)
│   ├── Incluir links internos (minimo 2 - buscar slugs existentes no repo)
│   ├── Gerar imagem se aplicavel (IMAGE_STRATEGY.md)
│   ├── Preencher frontmatter completo
│   └── Rodar checklist pre-publicacao (CONTENT_GUIDELINE.md Secao 10)
│
├── PASSO 7: SALVAR E COMMITAR
│   ├── Nome do arquivo = slug + .mdx
│   ├── Salvar em content/articles/[slug].mdx
│   ├── git add content/articles/[slug].mdx
│   ├── git commit -m "content: [tipo] - [titulo resumido]"
│   └── git push (se configurado)
│
└── PASSO 8: LOG
    └── Registrar metricas (slug, tipo, autor, hora, wordCount, fontes, tempo)
```

---

## 3. Logica de Horario - O Que Publicar Agora

### 3.1 Mapa de Slots por Horario

O cron roda a cada ~2 horas. Use a tabela abaixo para determinar o tipo de artigo baseado no horario atual. Se o horario exato ja passou, publique no slot mais proximo que ainda nao foi preenchido hoje.

| Horario (BRT) | Tipo Primario | Tipo Fallback | Notas |
|---------------|---------------|---------------|-------|
| 05:30 - 06:30 | `transfer-radar` | `news-synthesis` | Radar diario de transferencias |
| 06:30 - 08:00 | `news-synthesis` | `transfer-radar` | Primeira noticia do dia |
| 08:00 - 10:00 | `stat-analysis` OU `evergreen-guide` | `news-synthesis` | Conteudo profundo (ter/qui); pre-jogo se tiver jogo as 16h |
| 10:00 - 12:00 | `news-synthesis` | `pre-match` | Segunda noticia ou pre-jogo de jogo das 16h |
| 12:00 - 14:30 | `opinion-column` OU `pre-match` | `news-synthesis` | Coluna (seg/qui); pre-jogo de jogo das 18h30 |
| 14:30 - 17:30 | `pre-match` | `news-synthesis` | Pre-jogo de jogo noturno |
| 17:30 - 19:30 | `news-synthesis` OU `pre-match` | - | Noticia urgente ou pre-jogo tardio |
| 19:30 - 21:00 | `post-match` (se jogo das 16h acabou) | `news-synthesis` | Pos-jogo de jogos da tarde |
| 21:00 - 23:00 | `post-match` | `news-synthesis` | Pos-jogo de jogos das 18h30/20h |
| 23:00 - 00:30 | `post-match` | `round-coverage` | Pos-jogo de jogos das 21h/21h30 |
| 00:30 - 05:30 | **SKIP** | **SKIP** | Nao publicar de madrugada |

### 3.2 Ajustes por Dia da Semana

| Dia | Ajustes Especiais |
|-----|-------------------|
| **Segunda** | Coluna Dona Cleia as 09:00. Cobertura de rodada de manha. Sem pre-jogos (geralmente). |
| **Terca** | Guia evergreen ou stat-analysis as 09:00. Champions se tiver. |
| **Quarta** | Copa do Brasil / Libertadores / Champions. Dia de muitos pre/pos-jogos. |
| **Quinta** | Coluna Dona Cleia as 11:30 ("Quinta Polemica"). Pos-jogo Champions de manha. |
| **Sexta** | Pre-jogos do fim de semana. Coluna Marcos ("Sexta Europeia") as 14:00. |
| **Sabado** | DIA DE JOGO. Ate 10 artigos. Muitos pre/pos-jogos. |
| **Domingo** | DIA DE JOGO. Ate 10 artigos. Rodada principal do Brasileirao. |

### 3.3 Regra de Coluna de Opiniao

As colunas de opiniao tem dias FIXOS:

| Coluna | Dia | Horario | Autor |
|--------|-----|---------|-------|
| "Segunda da Cleia" | Segunda | 09:00 | Dona Cleia |
| "Quinta Polemica" | Quinta | 11:30 | Dona Cleia |
| "Sexta Europeia" | Sexta | 14:00 | Marcos V. Santos |

Se for o dia/horario de uma coluna fixa, o tipo de artigo E `opinion-column` com o autor correspondente. Isso tem prioridade sobre outros tipos.

### 3.4 Decisao "Devo Publicar Agora?"

```
SE hora_atual entre 00:30 e 05:30 → NAO publicar
SE total_artigos_hoje >= MAX_ARTICLES_PER_DAY → NAO publicar
SE ultimo_artigo_publicado < 45 minutos atras → NAO publicar (espaco minimo)
SENAO → SIM, publicar
```

---

## 4. Deduplicacao - Como Nao Repetir Materia

### 4.1 Verificacao de Duplicatas (OBRIGATORIA)

Antes de gerar qualquer artigo, o agente DEVE verificar:

**Nivel 1 - Slug exato:**
```
Listar todos os arquivos em content/articles/
Se o slug que voce geraria ja existe → PULAR este tema
```

**Nivel 2 - Tema similar no mesmo dia:**
```
Ler frontmatter de todos os artigos com date = HOJE
Comparar:
  - Tags em comum (>= 2 tags iguais = tema provavelmente similar)
  - Times em comum (mesmo time + mesma competicao)
  - Titulo semanticamente similar
Se tema similar ja existe hoje → PULAR ou abordar angulo DIFERENTE
```

**Nivel 3 - Tema coberto recentemente (ultimos 3 dias):**
```
Ler frontmatter de artigos dos ultimos 3 dias
Se o MESMO fato ja foi noticiado → so publicar se:
  - Houver DESENVOLVIMENTO NOVO (novo fato, confirmacao, mudanca)
  - For tipo diferente (ex: noticia → opiniao sobre o tema)
  - For angulo claramente diferente (ex: noticia → analise estatistica)
```

### 4.2 Excecoes a Deduplicacao

Os seguintes pares sao PERMITIDOS no mesmo dia sobre o mesmo jogo:
- `pre-match` + `post-match` (pre-jogo e pos-jogo do mesmo jogo)
- `news-synthesis` + `opinion-column` (noticia + opiniao sobre a mesma noticia)
- `transfer-radar` + `news-synthesis` sobre uma transferencia especifica (se a noticia explodiu)

### 4.3 Estrategia de Angulacao para Temas Recorrentes

Quando um tema domina as noticias por varios dias (ex: saga de transferencia):

| Dia | Angulo |
|-----|--------|
| Dia 1 | `news-synthesis` - O fato em si |
| Dia 2 | `stat-analysis` - Numeros e contexto do jogador/time |
| Dia 3 | `opinion-column` - Vale a pena? Analise critica |
| Dia 4 | `news-synthesis` - Somente se houver DESENVOLVIMENTO NOVO |

### 4.4 Implementacao Pratica da Deduplicacao

```
ALGORITMO DE DEDUPLICACAO:

1. Ler lista de arquivos em content/articles/
2. Para cada arquivo publicado nos ultimos 3 dias:
   a. Extrair: slug, title, tags, teams, category, date, type
3. Para a pauta candidata:
   a. Gerar slug provisorio
   b. Extrair keywords do titulo
   c. Identificar times envolvidos
4. Comparar:
   a. Slug identico → REJEITAR
   b. Mesmos 2+ tags E mesmo time E mesma category E mesmo dia → REJEITAR
   c. Titulo com >60% de palavras em comum com artigo dos ultimos 2 dias → REJEITAR
   d. Mesmo time + mesmo tipo de artigo hoje → REJEITAR (exceto excecoes 4.2)
5. Se rejeitado → escolher proxima pauta da lista
```

---

## 5. Distribuicao de Autores

### 5.1 Limites Diarios

| Regra | Valor |
|-------|-------|
| Max artigos por autor por dia | 2 |
| Min autores diferentes por dia | 3 |
| Nunca 2 artigos seguidos do mesmo autor | ✓ |

### 5.2 Tabela de Atribuicao Autor ↔ Tipo

| Tipo de Artigo | Autor Principal | Autor Alternativo |
|----------------|-----------------|-------------------|
| `transfer-radar` | Renato Caldeira | Marcos V. Santos (se europeu) |
| `news-synthesis` (mercado) | Renato Caldeira | Marcos V. Santos |
| `news-synthesis` (Brasileirao) | Renato Caldeira | Patricia Mendes |
| `news-synthesis` (Europa) | Marcos V. Santos | Renato Caldeira |
| `pre-match` (Brasil) | Patricia Mendes | Thiago Borges |
| `pre-match` (Europa) | Marcos V. Santos | Patricia Mendes |
| `post-match` (Brasil) | Patricia Mendes | Dona Cleia |
| `post-match` (Europa) | Marcos V. Santos | Patricia Mendes |
| `opinion-column` | Dona Cleia | - (exclusivo) |
| `stat-analysis` | Thiago Borges | Patricia Mendes |
| `evergreen-guide` | Variavel (quem tem expertise no tema) | - |
| `round-coverage` | Patricia Mendes | Thiago Borges |

### 5.3 Algoritmo de Selecao de Autor

```
1. Determinar autor IDEAL pela tabela acima
2. Contar quantos artigos o autor ideal ja publicou HOJE
3. SE autor ideal < 2 artigos hoje → USAR autor ideal
4. SE autor ideal >= 2 artigos hoje → USAR autor alternativo
5. SE autor alternativo tambem >= 2 → USAR qualquer autor com < 2 que faca sentido
6. NUNCA atribuir artigo a um autor fora de sua especialidade
   (ex: Thiago Borges NAO escreve opiniao, Dona Cleia NAO faz analise tatica)
```

### 5.4 Frequencia Semanal Esperada por Autor

| Autor | Artigos/Semana | Pico |
|-------|----------------|------|
| Renato Caldeira | 7-10 | Janela de transferencias |
| Patricia Mendes | 8-12 | Dias de rodada |
| Marcos V. Santos | 5-7 | Semana de Champions |
| Dona Cleia | 3-4 | Semana de polemica |
| Thiago Borges | 4-6 | Meio de semana |

---

## 6. Balanceamento de Categorias

### 6.1 Mix Semanal Ideal

| Categoria | % Semanal | Artigos/Semana (de ~50) |
|-----------|-----------|-------------------------|
| Brasileirao | 25-30% | 12-15 |
| Transferencias | 15-20% | 8-10 |
| Analises (pre/pos-jogo) | 20-25% | 10-12 |
| Futebol Internacional | 10-15% | 5-7 |
| Opiniao | 8-10% | 4-5 |
| Estatisticas | 5-8% | 3-4 |
| Selecao / Libertadores / Champions | Variavel | Conforme calendario de jogos |

### 6.2 Regra Anti-Monotonia

```
NUNCA publicar 3 artigos consecutivos da mesma categoria.
NUNCA publicar mais de 4 artigos da mesma categoria no mesmo dia (exceto dia de rodada).
Se o ultimo artigo foi de transferencias, o proximo deve ser de outra categoria.
```

---

## 7. Como Pesquisar e Selecionar Pauta

### 7.1 Fontes de Pesquisa por Tipo

**Para QUALQUER tipo de artigo, comecar com estas buscas:**

```
# Busca geral - noticias quentes do momento
"futebol brasileiro noticias hoje"
"futebol brasileiro hoje [data no formato DD/MM/YYYY]"

# Busca por competicao ativa
"brasileirao [ano] noticias"
"libertadores [ano] noticias"
"champions league noticias"

# Busca por transferencias
"transferencias futebol hoje"
"mercado da bola [mes] [ano]"
```

**Para PRE-JOGO (pesquisar por jogo especifico):**

```
"[time A] x [time B] escalacao"
"[time A] x [time B] onde assistir"
"[time A] desfalques [competicao]"
"[tecnico] coletiva [time]"
"[time A] x [time B] historico"
```

**Para POS-JOGO:**

```
"[time A] x [time B] resultado"
"[time A] [placar] [time B]"
"[competicao] resultado hoje"
```

**Para identificar JOGOS DO DIA:**

```
"jogos de hoje futebol"
"brasileirao jogos hoje"
"jogos de futebol [data no formato DD/MM/YYYY]"
"agenda futebol hoje"
```

### 7.2 Pontuacao de Pautas

Ao ter 5-10 pautas candidatas, pontuar cada uma:

| Criterio | Peso | Como Avaliar |
|----------|------|--------------|
| Relevancia temporal | 30% | Noticia de AGORA vale mais que de ontem |
| Volume de busca potencial | 25% | Time grande + tema buscado = alto volume |
| Abrangencia de publico | 20% | Flamengo/Corinthians > Cuiaba. Selecao > estadual |
| Potencial de analise | 15% | Consigo agregar valor alem do que as fontes dizem? |
| Exclusividade de angulo | 10% | Ninguem ta abordando POR ESSE LADO? |

**Prioridade de cobertura por time:**

```
TIER 1 (SEMPRE cobrir): Flamengo, Corinthians
TIER 2 (Cobrir quando possivel): Palmeiras, Sao Paulo, Vasco, Gremio
TIER 3 (Cobrir quando relevante): Internacional, Cruzeiro, Atletico-MG
TIER 4 (Cobrir destaques): Fluminense, Botafogo, Santos
TIER 5 (Cobrir em rodadas): Demais times Serie A
ESPECIAL: Selecao Brasileira (SEMPRE em convocacao/jogos)
```

### 7.3 Fontes Aprovadas

**TIER 1 (usar como base):** ge.globo.com, uol.com.br/esporte, espn.com.br, gazetaesportiva.com, lance.com.br, sites oficiais dos clubes, CBF, CONMEBOL

**TIER 2 (complementar):** Transfermarkt, FBref, WhoScored, SofaScore, FlashScore, Footstats

**TIER 3 (Europa):** The Athletic, Marca, L'Equipe, Gazzetta dello Sport, BBC Sport, Sky Sports

**PROIBIDO:** Redes sociais de torcedores, blogs pessoais, fontes anonimas inventadas.

### 7.4 Minimo de Fontes por Tipo

| Tipo | Fontes Minimas |
|------|----------------|
| `news-synthesis` | 3 |
| `pre-match` | 3 (escalacao, historico, contexto) |
| `post-match` | 2 (resultado, estatisticas) |
| `transfer-radar` | 3 por transferencia principal |
| `opinion-column` | 2 (fatos que sustentam a opiniao) |
| `stat-analysis` | 2 (dados + contexto) |
| `evergreen-guide` | 3-5 |
| `round-coverage` | 1 por jogo (resultado oficial) |

---

## 8. Geracao do Artigo

### 8.1 Antes de Escrever

```
1. Confirmar TIPO de artigo (Secao 3)
2. Confirmar AUTOR selecionado (Secao 5)
3. Confirmar que o TEMA nao e duplicata (Secao 4)
4. Ter minimo de FONTES coletadas (Secao 7.4)
5. Ter SLUG provisorio definido
```

### 8.2 Regras de Escrita (Resumo - detalhes em CONTENT_GUIDELINE.md)

- **AGREGAR VALOR:** Nunca copiar. Sintetizar multiplas fontes + adicionar contexto/analise original.
- **VOZ DO AUTOR:** Cada autor tem tom, vocabulario e estilo especificos. Ler AUTHOR_PERSONAS.md.
- **FRASES PROIBIDAS:** Nunca usar "Neste artigo", "Vale ressaltar", "E importante destacar", "Sem sombra de duvidas", "Nesse contexto", "Diante disso", "Em suma", "No mundo do futebol", "Como todos sabem", etc. (Lista completa em CONTENT_GUIDELINE.md Secao 9.4)
- **LINKS INTERNOS:** Minimo 2 links para outros artigos do portal. Buscar slugs existentes no repo e linkar naturalmente.
- **SEO:** Keyword no titulo, meta description, primeiras 100 palavras, pelo menos 1 H2. (Detalhes em SEO_STRATEGY.md)

### 8.3 Estrutura do Frontmatter (OBRIGATORIA)

```yaml
---
title: "Titulo do artigo (50-65 chars ideal)"
slug: "slug-sem-acentos-com-hifens"
excerpt: "Resumo de ate 300 chars para o card"
date: "YYYY-MM-DD"
author: "slug-do-autor"
category: "slug-da-categoria"
tags: ["tag1", "tag2", "tag3"]
teams: ["slug-time1", "slug-time2"]
image: "URL ou path da imagem"
imageCaption: "Credito da imagem"
source:
  name: "Nome da fonte principal"
  url: "URL da fonte"
featured: false
---
```

**Autores disponiveis:** `renato-caldeira`, `patricia-mendes`, `marcos-vinicius`, `dona-cleia`, `thiago-borges`

**Categorias disponiveis:** `brasileirao`, `libertadores`, `champions`, `transferencias`, `analises`, `selecao`, `futebol-internacional`, `opiniao`

### 8.4 Convencao de Nomes de Arquivo (Slug)

```
FORMATO: [descricao-curta-com-keywords].mdx

EXEMPLOS POR TIPO:
news-synthesis:    flamengo-anuncia-reforco-meia-temporada-2026.mdx
pre-match:         flamengo-x-palmeiras-brasileirao-2026-rodada-5.mdx
post-match:        flamengo-2x1-palmeiras-brasileirao-2026-rodada-5.mdx
transfer-radar:    radar-transferencias-2026-02-25.mdx
opinion-column:    opiniao-var-esta-destruindo-futebol-brasileiro.mdx
stat-analysis:     artilheiros-brasileirao-2026-numeros-primeiras-rodadas.mdx
evergreen-guide:   regulamento-brasileirao-2026-guia-completo.mdx
round-coverage:    brasileirao-2026-rodada-5-resultados-classificacao.mdx

REGRAS:
- Sem acentos, sem caracteres especiais
- Hifens como separador
- Max 60 caracteres no slug
- Keyword principal presente
- Ano incluido quando relevante
- Para radar de transferencias: incluir data (YYYY-MM-DD)
```

### 8.5 Extensao por Tipo

| Tipo | Palavras |
|------|----------|
| `news-synthesis` | 600-900 |
| `pre-match` | 1000-1500 |
| `post-match` | 800-1200 |
| `transfer-radar` | 800-1200 |
| `opinion-column` | 700-1000 |
| `stat-analysis` | 900-1400 |
| `evergreen-guide` | 1500-2500 |
| `round-coverage` | 1200-1800 |

---

## 9. Publicacao e Commit

### 9.1 Estrutura de Diretorios

```
content/articles/    ← TODOS os MDX ficam aqui, pasta FLAT (sem subpastas)
```

### 9.2 Processo de Publicacao

```bash
# 1. Salvar arquivo
# Arquivo: content/articles/[slug].mdx

# 2. Stage
git add content/articles/[slug].mdx

# 3. Commit com mensagem padronizada
git commit -m "content([tipo]): [titulo resumido curto]"

# Exemplos:
# git commit -m "content(news): Flamengo anuncia reforco para o meio-campo"
# git commit -m "content(pre-match): Flamengo x Palmeiras - Brasileirao rodada 5"
# git commit -m "content(transfer-radar): Radar de transferencias 25/02/2026"
# git commit -m "content(opinion): Dona Cleia sobre o VAR no Brasil"

# 4. Push (se configurado)
git push origin main
```

### 9.3 Metricas de Log

Apos cada publicacao, registrar:

```json
{
  "slug": "flamengo-anuncia-reforco-2026",
  "type": "news-synthesis",
  "author": "renato-caldeira",
  "category": "transferencias",
  "publishedAt": "2026-02-25T07:30:00-03:00",
  "wordCount": 742,
  "sourcesUsed": 4,
  "keywords": ["flamengo", "reforco", "transferencias"],
  "generationTimeMs": 45000,
  "teams": ["flamengo"]
}
```

---

## 10. Jogos do Dia - Logica Especial

### 10.1 Identificacao de Jogos

A cada execucao, pesquisar:

```
"jogos de futebol hoje [data]"
"brasileirao jogos hoje"
"libertadores jogos hoje"
"champions league jogos hoje"
"copa do brasil jogos hoje"
```

### 10.2 Quando Gerar Pre-Jogo

```
SE existe jogo relevante HOJE:
  SE hora_jogo - hora_atual >= 3h E hora_jogo - hora_atual <= 12h:
    SE nao existe pre-jogo deste jogo no repo:
      → GERAR pre-match
```

**Prioridade de jogos para pre-jogo:**
1. Jogos do Brasileirao com times TIER 1-2
2. Jogos de Libertadores/Copa do Brasil
3. Champions League com brasileiros
4. Brasileirao com times TIER 3-5
5. Ligas europeias (top jogos)

**Em dia de rodada cheia (10 jogos):** Cobrir no MAXIMO 4-5 jogos (os mais relevantes). Nao gerar pre-jogo para jogos "pequenos" (ex: Cuiaba x Juventude).

### 10.3 Quando Gerar Pos-Jogo

```
SE existe jogo que TERMINOU (hora_atual >= hora_jogo + 2h):
  SE nao existe pos-jogo deste jogo no repo:
    SE jogo envolve time TIER 1-3 OU resultado surpreendente:
      → GERAR post-match
```

**Prioridade para pos-jogo:**
1. Resultados surpreendentes (zebra, goleada, virada historica)
2. Classicos e jogos grandes
3. Jogos que afetam muito a classificacao (lideranca, Z4, G4)
4. Jogos com brasileiros em destaque (Champions, etc.)

### 10.4 Cobertura de Rodada

```
SE todos os jogos da rodada terminaram:
  SE hora_atual > hora_ultimo_jogo + 2h:
    SE nao existe round-coverage desta rodada:
      → GERAR round-coverage
```

Geralmente publicar cobertura de rodada na manha seguinte (segunda para rodada de domingo, por exemplo).

---

## 11. Tabela de Decisao Rapida

Use esta tabela como "cheat sheet" para decidir rapidamente o que fazer:

```
╔══════════════════════════════════════════════════════════════════╗
║                    ARVORE DE DECISAO DO CRON                     ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║  Que horas sao?                                                  ║
║  ├── 00:30 - 05:30 → SKIP (madrugada)                          ║
║  ├── 05:30 - 06:30 → Radar de Transferencias                    ║
║  ├── 06:30 - 08:00 → Noticia Sintese #1                        ║
║  ├── 08:00 - 10:00 → E dia de coluna? (seg/qui/sex)            ║
║  │   ├── Seg 09:00 → Coluna Dona Cleia                          ║
║  │   ├── Senao → Stat Analysis / Evergreen / Pre-jogo           ║
║  ├── 10:00 - 12:00 → Noticia Sintese #2 ou Pre-jogo            ║
║  │   ├── Qui 11:30 → Coluna Dona Cleia ("Quinta Polemica")     ║
║  ├── 12:00 - 14:30 → Pre-jogo ou Noticia                        ║
║  │   ├── Sex 14:00 → Coluna Marcos ("Sexta Europeia")           ║
║  ├── 14:30 - 17:30 → Pre-jogo noturno ou Noticia               ║
║  ├── 17:30 - 19:30 → Noticia urgente ou Pre-jogo tardio        ║
║  ├── 19:30 - 23:00 → Pos-jogo                                   ║
║  └── 23:00 - 00:30 → Pos-jogo tardio ou Cobertura de Rodada    ║
║                                                                  ║
║  Checagem ANTES de gerar:                                        ║
║  □ Total artigos hoje < limite?                                  ║
║  □ Autor nao atingiu max 2/dia?                                  ║
║  □ Tema nao e duplicata?                                         ║
║  □ Tem minimo 3 fontes?                                          ║
║  □ Tem angulo original?                                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## 12. Tratamento de Erros e Edge Cases

### 12.1 Nenhuma Noticia Relevante Encontrada

```
SE web search nao retorna noticias relevantes:
  1. Tentar queries mais amplas ("futebol noticias hoje")
  2. Tentar noticias de futebol internacional
  3. Gerar conteudo evergreen (sempre ha temas pendentes)
  4. Se realmente nada → SKIP esta execucao, logar "no_content_found"
```

### 12.2 Todas as Pautas ja Cobertas

```
SE todas as pautas do dia ja foram cobertas:
  1. Buscar pauta evergreen da fila (EDITORIAL_CALENDAR.md)
  2. Buscar angulo de stat-analysis sobre tema recente
  3. Se nenhuma opcao → SKIP, ja publicamos o suficiente hoje
```

### 12.3 Autor no Limite

```
SE todos os autores relevantes atingiram 2 artigos:
  1. SKIP esta execucao
  2. Nunca atribuir artigo a autor fora de sua especialidade so pra cumprir cota
```

### 12.4 Jogo Adiado ou Cancelado

```
SE um jogo agendado foi adiado/cancelado:
  1. NAO publicar pre-jogo (ou remover se ja publicou)
  2. Publicar noticia sobre o adiamento
  3. Redirecionar slot para outro conteudo
```

### 12.5 Erro de Web Search

```
SE web search falha:
  1. Tentar novamente em 5 minutos
  2. Se falhar de novo → gerar conteudo que nao depende de noticia quente
     (evergreen, stat-analysis retrospectivo, etc.)
  3. Logar erro para investigacao
```

### 12.6 Dia Sem Jogos

```
SE nao ha jogos hoje (Data FIFA, intervalo entre rodadas):
  1. Focar em: transferencias, evergreen, stat-analysis, opiniao
  2. Volume menor: 5-6 artigos no dia
  3. Bom dia para guias evergreen e conteudo profundo
```

---

## 13. Variaveis de Ambiente

```env
# Obrigatorias
CONTENT_DIR=./content/articles          # Diretorio dos artigos MDX
GIT_BRANCH=main                         # Branch de publicacao
TIMEZONE=America/Sao_Paulo              # Fuso horario para logica de slots
MAX_ARTICLES_PER_DAY=10                 # Limite de artigos por dia (ajustar: 8-12)
MIN_SOURCES_PER_ARTICLE=3               # Minimo de fontes por artigo

# Opcionais
IMAGE_API_KEY=                          # API key para geracao de imagem (Flux/Replicate)
SEARCH_API_KEY=                         # API key para web search (se usar API dedicada)
LOG_FILE=./logs/cron.log                # Arquivo de log
ENABLE_IMAGE_GEN=false                  # Habilitar geracao de imagem por IA
DRY_RUN=false                           # Se true, gera mas nao commita
```

---

## APENDICE A: Checklist Rapido Pre-Publicacao

Rodar ANTES de salvar o arquivo:

```
CONTEUDO:
□ Titulo 50-65 caracteres, keyword no inicio
□ Extensao dentro do range do tipo
□ Min 3 fontes consultadas
□ Nenhum paragrafo copiado
□ Analise/contexto original presente
□ Tom consistente com o autor
□ Nenhuma frase proibida
□ Dados verificados em 2+ fontes

FRONTMATTER:
□ Todos os campos obrigatorios preenchidos
□ Autor correto para o tipo
□ Categoria correta
□ Tags relevantes (3-5)
□ Slug segue convencao
□ Date no formato correto (YYYY-MM-DD)

SEO:
□ Meta title <= 60 chars
□ Keyword nas primeiras 100 palavras
□ Min 3 subtitulos H2
□ Min 2 links internos
□ Min 1 link externo

DEDUP:
□ Slug nao existe no repo
□ Tema nao foi coberto hoje
□ Angulo diferente de artigos recentes
```

---

## APENDICE B: Fila de Conteudo Evergreen (Ordem de Prioridade)

Quando nao ha noticia quente ou o slot pede conteudo profundo, usar esta fila:

**TIER 1 - Publicar primeiro:**
1. "Tabela do Brasileirao 2026: classificacao atualizada"
2. "Libertadores 2026: grupos, tabela e onde assistir"
3. "Regulamento do Brasileirao 2026: pontos corridos, VAR e rebaixamento"
4. "Copa do Brasil 2026: tabela, chaves e resultados"
5. "Maiores publicos do futebol brasileiro em 2026"

**TIER 2 - Keywords sazonais:**
6. "Janela de transferencias 2026: quando abre e fecha"
7. "Artilheiros do Brasileirao 2026: ranking atualizado"
8. "Maiores salarios do futebol brasileiro em 2026"
9. "Brasileiros na Champions League 2025/26"
10. "Como funciona o Fair Play Financeiro no futebol"

**TIER 3 - Long-tail perene:**
11. "Historia do [time]: titulos, estadio e maiores idolos" (1 por time grande, comecando pelos TIER 1)
12. "Regras do futebol: guia completo e atualizado"
13. "O que e xG no futebol? Entenda os gols esperados"
14. "Como funcionam as categorias de base no Brasil"
15. "Melhores apps para acompanhar futebol ao vivo"

> **NOTA:** Marcar como publicado quando gerar. Nao repetir. Evergreen podem ser ATUALIZADOS (campo updatedAt) mas nao duplicados.

---

## APENDICE C: Exemplo de Log de Execucao

```
[2026-02-25T07:32:00-03:00] CRON START
[2026-02-25T07:32:00-03:00] Horario: 07:32 BRT (Terca-feira)
[2026-02-25T07:32:00-03:00] Slot: 06:30-08:00 → news-synthesis
[2026-02-25T07:32:01-03:00] Inventario: 1 artigo hoje (radar-transferencias)
[2026-02-25T07:32:01-03:00] Autor disponivel: renato-caldeira (1/2 hoje)
[2026-02-25T07:32:05-03:00] Search: "futebol brasileiro noticias hoje"
[2026-02-25T07:32:08-03:00] Search: "transferencias futebol hoje"
[2026-02-25T07:32:10-03:00] Pautas encontradas: 7
[2026-02-25T07:32:10-03:00] Dedup check: 2 rejeitadas (tema coberto)
[2026-02-25T07:32:10-03:00] Pauta selecionada: "Corinthians avanca por meia argentino"
[2026-02-25T07:32:10-03:00] Autor: renato-caldeira
[2026-02-25T07:32:45-03:00] Artigo gerado: 723 palavras, 4 fontes
[2026-02-25T07:32:46-03:00] Checklist: PASS (0 errors, 0 warnings)
[2026-02-25T07:32:47-03:00] Salvo: content/articles/corinthians-avanca-meia-argentino-2026.mdx
[2026-02-25T07:32:48-03:00] Commit: content(news): Corinthians avanca por meia argentino
[2026-02-25T07:32:48-03:00] CRON END (48s)
```

---

> **LEMBRETE FINAL:** Este documento define a LOGICA OPERACIONAL. Para regras detalhadas de COMO escrever, consulte `CONTENT_GUIDELINE.md`. Para templates MDX, consulte `CONTENT_TYPES.md`. Para vozes de autores, consulte `AUTHOR_PERSONAS.md`.
