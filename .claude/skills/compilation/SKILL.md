---
name: compilation
description: Cria shorts de compilação (Top 5 gols, melhores dribles, etc.) a partir de clipes de vídeo fornecidos pelo usuário. Gera narração estilo mesa-redonda, corta clipes com ffmpeg e monta no Remotion.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
argument-hint: [slug]
---

# Gerador de Compilações — Beira do Campo

Cria shorts de compilação estilo "Top 5 gols do Ronaldinho" com clipes de vídeo.

## Fluxo

### Fase 1: Coleta de informações

1. Pergunte ao usuário:
   - **Tema**: qual o assunto da compilação? (ex: "Top 5 gols do Ronaldinho Gaúcho")
   - **Categoria**: curiosidades, brasileirao, champions, etc.
   - **Clipes**: pra cada clipe, precisa de:
     - **Source**: URL do YouTube (ex: `https://youtube.com/watch?v=xxx`) OU path de mp4 local
     - Timestamp início (M:SS)
     - Timestamp fim (M:SS)
     - Label (competição, ano — ex: "Barcelona vs Real Madrid, 2007")
     - Contexto (o que acontece no clipe — ex: "Gol de bicicleta no clássico")
   - O script aceita URLs do YouTube automaticamente — baixa com yt-dlp e corta com ffmpeg

2. Monte o slug a partir do tema (ex: `top5-gols-ronaldinho`)

### Fase 2: Roteiro (criativa — com aprovação)

3. Gere narração estilo mesa-redonda para cada segmento:

   **Segmentos obrigatórios:**
   - `intro`: Gancho de abertura (15-25 palavras). Ex: "[excited] Ô meu amigo, prepara o coração! Os cinco gols mais bonitos do Bruxo Ronaldinho Gaúcho!"
   - `item-N` (um por clipe, do maior rank ao menor): Narração do clipe (15-25 palavras cada). Ex: "[excited] Número cinco! Barcelona contra Villarreal, 2007. Olha esse chapéu desconcertante... que isso, meu amigo!"
   - `cta`: Encerramento (10-15 palavras). Ex: "Concorda com o ranking? Comenta aí qual é o seu favorito! Siga o canal!"

   **Regras de roteiro (mesmas do /short):**
   - Tom: comentarista de mesa-redonda, visceral, opinativo
   - Frases CURTAS (máx 15-20 palavras) — otimizado pra TTS
   - Use vírgulas, pontos e reticências para pausas naturais
   - Tags de emoção Fish Audio: `[excited]`, `[angry]`, `[calm]`, `[whisper]`
   - Nomes estrangeiros: escreva como se lê ("Ronaldíniu", "Mêmfis Depái")
   - NÃO use "x" pra placares — escreva "a" (ex: "3 a 1")
   - Cada item deve mencionar: rank, adversário/competição, e o que acontece no clipe

4. Mostre ao usuário:
   - Lista de clipes com timestamps
   - Roteiro completo (intro + items + cta) com emoções
   - Título e descrição YouTube
   - Peça aprovação

### Fase 3: Salvar e Renderizar (mecânica)

5. Crie o diretório `generated/compilation-shorts/{slug}/`

6. Salve `compilation.json`:
   ```json
   {
     "slug": "top5-gols-ronaldinho",
     "title": "Top 5 gols mais bonitos do Ronaldinho Gaúcho",
     "category": "curiosidades",
     "clips": [
       {
         "rank": 5,
         "source": "/path/to/video.mp4",
         "start": "1:23",
         "end": "1:35",
         "label": "Atlético-MG vs Santos, 2012",
         "context": "Gol de falta por cima da barreira"
       }
     ],
     "segments": [
       { "key": "intro", "text": "[excited] Ô meu amigo..." },
       { "key": "item-5", "text": "[excited] Número cinco!..." },
       { "key": "cta", "text": "Concorda com o ranking?..." }
     ]
   }
   ```

7. Execute o render:
   ```bash
   node scripts/render-compilation-short.js generated/compilation-shorts/{slug}/compilation.json --tts-provider fish --fish-voice 0865d7b8e1c2458bac16a7ad1179a4c5
   ```

8. Mostre o resultado (path do vídeo, duração).

9. Se o usuário quiser publicar:
   ```bash
   node scripts/upload-youtube-short.js {slug} --privacy public --thumbnail auto --title "{título}" --description "{descrição}"
   ```

## Notas

- Os clipes são cortados automaticamente pelo script com ffmpeg
- O áudio original dos clipes é REMOVIDO — só fica a narração
- Cada clipe é redimensionado pra 1080x1920 (vertical) com crop center
- A duração de cada clipe no vídeo final é determinada pela narração (TTS) — não pelo tamanho do clipe original
- Se o clipe original for mais curto que a narração, ele faz loop
- Se for mais longo, é truncado
