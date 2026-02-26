# Calendario Editorial - Portal de Futebol

> Programacao diaria e semanal de publicacoes. O agente cron deve seguir este calendario como base, ajustando conforme a agenda real de jogos da semana.

---

## Volume Diario: 6-10 artigos/dia

**Meta minima:** 6 artigos
**Meta ideal:** 8-10 artigos
**Maximo:** 12 artigos (dias de rodada cheia ou grandes acontecimentos)

---

## Horarios de Publicacao (Fuso: Brasilia, UTC-3)

O Google indexa mais rapido conteudo publicado em horarios consistentes. Os horarios abaixo sao otimizados para picos de busca no Brasil.

### Slots Fixos Diarios

| Horario | Tipo de Conteudo | Justificativa |
|---------|-----------------|---------------|
| **06:00** | Radar de Transferencias | Pessoas checam noticias ao acordar. "Transferencias hoje" tem pico entre 6h-8h |
| **07:30** | Noticia Sintese #1 | Hora do trajeto pro trabalho, consumo movel alto |
| **09:00** | Analise Estatistica OU Guia Evergreen | Horario de escritorio, leitura mais longa |
| **11:30** | Noticia Sintese #2 | Pausa pro almoço, segundo pico de acesso |
| **14:00** | Coluna de Opiniao OU Pre-Jogo | Meio da tarde, engajamento social alto |
| **17:00** | Pre-Jogo (se tiver jogo a noite) | Pessoas buscam escalacao 3-4h antes do jogo |
| **19:00** | Noticia Sintese #3 (se necessario) | Horario nobre pre-jogo |
| **22:30-23:30** | Pos-Jogo | Imediatamente apos jogos noturnos |

### Slots Variaveis (Conforme Agenda)

| Situacao | Horario | Tipo |
|----------|---------|------|
| Jogo as 16h | 12:00 | Pre-Jogo |
| Jogo as 16h | 18:30 | Pos-Jogo |
| Jogo as 18h30 | 14:00 | Pre-Jogo |
| Jogo as 18h30 | 21:00 | Pos-Jogo |
| Jogo as 20h | 16:00 | Pre-Jogo |
| Jogo as 21h | 17:00 | Pre-Jogo |
| Jogo as 21h30 | 00:00 | Pos-Jogo |
| Noticia urgente | ASAP | Noticia Sintese |

---

## Programacao Semanal Padrao

### SEGUNDA-FEIRA
> Dia de rescaldo do fim de semana + mercado

| # | Horario | Tipo | Autor | Tema |
|---|---------|------|-------|------|
| 1 | 06:00 | Radar Transferencias | Renato | Movimentacoes do fim de semana |
| 2 | 07:30 | Cobertura Rodada | Patricia/Thiago | Resumo da rodada completa |
| 3 | 09:00 | Coluna Opiniao | Neide Ferreira | **"Segunda da Neide"** - opiniao sobre o fim de semana |
| 4 | 11:30 | Noticia Sintese | Renato | Principal noticia do dia |
| 5 | 14:00 | Stat Analysis | Thiago | Numeros da rodada |
| 6 | 17:00 | Noticia Sintese | Marcos | Futebol europeu (jogos de segunda) |

**Total segunda:** 6 artigos

---

### TERCA-FEIRA
> Meio de semana, foco em conteudo profundo + Champions League (se tiver)

| # | Horario | Tipo | Autor | Tema |
|---|---------|------|-------|------|
| 1 | 06:00 | Radar Transferencias | Renato | Mercado da bola |
| 2 | 07:30 | Noticia Sintese | Renato | Principal do dia |
| 3 | 09:00 | Guia Evergreen | Variavel | Conteudo SEO long-tail |
| 4 | 11:30 | Stat Analysis | Thiago | Comparativo ou ranking |
| 5 | 14:00 | Pre-Jogo Champions | Marcos | Se tiver Champions |
| 6 | 17:00 | Noticia Sintese | Variavel | Quente do dia |
| 7 | 23:00 | Pos-Jogo Champions | Marcos | Se tiver Champions |

**Total terca:** 6-7 artigos

---

### QUARTA-FEIRA
> Copa do Brasil / Libertadores / Champions League

| # | Horario | Tipo | Autor | Tema |
|---|---------|------|-------|------|
| 1 | 06:00 | Radar Transferencias | Renato | Mercado da bola |
| 2 | 07:30 | Pos-Jogo Champions | Marcos | Resultado do dia anterior |
| 3 | 09:00 | Noticia Sintese | Variavel | Principal do dia |
| 4 | 11:30 | Pre-Jogo Copa/Liberta | Patricia | Se tiver jogo |
| 5 | 14:00 | Pre-Jogo Champions | Marcos | Se tiver Champions |
| 6 | 17:00 | Noticia Sintese | Variavel | Quente do dia |
| 7 | 22:30 | Pos-Jogo | Patricia/Marcos | Resultado da noite |

**Total quarta:** 6-7 artigos

---

### QUINTA-FEIRA
> Rescaldo europeu + coluna + preparacao fim de semana

| # | Horario | Tipo | Autor | Tema |
|---|---------|------|-------|------|
| 1 | 06:00 | Radar Transferencias | Renato | Mercado da bola |
| 2 | 07:30 | Pos-Jogo Europa | Marcos | Champions/Europa League |
| 3 | 09:00 | Stat Analysis | Thiago | Dados da semana |
| 4 | 11:30 | Coluna Opiniao | Neide Ferreira | **"Quinta Polemica"** - tema quente |
| 5 | 14:00 | Noticia Sintese | Variavel | Principal do dia |
| 6 | 17:00 | Guia Evergreen | Variavel | Conteudo SEO long-tail |

