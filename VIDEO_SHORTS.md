# VIDEO_SHORTS.md

Guia operacional do fluxo de shorts verticais do Beira do Campo.

Este fluxo e separado do pipeline editorial principal. Nao faz parte do cron de publicacao de materias.

---

## 1. Objetivo

Gerar shorts verticais de noticias em formato jornalistico a partir de uma materia ja publicada:

- imagem principal da materia como base visual;
- composicao vertical em Remotion;
- narracao em audio;
- CTA para ler a materia completa no site.

Hoje o fluxo principal usa:

- **Remotion** para composicao e render;
- **Gemini TTS** para narracao;
- **fallback local com `say`** se necessario;
- **ffmpeg** para conversoes de audio;
- **MDX existente** em `content/articles/`.

---

## 2. Estrutura

Arquivos principais:

- `scripts/render-remotion-short.js`
- `scripts/lib/short-video-data.js`
- `video-studio/package.json`
- `video-studio/render-article.mjs`
- `video-studio/src/Root.jsx`
- `video-studio/src/NewsShort.jsx`

Saidas geradas:

- `generated/remotion-shorts/<slug>/`

Assets temporarios/copias para o Remotion:

- `video-studio/public/renders/<slug>/`

---

## 3. Dependencias

Necessario no ambiente:

- Node.js
- `ffmpeg`
- internet para Gemini TTS
- `GEMINI_API_KEY` no `.env.local`

Opcional:

- `say` do macOS para fallback local

O `video-studio/` e um pacote isolado. Ele nao interfere no app Next principal.

Instalacao do Remotion:

```bash
cd video-studio
npm install
```

---

## 4. Como Gerar

### Ultima materia

```bash
node scripts/render-remotion-short.js --latest
```

### Escolher formato visual

```bash
node scripts/render-remotion-short.js --latest --format clean
node scripts/render-remotion-short.js --latest --format split
node scripts/render-remotion-short.js --latest --format pulse
node scripts/render-remotion-short.js --latest --format stacked
node scripts/render-remotion-short.js --latest --format ticker
node scripts/render-remotion-short.js --latest --format poster
node scripts/render-remotion-short.js --latest --format briefing
```

### Materia especifica por slug

```bash
node scripts/render-remotion-short.js paulistao-2026-final-numeros-palmeiras-novorizontino
```

### Com roteiro manual

```bash
node scripts/render-remotion-short.js \
  --latest \
  --narration-file /caminho/roteiro.txt
```

### Com imagem local manual

```bash
node scripts/render-remotion-short.js \
  --latest \
  --image /caminho/imagem.png
```

---

## 5. TTS

### Padrao

O padrao atual e:

```bash
--tts-provider auto
```

Nesse modo:

1. tenta Gemini TTS;
2. se falhar, cai para voz local com `say`.

### Forcar Gemini

```bash
node scripts/render-remotion-short.js --latest --tts-provider gemini
```

### Forcar fallback local

```bash
node scripts/render-remotion-short.js --latest --tts-provider local
```

### Escolher voz do Gemini

```bash
node scripts/render-remotion-short.js --latest --gemini-voice Kore
```

### Escolher voz local

```bash
node scripts/render-remotion-short.js --latest --tts-provider local --voice "Eddy (Portuguese (Brazil))"
```

---

## 6. Saida Esperada

Para cada slug, o fluxo gera:

- `narration.txt`
- `narration.m4a`
- `narration-gemini.pcm` e `narration-gemini.wav` quando o provider for Gemini
- `narration.aiff` quando o provider for local
- `input-props.json`
- `manifest.json`
- `<slug>-remotion.mp4`

Exemplo:

`generated/remotion-shorts/paulistao-2026-final-numeros-palmeiras-novorizontino/`

O `manifest.json` registra:

- slug;
- paths dos assets;
- provider de TTS;
- voz usada;
- duracao do audio;
- highlights;
- narracao final.

---

## 7. Como Funciona

### Etapa 1: leitura da materia

O script le:

