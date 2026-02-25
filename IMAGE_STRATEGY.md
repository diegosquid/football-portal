# Estrategia de Imagens - Portal de Futebol

> Como obter, gerar e otimizar imagens para cada artigo de forma legal, escalavel e SEO-friendly.

---

## 1. Principio Fundamental: NUNCA Usar Fotos de Agencias Sem Licenca

**PROIBIDO:**
- Copiar fotos do Getty Images, Reuters, AFP, ou qualquer agencia de fotos
- Fazer print de transmissoes de TV (Globo, ESPN, etc.)
- Usar fotos de outros portais (ge.globo, UOL Esporte, etc.)
- Usar escudos oficiais sem permissao (marca registrada)

**O que acontece se violar:** Processos judiciais, DMCA takedowns, desindexacao do Google News.

---

## 2. Fontes Legais de Imagens

### 2.1 Imagens dos Clubes (Preferencial)

A maioria dos clubes brasileiros disponibiliza fotos oficiais para imprensa:

**Como acessar:**
- Sites oficiais dos clubes geralmente tem secao de midia/imprensa
- Flickr oficial de alguns clubes (licenca CC)
- Redes sociais oficiais dos clubes (com atribuicao devida)

**Atribuicao obrigatoria:**
```
Foto: [Nome do fotografo] / [Clube] (quando disponivel)
Foto: Divulgacao / [Clube]
Foto: Reproducao / [Clube] (redes sociais)
```

**Clubes com materiais de imprensa acessiveis:**
- Flamengo, Palmeiras, Corinthians, Sao Paulo: sites oficiais com galerias
- CBF: cbf.com.br tem banco de imagens da Selecao

**IMPORTANTE:** Mesmo fotos de divulgacao de clubes devem ser usadas APENAS para fins editoriais/jornalisticos. Sempre dar credito.

### 2.2 Wikimedia Commons

**O que e:** Banco de imagens gratuitas com licencas Creative Commons.

**Bom para:**
- Fotos de estadios
- Fotos historicas de jogadores
- Logos de competicoes (verificar licenca individual)
- Fotos de torcidas

**Como usar:**
- Buscar em commons.wikimedia.org
- Verificar se a licenca e CC-BY ou CC-BY-SA
- Atribuir conforme exigido pela licenca

**Atribuicao:**
```
Foto: [Autor] / Wikimedia Commons (CC BY-SA 4.0)
```

### 2.3 Unsplash e Pexels (Imagens Genericas)

**Bom para:**
- Imagens genericas de futebol (bola, campo, estadio vazio)
- Backgrounds para infograficos
- Imagens de capa para colunas de opiniao e guias evergreen

**Limitacao:** Nunca vao ter a foto especifica do jogo ou jogador.

**Atribuicao:** Nao obrigatoria mas recomendada:
```
Foto: [Fotografo] / Unsplash
```

---

## 3. Geracao de Imagens por IA (Estrategia Principal)

### 3.1 Por que IA e a Melhor Opcao para Este Projeto

- **Escalabilidade:** 6-10 artigos/dia = 6-10 imagens/dia
- **Custo:** Muito menor que licencas de agencias
- **Legalidade:** Imagem gerada nao tem copyright de terceiros (se bem gerada)
- **Unicidade:** Cada imagem e exclusiva do portal
- **Consistencia:** Podemos manter um estilo visual unico

### 3.2 Tipos de Imagens IA por Tipo de Conteudo

#### Pre-Jogo e Pos-Jogo
**Estilo:** Ilustracao editorial dramatica, estilo "match poster"

**Prompt base:**
```
Editorial illustration for a football match between [Team A colors] and
[Team B colors] teams. Dynamic composition showing football action,
[stadium name] atmosphere. Editorial style, dramatic lighting, vibrant
colors. No faces, no logos, no specific player likenesses. 16:9 ratio.
--style editorial illustration --no text --no logos --no faces
```