**Total quinta:** 6 artigos

---

### SEXTA-FEIRA
> Esquenta pro fim de semana, pre-jogos de sabado

| # | Horario | Tipo | Autor | Tema |
|---|---------|------|-------|------|
| 1 | 06:00 | Radar Transferencias | Renato | Mercado da bola |
| 2 | 07:30 | Noticia Sintese | Variavel | Principal do dia |
| 3 | 09:00 | Pre-Jogo #1 | Patricia | Jogo destaque do sabado |
| 4 | 11:30 | Pre-Jogo #2 | Patricia/Thiago | Segundo jogo grande |
| 5 | 14:00 | Coluna Opiniao | Marcos | **"Sexta Europeia"** - panorama ligas europeias |
| 6 | 17:00 | Pre-Jogo Europa | Marcos | Premier League/La Liga de sabado |
| 7 | 19:00 | Noticia Sintese | Variavel | Urgente se houver |

**Total sexta:** 6-7 artigos

---

### SABADO
> Dia de jogo! Alta frequencia

| # | Horario | Tipo | Autor | Tema |
|---|---------|------|-------|------|
| 1 | 06:00 | Radar Transferencias | Renato | Mercado da bola (mais curto) |
| 2 | 08:00 | Pre-Jogo #1 | Patricia | Jogo das 16h |
| 3 | 10:00 | Pre-Jogo Europa | Marcos | Premier League / La Liga |
| 4 | 12:00 | Pre-Jogo #2 | Patricia | Jogo das 18h30 |
| 5 | 15:00 | Pre-Jogo #3 | Patricia/Thiago | Jogo das 21h |
| 6 | 18:30 | Pos-Jogo #1 | Patricia | Jogo das 16h |
| 7 | 20:00 | Pos-Jogo Europa | Marcos | Resultados europeus |
| 8 | 21:00 | Pos-Jogo #2 | Patricia | Jogo das 18h30 |
| 9 | 23:30 | Pos-Jogo #3 | Patricia/Neide Ferreira | Jogo das 21h |

**Total sabado:** 8-10 artigos

---

### DOMINGO
> Rodada principal do Brasileirao

| # | Horario | Tipo | Autor | Tema |
|---|---------|------|-------|------|
| 1 | 07:00 | Noticia Sintese | Renato | Resumo resultados de sabado |
| 2 | 09:00 | Pre-Jogo #1 | Patricia | Jogo das 16h |
| 3 | 11:00 | Pre-Jogo #2 | Thiago | Jogo com analise de dados |
| 4 | 13:00 | Pre-Jogo #3 | Patricia | Jogo das 18h30 |
| 5 | 16:00 | Pre-Jogo #4 | Patricia | Jogo das 20h |
| 6 | 18:30 | Pos-Jogo #1 | Patricia | Jogo das 16h |
| 7 | 20:30 | Pos-Jogo #2 | Patricia | Jogo das 18h30 |
| 8 | 22:30 | Pos-Jogo #3 | Neide Ferreira | Jogo das 20h (com opiniao) |
| 9 | 23:30 | Cobertura Parcial | Thiago | Se a rodada terminar |

**Total domingo:** 8-10 artigos

---

## Calendario de Conteudo Evergreen

Publicar 1-2 guias evergreen por semana, priorizando keywords com volume de busca alto e baixa competicao.

### Fila de Producao Evergreen (ordenada por prioridade)

**Tier 1 - Alto volume, publicar primeiro:**
1. "Tabela do Brasileirao 2026: classificacao atualizada" (atualizar semanalmente)
2. "Libertadores 2026: grupos, tabela e onde assistir"
3. "Regulamento do Brasileirao 2026: pontos corridos, VAR e rebaixamento"
4. "Copa do Brasil 2026: tabela, chaves e resultados"
5. "Maiores publicos do futebol brasileiro em 2026"

**Tier 2 - Keywords sazonais:**
6. "Janela de transferencias 2026: quando abre e fecha"
7. "Artilheiros do Brasileirao 2026: ranking atualizado"
8. "Maiores salarios do futebol brasileiro em 2026"
9. "Brasileiros na Champions League 2025/26"
10. "Como funciona o Fair Play Financeiro no futebol"

**Tier 3 - Long-tail perene:**
11. "Historia do [time]: titulos, estadio e maiores idolos" (1 por time grande)
12. "Regras do futebol: guia completo e atualizado"
13. "O que e xG no futebol? Entenda os gols esperados"
14. "Como funcionam as categorias de base no Brasil"
15. "Melhores apps para acompanhar futebol ao vivo"

---

## Ajustes por Periodo do Ano

| Periodo | Ajuste |
|---------|--------|
| Jan-Fev | +Transferencias, +Pre-temporada, estaduais |
| Mar-Abr | Inicio Brasileirao, grupos Libertadores |
| Mai-Jun | Meio Brasileirao, Data FIFA, oitavas Liberta |
| Jul | Janela transferencias meio de ano (PICO de busca) |
| Ago-Set | Reta final Libertadores, Brasileirao esquenta |
| Out-Nov | Decisoes de titulo, acesso e rebaixamento |
| Dez | Retrospectiva, premiacoes, pre-mercado |

---

## Metricas de Acompanhamento

O agente deve logar as seguintes metricas por artigo para otimizacao futura:

```json
{
  "slug": "string",
  "type": "string",
  "author": "string",
  "publishedAt": "ISO datetime",
  "wordCount": "number",
  "sourcesUsed": "number",
  "keywords": ["array"],
  "generationTimeMs": "number"
}
```
