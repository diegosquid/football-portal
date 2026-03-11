# Podcast Liverpool - Continuar Amanhã

## O que falta
- Rodar `node scripts/render-podcast-video.js galatasaray-1x0-liverpool-champions-oitavas-2026 --skip-images`
- O roteiro (25 turnos) e as 4 imagens já estão gerados em `generated/podcast-videos/galatasaray-1x0-liverpool-champions-oitavas-2026/`
- Parou no turn 23/25 do TTS por limite diário do Gemini (100 req/dia)
- Usar `--skip-images` para reaproveitar as imagens já geradas
- O TTS vai precisar regerar todos os turnos (os WAVs intermediários foram limpos)

## Depois de gerar
- Dar o título, descrição e prompt de thumbnail para o Diego (como foi feito com o podcast do Brasileirão)

## Contexto
- Artigo: "O Liverpool que não aprende está perdido nas oitavas da Champions"
- Slug: `galatasaray-1x0-liverpool-champions-oitavas-2026`
- Short já publicado: https://www.youtube.com/watch?v=SMVBaZ8T4Gk

## Linter removendo composições
- O linter remove as composições LongformVideo e PodcastVideo do Root.jsx
- Os `// eslint-disable-next-line no-unused-vars` foram adicionados mas o linter pode removê-los
- Verificar Root.jsx antes de rodar o render
- Verificar também `scripts/lib/short-video-data.js` — as exports extras (stripMarkdown, splitSentences, countWords, synthesizeSpeechWithGemini) podem ser removidas pelo linter