**Variantes por tipo de jogo:**
- Classico: iluminacao mais dramatica, cores fortes
- Decisao: elementos visuais de tensao (close em bola, trave, maos)
- Goleada: celebracao, confete, torcida

#### Transferencias
**Estilo:** Composicao editorial estilo "announcement card"

**Prompt base:**
```
Clean editorial illustration of a football transfer concept. Abstract
representation of a player silhouette between two club color schemes
[Color A] and [Color B]. Modern design, geometric elements, transfer
arrow. No faces, no logos. 16:9 ratio.
--style modern graphic design
```

#### Colunas de Opiniao
**Estilo:** Ilustracao conceitual/artistica

**Prompt base:**
```
Conceptual editorial illustration about [theme]. [Metafora visual].
Think piece art style, thought-provoking, clean composition. 16:9 ratio.
--style editorial art
```

#### Estatisticas
**Estilo:** Infografico minimalista com dados visuais

**Prompt base:**
```
Clean data visualization infographic about football statistics.
Minimalist design, [color scheme], bar charts and numbers. Modern
editorial style. 16:9 ratio.
--style infographic
```

**MELHOR OPCAO:** Gerar infograficos programaticamente (HTML/CSS para PNG) com dados reais. Mais preciso que IA para dados numericos.

#### Guias Evergreen
**Estilo:** Thumbnail chamativo, tipo "guia completo"

**Usar imagens de bancos gratuitos (Unsplash/Pexels) + overlay de texto gerado programaticamente.**

### 3.3 Ferramentas de Geracao IA Recomendadas

| Ferramenta | Custo | Qualidade | API | Recomendacao |
|-----------|-------|-----------|-----|--------------|
| **Flux (via Replicate)** | ~$0.003/imagem | Excelente | Sim | **Primaria** - melhor custo-beneficio com API |
| **DALL-E 3 (OpenAI)** | ~$0.04/imagem | Muito boa | Sim | Alternativa |
| **Stable Diffusion (local)** | Custo de GPU | Boa | Self-hosted | Para volume muito alto |
| **Midjourney** | $10-60/mes | Excelente | Limitada | Para imagens premium |

### 3.4 Pipeline de Geracao de Imagem

```
1. Agente determina tipo de artigo
2. Seleciona template de prompt adequado
3. Preenche variaveis (cores dos times, tema, etc.)
4. Gera imagem via API (Flux/DALL-E)
5. Processa: resize para 1200x675 (16:9), converte para WebP
6. Gera versoes responsivas: 400w, 800w, 1200w
7. Upload para CDN/repo
8. Gera alt text descritivo
9. Insere no frontmatter do MDX
```

---

## 4. Regras Absolutas para Imagens IA

### NUNCA GERAR:
1. **Rostos de pessoas reais** - NUNCA tentar reproduzir aparencia de jogadores, tecnicos, etc.
2. **Escudos/logos de clubes** - marca registrada, gerar formas abstratas com as CORES do time
3. **Uniformes com marcas** - nao reproduzir patrocinios (Adidas, Nike, Crefisa, etc.)
4. **Texto na imagem** - IA gera texto mal, adicionar texto via overlay programatico
5. **Fotos realistas de jogadores** - sempre estilo ilustracao/editorial/conceitual

### SEMPRE:
1. Usar estilos **nao-fotograficos** (ilustracao, editorial art, infografico)
2. Representar times por **cores** nao por logos
3. Usar **silhuetas genericas** se precisar de figuras humanas
4. Incluir **alt text** descritivo e com keyword
5. Comprimir para **< 100KB** em WebP

---

## 5. Infograficos Programaticos

Para estatisticas e tabelas, a melhor opcao e gerar imagens OG (Open Graph) programaticamente.

### Stack Recomendada

```javascript
// Usar @vercel/og ou Satori para gerar imagens de tabela/dados
// Exemplo: gerar imagem OG com classificacao do Brasileirao

const ogImage = generateOG({
  template: "stat-comparison",
  data: {
    title: "Flamengo vs Palmeiras: confronto em numeros",
    stats: [
      { label: "Posse de bola", teamA: 55, teamB: 45 },
      { label: "Finalizacoes", teamA: 12, teamB: 8 },
    ],
    colors: { teamA: "#FF0000", teamB: "#006600" }
  }
});
```

