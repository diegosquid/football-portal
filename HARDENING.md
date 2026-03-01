# Content Hardening System - Football Portal

> Sistema de verificação obrigatória para evitar erros factuais graves

## Checks Obrigatórios (Pré-Publicação)

### 1. Verificação de Resultado (MANDATÓRIO para pós-jogo)

```
ANTES de gerar artigo pós-jogo:
□ Buscar resultado oficial em pelo menos 2 fontes confiáveis
□ Confirmar: time vencedor, placar, gols (quem fez e quando)
□ Verificar se não houve mudança de resultado (anulação, etc)
```

**Fontes aceitas:**
- ge.globo.com
- ESPN Brasil
- Estadão / Folha / UOL
- Sofascore / Flashscore
- Site oficial da competição (FPF, CBF, etc)

**Regra de ouro:** Se houver divergência entre fontes → PAUSAR e verificar manualmente

---

### 2. Verificação de Escalação (MANDATÓRIO para pré-jogo)

```
ANTES de publicar pré-jogo:
□ Confirmar data/hora do jogo em site oficial
□ Verificar escalação provável em 2+ fontes
□ Checar desfalques confirmados (lesão, suspensão)
□ Validar estádio e cidade
```

---

### 3. Verificação de Transferências

```
ANTES de noticiar transferência:
□ Confirmar em pelo menos 2 veículos independentes
□ Verificar se não é rumor antigo reciclado
□ Checar data da notícia original
```

---

### 4. Verificação de Dados Estatísticos

```
ANTES de publicar análise com dados:
□ Confirmar fonte dos números (FBref, Sofascore, etc)
□ Verificar se dados são da temporada/competição correta
□ Validar período de referência (últimos 5 jogos? temporada inteira?)
```

---

## Processo de Verificação (Workflow)

```
1. Pesquisa inicial → coletar 5-10 fontes
2. Triagem → selecionar 3 fontes mais confiáveis
3. Verificação cruzada → comparar fato principal em todas
4. Se DIVERGÊNCIA → investigar mais ou abortar
5. Se CONSENSO → prosseguir com geração
6. Revisão final → checklist de hardening
7. Publicação
```

---

## Checklist Final (Obrigatório)

Copiar e preencher antes de cada publicação:

```markdown
## Verificação - [Slug do Artigo]

### Fato Principal
- [ ] Verificado em fonte 1: [URL]
- [ ] Verificado em fonte 2: [URL]
- [ ] Sem divergências entre fontes

### Dados Específicos
- [ ] Resultado/placar confirmado
- [ ] Autor(es) do(s) gol(s) confirmado(s)
- [ ] Data/hora do jogo confirmada
- [ ] Competição e fase corretas

### Alertas
- [ ] Nenhum alerta de fato contestado
- [ ] Nenhuma atualização recente que mude a história

### Assinatura
Verificado por: [agente]
Data/hora: [timestamp]
```

---

## Erros Críticos (Zero Tolerância)

| Erro | Consequência | Prevenção |
|------|-------------|-----------|
| Inverter resultado do jogo | Perda total de credibilidade | Verificar em 2+ fontes |
| Time errado na final/competição | Notícia falsa | Confirmar classificação |
| Jogador que não jogou como destaque | Desinformação | Checar escalação oficial |
| Data/hora do jogo errada | Público perdido | Confirmar em site oficial |
| Estatísticas de temporada errada | Análise sem valor | Validar fonte e período |

---

## Quando Abortar

**NÃO PUBLICAR se:**
- Fontes divergem sobre fato principal
- Não há pelo menos 2 fontes independentes confirmando
- Informação parece "muito recente" (menos de 30 minutos)
- Há indícios de que fato pode mudar (ex: recurso, anulação)

---

## Logs de Verificação

Manter registro de todas as verificações em:
```
logs/verification/[slug]-[timestamp].md
```

Exemplo:
```markdown
---
slug: novorizontino-1x0-corinthians-paulistao-2026-semifinal
date: 2026-03-01T10:00:00-03:00
result: CONFIRMED
sources:
  - https://ge.globo.com/sp/futebol/jogo/28-02-2026/novorizontino-corinthians
  - https://www.estadao.com.br/esportes/futebol/corinthians-joga-mal-perde-para-o-novorizontino
checks:
  result: Novorizontino 1x0 Corinthians
  goal_scorer: Mayk (confirmado em ambas fontes)
  match_date: 2026-02-28 20:30 (confirmado)
verified_by: agent-main
divergences: none
---
```