- `title`
- `excerpt`
- `author`
- `category`
- `teams`
- `tags`
- `image`
- `body`

Fonte:

- `content/articles/<slug>.mdx`

### Etapa 2: roteiro

Se `--narration-file` for informado:

- usa o texto desse arquivo.

Se nao:

- gera automaticamente um resumo curto com heuristica baseada no `excerpt` e no corpo do artigo.

### Etapa 3: narracao

Com Gemini:

- envia texto para o endpoint TTS;
- recebe audio PCM;
- converte para WAV;
- converte para M4A.

Com fallback local:

- usa `say`;
- gera AIFF;
- converte para M4A.

### Etapa 4: Remotion

O render:

- copia imagem e audio para `video-studio/public/renders/<slug>/`;
- monta props em `input-props.json`;
- renderiza a composicao Remotion correspondente ao formato escolhido.

Mapeamento atual:

- `clean` -> `NewsShortClean`
- `split` -> `NewsShortSplit`
- `pulse` -> `NewsShortPulse`
- `stacked` -> `NewsShortStacked`
- `ticker` -> `NewsShortTicker`
- `poster` -> `NewsShortPoster`
- `briefing` -> `NewsShortBriefing`

---

## 8. Layout Atual

Template atual:

- fundo com blur e leve movimento;
- card central com a imagem da materia;
- logo/nome do site no topo;
- badge de categoria;
- headline e excerpt;
- CTA final para seguir o canal no rodape;
- waveform decorativo.

A versao atual **nao usa mais**:

- badge visual de microfone sobre a imagem;
- pills de highlights acima do CTA.

Esses elementos foram removidos para limpar a composicao.

Formatos disponiveis hoje:

- `clean`
  visual mais limpo e editorial, com headline forte e CTA compacto no rodape.
- `split`
  painel informativo sobre a imagem, com destaque para headline, resumo e bullets.
- `pulse`
  formato mais energetico, full-screen, com cards de destaque e waveform maior.
- `stacked`
  imagem forte em cima e bloco editorial claro embaixo, com cara de capa de revista.
- `ticker`
  visual de breaking news com faixa correndo e clima de transmissao.
- `poster`
  composicao mais bold, com headline gigante e leitura de cartaz/editorial.

---

## 9. Desenvolvimento Visual

Para abrir o studio do Remotion:

```bash
cd video-studio
npm run dev
```

Arquivo principal da composicao:

- `video-studio/src/NewsShort.jsx`

Root das composicoes:

- `video-studio/src/Root.jsx`

---

## 10. Troubleshooting

### 1. Primeiro render do Remotion falha pedindo browser

Normal na primeira execucao.

O Remotion baixa o Chrome Headless Shell automaticamente.

### 2. Gemini TTS falhou

Verificar:

- `GEMINI_API_KEY` no `.env.local`;
- acesso de rede;
- quota/permissao da API.

Se quiser seguir mesmo assim:

```bash
node scripts/render-remotion-short.js --latest --tts-provider local
```

### 3. Imagem da materia nao baixa

Pode passar uma imagem local manualmente:

```bash
node scripts/render-remotion-short.js --latest --image /caminho/imagem.png
```

### 4. Quer controlar melhor o texto narrado

Use roteiro manual:

```bash
node scripts/render-remotion-short.js \
  --latest \
  --narration-file /caminho/roteiro.txt
```

---

## 11. Exemplo Real

Short de referencia ja gerado:

- materia: `paulistao-2026-final-numeros-palmeiras-novorizontino`
- saida:
  `generated/remotion-shorts/paulistao-2026-final-numeros-palmeiras-novorizontino/paulistao-2026-final-numeros-palmeiras-novorizontino-remotion.mp4`

---

## 12. Proximos Passos Recomendados

- captions sincronizadas com o audio;
- 2 ou 3 templates editoriais diferentes;
- voice selection por autor/persona;
- upload automatico para R2;
- fila/manual UI para aprovar antes de publicar;
- trilha sonora ambiente opcional bem baixa.