**Vantagens:**
- Dados REAIS (sem alucinacao de IA)
- Estilo visual consistente
- Rapidissimo de gerar
- Compartilhavel em redes sociais
- Pode ser reusado como thumbnail

---

## 6. Especificacoes Tecnicas

### Dimensoes

| Uso | Dimensao | Formato | Peso Max |
|-----|----------|---------|----------|
| Featured image (OG) | 1200x675 | WebP | 100KB |
| Thumbnail card | 400x225 | WebP | 30KB |
| Inline no artigo | 800x450 | WebP | 60KB |
| Avatar de autor | 200x200 | WebP | 15KB |
| Infografico | 800x auto | WebP/PNG | 150KB |

### Nomenclatura de Arquivos

```
/images/
├── /2026/
│   ├── /02/
│   │   ├── flamengo-x-palmeiras-brasileirao-2026-02-24.webp
│   │   ├── radar-transferencias-2026-02-24.webp
│   │   └── estatisticas-artilharia-brasileirao-2026.webp
│   └── /03/
│       └── ...
├── /authors/
│   ├── renato-caldeira.webp
│   ├── patricia-mendes.webp
│   ├── marcos-vinicius-santos.webp
│   ├── cleia-ferreira.webp
│   └── thiago-borges.webp
└── /og/
    └── [gerados programaticamente]
```

### Alt Text

**Regras:**
- Descrever o que a imagem mostra de forma objetiva
- Incluir keyword principal do artigo naturalmente
- 80-120 caracteres
- Nunca comecar com "Imagem de..."

**Exemplos bons:**
```
alt="Ilustracao editorial do classico entre Flamengo e Palmeiras pelo Brasileirao 2026"
alt="Infografico comparativo dos numeros de gols de Endrick na temporada 2026"
alt="Diagrama tatico da formacao 4-3-3 utilizada pelo Corinthians"
```

**Exemplos ruins:**
```
alt="imagem" (vazio/generico)
alt="Imagem de futebol" (generico)
alt="foto-flamengo-palmeiras.jpg" (nome do arquivo)
```

---

## 7. Imagens dos Autores (Avatars)

Gerar UMA VEZ via IA (Midjourney ou Flux) e reusar:

**Prompt para cada autor:**
```
# Renato Caldeira
Professional headshot of a Brazilian man in his early 40s, graying
temples, wearing a dress shirt, newsroom background. Editorial portrait
style. Warm lighting. --style photographic portrait

# Patricia Mendes
Professional headshot of a Brazilian woman in her mid-30s, curly hair,
wearing glasses, tactical board background. Confident pose.
--style photographic portrait

# Marcos Vinicius Santos
Professional headshot of a young Brazilian man in his early 30s,
short beard, European stadium blurred in background. Casual smart look.
--style photographic portrait

# Dona Cleia (Cleia Ferreira)
Professional headshot of a mature Brazilian woman in her mid-50s,
short gray hair, confident warm smile, neutral background.
--style photographic portrait

# Thiago Borges
Professional headshot of a young Brazilian man in his late 20s,
nerd-cool style, data visualizations subtly in background.
--style photographic portrait
```

**CRITICO:** Gerar os avatares ANTES de lancar o portal e NUNCA mudar. A consistencia visual dos autores e parte da identidade do portal.

---

## 8. Custos Estimados

| Item | Custo Mensal Estimado |
|------|----------------------|
| Geracao IA (Flux/Replicate, ~250 imagens/mes) | R$ 15-25 |
| Geracao IA (DALL-E 3, ~250 imagens/mes) | R$ 100-150 |
| CDN/Armazenamento (Cloudflare R2 ou similar) | R$ 0-20 |
| Infograficos programaticos | R$ 0 (geracao local) |
| **Total mensal estimado** | **R$ 15-50** |
