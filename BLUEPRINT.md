# Blueprint — Portal de Conteudo com IA

> **Receita de bolo** para criar um portal de noticias/conteudo automatizado com Next.js, MDX, IA generativa e deploy na Vercel.
> Baseado no projeto [Beira do Campo](https://beiradocampo.com.br) — portal de futebol brasileiro.

---

## Indice

1. [Visao Geral da Arquitetura](#1-visao-geral-da-arquitetura)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Estrutura de Pastas](#3-estrutura-de-pastas)
4. [Setup Inicial](#4-setup-inicial)
5. [Sistema de Conteudo (Velite + MDX)](#5-sistema-de-conteudo-velite--mdx)
6. [Design System e Tema](#6-design-system-e-tema)
7. [Componentes](#7-componentes)
8. [Paginas e Rotas](#8-paginas-e-rotas)
9. [Dados Estruturados (Autores, Categorias, Times/Entidades)](#9-dados-estruturados-autores-categorias-timesentidades)
10. [Pipeline de Imagens com IA](#10-pipeline-de-imagens-com-ia)
11. [SEO Completo](#11-seo-completo)
12. [Paginacao SEO-Friendly](#12-paginacao-seo-friendly)
13. [Newsletter (Supabase)](#13-newsletter-supabase)
14. [API Routes](#14-api-routes)
15. [Agente Cron (Publicacao Automatizada)](#15-agente-cron-publicacao-automatizada)
16. [Deploy (Vercel + Cloudflare)](#16-deploy-vercel--cloudflare)
17. [Variaveis de Ambiente](#17-variaveis-de-ambiente)
18. [Checklist para Adaptar a Outro Nicho](#18-checklist-para-adaptar-a-outro-nicho)

---

## 1. Visao Geral da Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                        PORTAL DE CONTEUDO                       │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌────────────┐  │
│  │ Artigos  │   │  Velite  │   │ Next.js  │   │  Vercel    │  │
│  │  .MDX    │──▶│ (build)  │──▶│  16 App  │──▶│  Deploy    │  │
│  │ content/ │   │ .velite/ │   │  Router  │   │  (SSG)     │  │
│  └──────────┘   └──────────┘   └──────────┘   └────────────┘  │
│                                                                 │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐                   │
│  │ Gemini   │   │Cloudflare│   │ Supabase │                   │
│  │ API      │──▶│ R2       │   │ (news-   │                   │
│  │(imagens) │   │(hosting) │   │  letter) │                   │
│  └──────────┘   └──────────┘   └──────────┘                   │
│                                                                 │
│  ┌──────────────────────────────────────────┐                  │
│  │ Agente Cron (Claude Code / GitHub Action) │                  │
│  │ Roda a cada ~2h: pesquisa, escreve,       │                  │
│  │ gera imagem, commit + push                │                  │
│  └──────────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────────┘
```

**Fluxo resumido:**
1. Artigos em MDX ficam em `content/articles/`
2. Velite compila MDX em JSON no build (`velite build`)
3. Next.js gera paginas estaticas (SSG) usando os dados do Velite
4. Imagens sao geradas com IA (Gemini) e hospedadas no Cloudflare R2
5. Um agente cron roda periodicamente, pesquisa noticias, escreve artigos e faz commit
6. Vercel detecta o push e faz rebuild automatico

---

## 2. Stack Tecnologico

| Camada | Tecnologia | Versao | Papel |
|--------|-----------|--------|-------|
| Framework | Next.js | 16 | App Router, SSG, API Routes |
| UI | React | 19 | Componentes |
| Estilo | Tailwind CSS | 4 | Utility-first CSS |
| Tipografia | @tailwindcss/typography | 0.5 | Prose styles para artigos |
| Conteudo | Velite | 0.3 | Compilador MDX → JSON |
| Linguagem | TypeScript | 5 | Type safety |
| Imagens IA | Google Gemini API | 3.1 Flash | Geracao de imagens |
| Storage | Cloudflare R2 | - | Hospedagem de imagens (S3-compatible) |
| Imagens Fallback | Unsplash API | - | Banco de imagens curadas |
| Newsletter | Supabase | 2 | Banco de subscribers |
| Deploy | Vercel | - | Hosting + CI/CD |
| Automacao | Claude Code (cron) | - | Geracao automatizada de artigos |

### Dependencias (package.json)

```json
{
  "dependencies": {
    "@aws-sdk/client-s3": "^3.998.0",
    "@supabase/supabase-js": "^2.97.0",
    "@tailwindcss/typography": "^0.5.19",
    "gray-matter": "^4.0.3",
    "next": "16.1.6",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "reading-time": "^1.5.0",
    "velite": "^0.3.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.1.6",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

### Scripts

```json
{
  "scripts": {
    "dev": "velite dev & next dev",
    "build": "velite build && next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

> **Importante:** O `velite dev` roda em paralelo com `next dev` no modo desenvolvimento. No build, `velite build` roda ANTES de `next build`.

---

## 3. Estrutura de Pastas

```
projeto/
├── content/
│   └── articles/                    # Artigos MDX (pasta flat, sem subpastas)
│       ├── meu-artigo-exemplo.mdx
│       └── outro-artigo.mdx
├── public/
│   ├── authors/                     # Avatars dos autores (JPG)
│   ├── og-default.jpg               # OG image padrao
│   └── logo.png                     # Logo para JSON-LD
├── scripts/
│   └── generate-image.sh            # Script bash: Gemini → R2 (usado pelo cron)
├── src/
│   ├── app/
│   │   ├── globals.css              # Tema + cores + tipografia
│   │   ├── layout.tsx               # Root layout (Header + Footer + JSON-LD)
│   │   ├── page.tsx                 # Home (hero + grid de artigos)
│   │   ├── not-found.tsx            # 404 customizado
│   │   ├── robots.ts                # robots.txt dinamico
│   │   ├── sitemap.ts               # Sitemap XML dinamico
│   │   ├── [slug]/page.tsx          # Pagina de artigo individual
│   │   ├── categoria/
│   │   │   ├── [category]/page.tsx           # Listagem por categoria (pag 1)
│   │   │   └── [category]/pagina/[page]/     # Paginacao (pag 2+)
│   │   ├── autor/
│   │   │   ├── [authorSlug]/page.tsx         # Perfil + artigos do autor
│   │   │   └── [authorSlug]/pagina/[page]/   # Paginacao
│   │   ├── time/                              # (ou "tag", "topico", etc.)
│   │   │   ├── [slug]/page.tsx               # Pagina de entidade
│   │   │   └── [slug]/pagina/[page]/         # Paginacao
│   │   ├── sobre/page.tsx            # Pagina institucional
│   │   ├── politica-de-privacidade/  # Legal
│   │   ├── termos-de-uso/            # Legal
│   │   └── api/
│   │       ├── images/
│   │       │   ├── generate/route.ts  # Gemini → R2
│   │       │   └── search/route.ts    # Unsplash (fallback)
│   │       └── newsletter/route.ts    # Supabase insert
│   ├── components/
│   │   ├── Header.tsx                 # Sticky header + nav + mobile menu
│   │   ├── Footer.tsx                 # Footer 4 colunas + newsletter
│   │   ├── Logo.tsx                   # Logo SVG inline
│   │   ├── ArticleCard.tsx            # Card de artigo (featured + normal)
│   │   ├── ArticleImage.tsx           # next/image com fallback onError
│   │   ├── CategoryBadge.tsx          # Badge colorido por categoria
│   │   ├── Pagination.tsx             # Paginacao com ellipsis + responsive
│   │   ├── NewsletterForm.tsx         # Form de newsletter (client component)
│   │   ├── JsonLd.tsx                 # Schema.org (WebSite + NewsArticle)
│   │   └── mdx/
│   │       ├── MDXContent.tsx         # Renderizador MDX (Velite)
│   │       ├── SourceAttribution.tsx  # Componente de fonte/credito
│   │       └── index.tsx              # Registry de componentes MDX
│   └── lib/
│       ├── site.ts                    # Config global (nome, URL, descricao)
│       ├── authors.ts                 # Dados dos autores/personas
│       ├── categories.ts              # Categorias com cores
│       ├── teams.ts                   # Entidades/tags principais
│       ├── images.ts                  # Banco de fallback por categoria
│       ├── pagination.ts              # Utilidades de paginacao
│       ├── r2.ts                      # Upload para Cloudflare R2
│       └── supabase.ts               # Cliente Supabase
├── .velite/                           # Output do Velite (gitignored)
├── velite.config.ts                   # Schema do conteudo
├── next.config.ts                     # Config Next.js
├── tsconfig.json                      # TypeScript config
├── postcss.config.mjs                 # PostCSS (Tailwind 4)
├── eslint.config.mjs                  # ESLint
├── CRON.MD                            # Instrucoes para o agente cron
├── CONTENT_GUIDELINE.md               # Regras de escrita
├── AUTHOR_PERSONAS.md                 # Vozes dos autores
├── CONTENT_TYPES.md                   # Templates por tipo de artigo
├── EDITORIAL_CALENDAR.md              # Calendario editorial
├── SEO_STRATEGY.md                    # Estrategia de SEO
└── IMAGE_STRATEGY.md                  # Estrategia de imagens
```

---

## 4. Setup Inicial

### 4.1 Criar projeto

```bash
npx create-next-app@latest meu-portal --typescript --tailwind --eslint --app --src-dir
cd meu-portal
```

### 4.2 Instalar dependencias

```bash
npm install velite @tailwindcss/typography reading-time gray-matter
npm install @aws-sdk/client-s3 @supabase/supabase-js
```

### 4.3 Configurar Velite

**velite.config.ts** — Define o schema dos artigos:

```typescript
import { defineConfig, s } from "velite";

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: {
    articles: {
      name: "Article",
      pattern: "articles/**/*.mdx",
      schema: s
        .object({
          title: s.string().max(120),
          slug: s.slug("articles"),
          excerpt: s.string().max(300),
          date: s.isodate(),
          updated: s.isodate().optional(),
          author: s.string(),
          category: s.string(),
          tags: s.array(s.string()).default([]),
          teams: s.array(s.string()).default([]),     // entidades relacionadas
          image: s.string().optional(),
          imageCaption: s.string().optional(),
          source: s.object({ name: s.string(), url: s.string() }).optional(),
          draft: s.boolean().default(false),
          featured: s.boolean().default(false),
          body: s.mdx(),
          metadata: s.metadata(),
        })
        .transform((data) => ({
          ...data,
          permalink: `/${data.slug}`,
          readingTime: Math.ceil((data.metadata?.wordCount ?? 0) / 200),
        })),
    },
  },
});
```

### 4.4 Configurar TypeScript paths

**tsconfig.json** — Adicionar path alias para o Velite:

```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "#content": ["./.velite"]
    }
  }
}
```

### 4.5 Configurar PostCSS (Tailwind 4)

**postcss.config.mjs:**
```javascript
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
export default config;
```

### 4.6 Configurar Next.js

**next.config.ts:**
```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
```

---

## 5. Sistema de Conteudo (Velite + MDX)

### 5.1 Como funciona

- Artigos sao arquivos `.mdx` em `content/articles/`
- O Velite compila todos os MDX em build time e gera `.velite/articles.json`
- No codigo, importa-se os dados via `import { articles } from "#content"`
- Cada artigo tem frontmatter (metadados) + body (conteudo MDX compilado)

### 5.2 Formato do artigo (MDX)

```yaml
---
title: "Titulo do Artigo (50-65 chars ideal para SEO)"
slug: "titulo-do-artigo-sem-acentos"
excerpt: "Resumo curto para cards e meta description (ate 300 chars)"
date: "2026-02-25T18:30:00-03:00"
author: "slug-do-autor"
category: "slug-da-categoria"
tags: ["tag1", "tag2", "tag3"]
teams: ["entidade1", "entidade2"]
image: "https://url-da-imagem.com/artigo.png"
imageCaption: "Legenda contextual da imagem (80-150 chars)"
source:
  name: "Nome da Fonte"
  url: "https://fonte-original.com"
featured: false
draft: false
---

Conteudo do artigo em Markdown/MDX.

## Subtitulo

Paragrafo com **negrito** e *italico*.

- Item de lista
- Outro item

> Citacao
```

### 5.3 Renderizador MDX

O Velite compila MDX em codigo JS. O componente `MDXContent` executa esse codigo:

```typescript
// src/components/mdx/MDXContent.tsx
import * as runtime from "react/jsx-runtime";
import { mdxComponents } from "./index";

const useMDXComponent = (code: string) => {
  const fn = new Function(code);
  return fn({ ...runtime }).default;
};

export function MDXContent({ code }: { code: string }) {
  const Component = useMDXComponent(code);
  return <Component components={mdxComponents} />;
}
```

### 5.4 Componentes MDX customizados

Registre componentes que podem ser usados dentro dos artigos:

```typescript
// src/components/mdx/index.tsx
import { SourceAttribution } from "./SourceAttribution";

export const mdxComponents = {
  SourceAttribution,
  // Adicione mais: InfoBox, StatsTable, PlayerCard, etc.
};
```

---

## 6. Design System e Tema

### 6.1 Cores e variaveis (globals.css)

```css
@import "tailwindcss";
@source "../../src";
@plugin "@tailwindcss/typography";

@theme inline {
  /* Cores principais — ADAPTAR ao seu nicho */
  --color-primary: #e94560;        /* Cor de destaque (links, CTAs) */
  --color-primary-dark: #c7344d;   /* Hover da primary */
  --color-secondary: #16213e;      /* Textos, headers */
  --color-tertiary: #0f3460;       /* Backgrounds escuros */
  --color-dark: #1a1a2e;           /* Background header/footer */
  --color-surface: #f8f9fa;        /* Background de secoes alternadas */

  /* Cores por categoria — ADAPTAR */
  --color-brasileirao: #008000;
  --color-libertadores: #0066cc;
  --color-champions: #6600cc;
  /* ... mais categorias */

  /* Tipografia */
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-heading: "Inter", ui-sans-serif, system-ui, sans-serif;
}

/* Tipografia de artigos */
.prose-article {
  @apply prose prose-lg max-w-none;
  @apply prose-headings:font-bold prose-headings:text-secondary;
  @apply prose-p:text-gray-700 prose-p:leading-relaxed;
  @apply prose-a:text-primary prose-a:no-underline hover:prose-a:underline;
  @apply prose-img:rounded-lg;
  @apply prose-blockquote:border-l-primary prose-blockquote:text-gray-600;
  @apply prose-strong:text-secondary;
}

/* Badges coloridos por categoria */
.badge-brasileirao { background-color: var(--color-brasileirao); }
.badge-libertadores { background-color: var(--color-libertadores); }
/* ... uma classe por categoria */
```

### 6.2 Layout padrao

```
┌─────────────────────────────────────┐
│ [Top bar escuro - tagline + links]  │
│ [Header sticky - Logo + Nav + Menu] │
├─────────────────────────────────────┤
│                                     │
│         <main> (conteudo)           │
│                                     │
├─────────────────────────────────────┤
│ [Footer 4 colunas]                  │
│  Brand | Categorias | Inst | News   │
│ [Copyright]                         │
└─────────────────────────────────────┘
```

---

## 7. Componentes

### 7.1 ArticleCard (principal)

Card de artigo com dois modos: `featured` (hero grande) e normal (grid).

**Funcionalidades:**
- Imagem com fallback automatico (onError)
- Badge de categoria colorido
- TimeAgo relativo ("Agora pouco", "3h atras", "2d atras", "25 fev")
- Nome do autor
- Tempo de leitura
- Hover com scale na imagem

```typescript
// Logica de timeAgo (adaptar timezone ao seu caso)
function timeAgo(dateString: string): string {
  const articleDate = new Date(dateString);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - articleDate.getTime());
  const diffHours = Math.round(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffHours < 1) return "Agora pouco";
  if (diffHours < 24) return `${diffHours}h atras`;
  if (diffDays < 7) return `${diffDays}d atras`;
  return articleDate.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}
```

### 7.2 ArticleImage (client component)

Wrapper do `next/image` com fallback automatico:

```typescript
"use client";
import { useState } from "react";
import Image from "next/image";

export function ArticleImage({ src, alt, fallbackSrc, ...props }) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc || DEFAULT_IMAGE);
  const [hasError, setHasError] = useState(false);

  function handleError() {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc || DEFAULT_IMAGE);
    }
  }

  return <Image src={imgSrc} alt={alt} onError={handleError} {...props} />;
}
```

### 7.3 CategoryBadge

Badge colorido usando CSS class dinamica: `badge-${category}`.

### 7.4 Pagination

Componente de paginacao com:
- Botoes "Anterior" / "Proxima" com `rel="prev"` / `rel="next"`
- Numeros de pagina com ellipsis (1 ... 4 5 6 ... 10)
- Mobile: "Pagina X de Y"
- Esconde automaticamente quando `totalPages <= 1`

### 7.5 JsonLd

Structured data para SEO:
- `WebSiteJsonLd` — no layout root
- `NewsArticleJsonLd` — em cada artigo (headline, datePublished, author, publisher, image)

### 7.6 NewsletterForm (client)

Formulario com estados: idle → loading → success/error. POST para `/api/newsletter`.

---

## 8. Paginas e Rotas

### 8.1 Mapa de rotas

| Rota | Arquivo | Descricao |
|------|---------|-----------|
| `/` | `page.tsx` | Home: hero (artigo mais recente) + grid |
| `/[slug]` | `[slug]/page.tsx` | Artigo individual (SSG) |
| `/categoria/[cat]` | `categoria/[category]/page.tsx` | Listagem paginada (pag 1) |
| `/categoria/[cat]/pagina/[n]` | `...pagina/[page]/page.tsx` | Listagem (pag 2+) |
| `/autor/[slug]` | `autor/[authorSlug]/page.tsx` | Perfil + artigos |
| `/autor/[slug]/pagina/[n]` | `...pagina/[page]/page.tsx` | Paginacao |
| `/time/[slug]` | `time/[slug]/page.tsx` | Pagina de entidade |
| `/time/[slug]/pagina/[n]` | `...pagina/[page]/page.tsx` | Paginacao |
| `/sobre` | `sobre/page.tsx` | Equipe editorial |
| `/politica-de-privacidade` | `...page.tsx` | Legal |
| `/termos-de-uso` | `...page.tsx` | Legal |
| `/sitemap.xml` | `sitemap.ts` | Sitemap dinamico |
| `/robots.txt` | `robots.ts` | Robots dinamico |

### 8.2 Padrao de pagina de listagem

Toda pagina de listagem segue o mesmo padrao:

```typescript
import { articles } from "#content";
import { paginate, buildPaginationUrls } from "@/lib/pagination";

export default async function ListPage({ params }) {
  const { slug } = await params;

  // 1. Filtrar artigos relevantes
  const filtered = articles
    .filter((a) => a.category === slug && !a.draft)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // 2. Paginar
  const result = paginate(filtered, 1); // ou pageNum para paginas 2+
  const { pageUrl } = buildPaginationUrls(`/categoria/${slug}`, 1, result?.totalPages ?? 1);

  // 3. Renderizar grid + paginacao
  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {result.items.map((article) => (
          <ArticleCard key={article.slug} {...article} />
        ))}
      </div>
      <Pagination currentPage={1} totalPages={result.totalPages} pageUrl={pageUrl} />
    </>
  );
}
```

### 8.3 Pagina de artigo individual

Estrutura completa:
1. **Breadcrumb:** Inicio / Categoria / Titulo
2. **Header:** Badge + H1 + Excerpt + Author avatar + Data + Reading time
3. **Hero image:** ArticleImage com fallback + caption
4. **Body:** `<MDXContent>` com prose-article
5. **Source attribution:** Link para fonte original
6. **Tags:** Pills com hashtags
7. **Author box:** Card com bio e links
8. **Related articles:** 3 artigos da mesma categoria ou times em comum

---

## 9. Dados Estruturados (Autores, Categorias, Entidades)

### 9.1 Config do site (`src/lib/site.ts`)

```typescript
export const siteConfig = {
  name: "Nome do Portal",
  description: "Descricao para meta tags e footer",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://meudominio.com.br",
  locale: "pt-BR",
  language: "pt",
  // ... links sociais
};
```

### 9.2 Autores/Personas (`src/lib/authors.ts`)

Cada autor e uma persona com voz, estilo e especialidade distintas:

```typescript
export interface Author {
  slug: string;       // Referenciado no frontmatter
  name: string;
  role: string;       // "Editor-chefe", "Analista", "Colunista"
  bio: string;
  avatar: string;     // /authors/nome.jpg
  specialty: string;
  social?: { twitter?: string; instagram?: string };
}

export const authors: Record<string, Author> = {
  "renato-caldeira": { ... },
  "patricia-mendes": { ... },
  // ...
};
```

### 9.3 Categorias (`src/lib/categories.ts`)

```typescript
export interface Category {
  slug: string;        // Usado na URL e no frontmatter
  label: string;       // Nome de exibicao
  description: string; // Meta description da pagina
  color: string;       // Cor hex para badges
}

export const categories: Category[] = [
  { slug: "brasileirao", label: "Brasileirao", description: "...", color: "#008000" },
  // ...
];
```

### 9.4 Entidades/Tags (`src/lib/teams.ts`)

Entidades que agrupam artigos (times, topicos, series):

```typescript
export interface Team {
  slug: string;
  name: string;
  shortName: string;   // Abreviacao para badges/avatars
  state: string;       // Metadata adicional
}

export const teams: Record<string, Team> = {
  flamengo: { slug: "flamengo", name: "Flamengo", shortName: "FLA", state: "RJ" },
  // ...
};
```

---

## 10. Pipeline de Imagens com IA

### 10.1 Arquitetura

```
Artigo → Prompt em ingles → Gemini API → Imagem base64 → Upload R2 → URL publica
```

### 10.2 API Route (`/api/images/generate`)

Recebe `{ prompt, slug }`, gera imagem com Gemini, faz upload no R2, retorna URL publica.

**Modelo:** `gemini-3.1-flash-image-preview`
**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`

```typescript
const geminiPayload = {
  contents: [{
    parts: [{ text: `${systemPrompt}\n\nGenerate an image: ${prompt}` }],
  }],
  generationConfig: {
    responseModalities: ["IMAGE", "TEXT"],
  },
};
```

**System prompt com guidelines criativos:**
```
"You are a creative image generator for a [NICHO] portal.
Generate a unique, visually striking editorial illustration.
STYLE: Vary the visual approach — cinematic compositions, creative angles,
dramatic close-ups, artistic lighting, aerial views, silhouettes.
DO NOT default to generic images. Be creative and specific.
IMPORTANT: Do NOT include any text, watermarks, logos."
```

### 10.3 Upload para Cloudflare R2

```typescript
// src/lib/r2.ts
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: ACCESS_KEY_ID, secretAccessKey: SECRET_ACCESS_KEY },
});

export async function uploadToR2(key: string, body: Buffer, contentType = "image/png") {
  await s3.send(new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }));
  return `${PUBLIC_URL}/${key}`;
}
```

### 10.4 Script Bash (para uso no cron)

`scripts/generate-image.sh` — Alternativa standalone que nao precisa do dev server:
1. Carrega `.env.local`
2. Chama Gemini API via curl
3. Extrai base64 da resposta com python3
4. Faz upload direto no R2 com AWS Signature V4

### 10.5 Fallback de imagens

Banco de imagens curadas por categoria (Unsplash, licenca gratuita):

```typescript
// src/lib/images.ts
export const imageCatalog: Record<string, string[]> = {
  brasileirao: [
    "https://images.unsplash.com/photo-XXXXX?w=800&h=450&fit=crop",
    // ...
  ],
  // ... por categoria
};

export function getFallbackImage(category?: string): string {
  const pool = (category && imageCatalog[category]) || genericFallbacks;
  const dayIndex = new Date().getDate() % pool.length; // varia por dia
  return pool[dayIndex];
}
```

---

## 11. SEO Completo

### 11.1 Meta tags (layout.tsx)

```typescript
export const metadata: Metadata = {
  title: {
    default: `${siteConfig.name} — Descricao curta`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: siteConfig.locale, ... },
  twitter: { card: "summary_large_image", ... },
  robots: {
    index: true, follow: true,
    googleBot: {
      index: true, follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};
```

### 11.2 Metadata por artigo

Cada artigo gera seus proprios OG tags:
- `og:type` = "article"
- `og:title`, `og:description`, `og:image`
- `article:published_time`, `article:modified_time`
- `article:author`
- `canonical` URL

### 11.3 Structured Data (JSON-LD)

- **WebSite** — no layout root
- **NewsArticle** — em cada artigo com headline, datePublished, dateModified, author, publisher, image

### 11.4 Sitemap dinamico

```typescript
// src/app/sitemap.ts
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // Paginas estaticas (priority 1.0)
    // Categorias (priority 0.8)
    // Categorias paginadas (priority 0.7)
    // Autores (priority 0.6)
    // Entidades/times (priority 0.7)
    // Artigos (priority 0.9)
  ];
}
```

### 11.5 Robots.txt

```typescript
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
```

---

## 12. Paginacao SEO-Friendly

### 12.1 Estrategia

- **URLs separadas por pagina** (melhor para SEO que query params)
- Pagina 1: `/categoria/brasileirao` (URL limpa)
- Pagina N: `/categoria/brasileirao/pagina/N`
- Redirect 308 de `/pagina/1` → URL base (evita conteudo duplicado)
- `rel="prev"` / `rel="next"` nos links de navegacao
- Canonical URL em cada pagina

### 12.2 Utilitarios (`src/lib/pagination.ts`)

```typescript
export const ARTICLES_PER_PAGE = 12; // 3 colunas × 4 linhas

export function paginate<T>(items: T[], page: number, perPage = ARTICLES_PER_PAGE) {
  const totalPages = Math.max(1, Math.ceil(items.length / perPage));
  if (page < 1 || page > totalPages) return null;
  const start = (page - 1) * perPage;
  return {
    items: items.slice(start, start + perPage),
    currentPage: page,
    totalPages,
    totalItems: items.length,
    hasPrev: page > 1,
    hasNext: page < totalPages,
  };
}

export function buildPaginationUrls(basePath: string, currentPage: number, totalPages: number) {
  const pageUrl = (page: number) => page === 1 ? basePath : `${basePath}/pagina/${page}`;
  return {
    canonical: pageUrl(currentPage),
    prev: currentPage > 1 ? pageUrl(currentPage - 1) : null,
    next: currentPage < totalPages ? pageUrl(currentPage + 1) : null,
    pageUrl,
  };
}

export function getPageNumbers(totalItems: number, perPage = ARTICLES_PER_PAGE): number[] {
  const totalPages = Math.ceil(totalItems / perPage);
  return Array.from({ length: Math.max(0, totalPages - 1) }, (_, i) => i + 2);
}
```

### 12.3 Rota paginada (pagina 2+)

```typescript
// /categoria/[category]/pagina/[page]/page.tsx
export default async function PaginatedPage({ params }) {
  const { category, page } = await params;
  const pageNum = parseInt(page, 10);

  // Redirect /pagina/1 → URL base
  if (pageNum === 1) permanentRedirect(`/categoria/${category}`);

  // ... filtrar, paginar, renderizar
}

export async function generateStaticParams() {
  // Gerar todas as combinacoes categoria × pagina
  const allParams = [];
  for (const cat of getAllCategories()) {
    const catArticles = getCategoryArticles(cat.slug);
    const pageNumbers = getPageNumbers(catArticles.length);
    for (const p of pageNumbers) {
      allParams.push({ category: cat.slug, page: String(p) });
    }
  }
  return allParams;
}
```

---

## 13. Newsletter (Supabase)

### 13.1 Setup

1. Criar projeto no [Supabase](https://supabase.com)
2. Criar tabela `subscribers`:
   ```sql
   CREATE TABLE subscribers (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     email text UNIQUE NOT NULL,
     created_at timestamptz DEFAULT now()
   );
   ```
3. Configurar env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 13.2 API Route

```typescript
// /api/newsletter/route.ts
export async function POST(request: Request) {
  const { email } = await request.json();
  // Validar email
  // Inserir no Supabase
  // Tratar duplicata (code 23505 = ja inscrito)
}
```

---

## 14. API Routes

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/api/images/generate` | POST | Gera imagem com Gemini + upload R2 |
| `/api/images/generate?test=true` | GET | Diagnostico (Gemini + R2) |
| `/api/images/search?q=termo` | GET | Busca Unsplash (fallback) |
| `/api/images/search?test=true` | GET | Diagnostico Unsplash |
| `/api/newsletter` | POST | Inscrever email na newsletter |

---

## 15. Agente Cron (Publicacao Automatizada)

### 15.1 Conceito

Um agente de IA (Claude Code, GitHub Action, ou similar) que roda a cada ~2 horas e:

1. **Verifica** que horas sao (no fuso horario do publico-alvo)
2. **Consulta** tabela de horarios para saber o tipo de artigo
3. **Pesquisa** noticias atuais via web search
4. **Verifica deduplicacao** (nao repetir temas)
5. **Seleciona** autor apropriado
6. **Escreve** artigo MDX seguindo guidelines
7. **Gera imagem** com IA
8. **Commit + push** para o repositorio
9. Vercel detecta o push e faz rebuild

### 15.2 Documentacao necessaria

Para o agente funcionar bem, criar estes documentos:

| Documento | Conteudo |
|-----------|----------|
| `CRON.MD` | Instrucoes operacionais completas (fluxo, horarios, deduplicacao) |
| `CONTENT_GUIDELINE.md` | Regras de escrita, tom, frases proibidas |
| `AUTHOR_PERSONAS.md` | Voz e estilo de cada autor |
| `CONTENT_TYPES.md` | Templates MDX por tipo de artigo |
| `EDITORIAL_CALENDAR.md` | Calendario editorial semanal |
| `SEO_STRATEGY.md` | Regras de SEO para artigos |
| `IMAGE_STRATEGY.md` | Regras de imagens e prompts |

### 15.3 Restricoes importantes

- **Max artigos por dia:** 6-10 (12 em dias especiais)
- **Max por autor por dia:** 2
- **Espaco minimo entre artigos:** 45 minutos
- **Nunca publicar de madrugada** (00:30 - 05:30 no fuso local)
- **Min 3 fontes** por artigo
- **Deduplicacao obrigatoria** (slug, tema, angulo)

### 15.4 Slot de horarios (exemplo para portal de noticias)

| Horario | Tipo |
|---------|------|
| 05:30-06:30 | Radar/roundup matinal |
| 06:30-08:00 | Noticia principal #1 |
| 08:00-10:00 | Analise profunda / conteudo evergreen |
| 10:00-12:00 | Noticia #2 |
| 12:00-14:30 | Coluna de opiniao |
| 14:30-17:30 | Pre-evento / cobertura |
| 17:30-19:30 | Noticia urgente |
| 19:30-23:00 | Pos-evento / resultado |
| 23:00-00:30 | Cobertura de rodada |

---

## 16. Deploy (Vercel + Cloudflare)

### 16.1 Vercel

1. Conectar repositorio GitHub
2. Framework preset: Next.js
3. Build command: `velite build && next build` (ja no package.json)
4. Configurar env vars na dashboard
5. Dominio customizado: configurar DNS

### 16.2 Cloudflare R2

1. Criar bucket no Cloudflare dashboard
2. Habilitar acesso publico (Settings → Public Access → Allow)
3. Criar API token com permissoes S3:
   - Object Read & Write
4. Anotar: Account ID, Access Key ID, Secret Access Key, Public URL

### 16.3 Build Output

O build gera paginas estaticas (SSG) para todos os artigos, categorias, autores e entidades. O output tipico:

```
Route (app)
├ ○ /                          (home)
├ ○ /[slug]                    (artigos - SSG)
├ ○ /categoria/[category]      (categorias)
├ ○ /autor/[authorSlug]        (autores)
├ ○ /time/[slug]               (entidades)
├ ƒ /api/images/generate       (serverless)
├ ƒ /api/images/search         (serverless)
├ ƒ /api/newsletter            (serverless)
├ ○ /sitemap.xml
└ ○ /robots.txt
```

---

## 17. Variaveis de Ambiente

```env
# Site
NEXT_PUBLIC_SITE_URL=https://meudominio.com.br

# Imagens - Gemini IA
GEMINI_API_KEY=sua-chave-gemini

# Imagens - Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=seu-account-id
R2_ACCESS_KEY_ID=sua-access-key
R2_SECRET_ACCESS_KEY=seu-secret
R2_BUCKET_NAME=nome-do-bucket
R2_PUBLIC_URL=https://pub-xxx.r2.dev

# Imagens - Unsplash (fallback)
UNSPLASH_ACCESS_KEY=sua-chave-unsplash

# Newsletter - Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
```

---

## 18. Checklist para Adaptar a Outro Nicho

### Passo 1: Identidade

- [ ] Trocar nome em `src/lib/site.ts`
- [ ] Trocar logo em `src/components/Logo.tsx`
- [ ] Trocar cores em `globals.css` (`--color-primary`, etc.)
- [ ] Trocar dominio e descricao
- [ ] Trocar `lang` no layout.tsx (`pt-BR`, `en`, etc.)

### Passo 2: Categorias

- [ ] Definir categorias em `src/lib/categories.ts`
- [ ] Criar badge CSS para cada categoria no `globals.css`
- [ ] Atualizar nav no Header e Footer

### Passo 3: Autores/Personas

- [ ] Definir autores em `src/lib/authors.ts`
- [ ] Criar avatars em `public/authors/`
- [ ] Documentar vozes em `AUTHOR_PERSONAS.md`

### Passo 4: Entidades

- [ ] Definir entidades em `src/lib/teams.ts` (pode ser: times, topicos, series, etc.)
- [ ] Renomear rota `/time/` para o que fizer sentido (ex: `/topico/`, `/serie/`)

### Passo 5: Conteudo

- [ ] Criar primeiros artigos de exemplo em `content/articles/`
- [ ] Ajustar schema do Velite se precisar de campos extras
- [ ] Atualizar banco de imagens fallback em `src/lib/images.ts`

### Passo 6: IA e Automacao

- [ ] Configurar Gemini API key
- [ ] Configurar Cloudflare R2 (bucket + credentials)
- [ ] Adaptar system prompt de geracao de imagens ao nicho
- [ ] Escrever CRON.MD com regras especificas do nicho
- [ ] Escrever guidelines de conteudo

### Passo 7: Infra

- [ ] Configurar Supabase (newsletter)
- [ ] Deploy na Vercel
- [ ] Configurar dominio
- [ ] Configurar env vars na Vercel
- [ ] Testar build completo

### Passo 8: SEO

- [ ] Configurar Google Search Console
- [ ] Submeter sitemap
- [ ] Verificar rich results com Schema.org validator
- [ ] Configurar Google Analytics / Plausible

---

## Exemplos de Nichos que Funcionam com Esta Arquitetura

| Nicho | Categorias | Entidades | Autores |
|-------|-----------|-----------|---------|
| **Futebol** | Brasileirao, Transferencias, Champions | Times | Jornalistas |
| **Tecnologia** | Reviews, Tutoriais, Noticias, IA | Marcas (Apple, Google) | Editores |
| **Games** | Reviews, Previews, Noticias, Esports | Jogos, Plataformas | Reviewers |
| **Financas** | Acoes, Cripto, Educacao, Economia | Empresas, Moedas | Analistas |
| **Culinaria** | Receitas, Restaurantes, Dicas | Cozinhas, Ingredientes | Chefs |
| **Saude** | Nutricao, Exercicios, Bem-estar | Especialidades | Profissionais |

A arquitetura e a mesma — so muda o conteudo, categorias, entidades e guidelines.

---

> **Criado com base no projeto Beira do Campo. Licensa: use como quiser.**
