---
name: short
description: Gera roteiro de narração para YouTube Shorts a partir de um artigo do portal ou de um tema livre (sem artigo). Cria o texto com emoções e interjeições, mostra pro usuário aprovar, salva em narration.txt e depois roda o render+upload mecânico. Suporta MiniMax e Fish Audio TTS. Suporta vídeo de fundo (--bg-video) no lugar de imagem estática.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
argument-hint: [slug-ou-latest] [formato]
---

# Gerador de YouTube Shorts — Beira do Campo

Gere um roteiro de narração para short e depois renderize o vídeo.

## Argumentos

- `$ARGUMENTS[0]`: slug do artigo, "latest", ou slug livre para vídeos sem artigo (default: latest)
- `$ARGUMENTS[1]`: formato visual — clean, split, pulse, stacked, ticker, poster (default: clean)

## Fluxo

### Fase 1: Roteiro (criativa — com aprovação do usuário)

1. Resolva o slug e a fonte de conteúdo:
   - Se `$ARGUMENTS[0]` for "latest" ou vazio, descubra o artigo mais recente em `content/articles/` (ordene por data no frontmatter, pegue o mais recente que não seja draft)
   - Caso contrário, tente usar o slug fornecido como artigo em `content/articles/{slug}.mdx`
   - **Modo sem artigo**: Se não existir artigo com esse slug, pergunte ao usuário o tema/contexto e crie o roteiro com base nisso. Nesse caso, o slug será usado apenas como identificador do vídeo.

2. Leia o artigo completo (se existir) ou use o contexto fornecido pelo usuário

3. Gere o roteiro de narração adequado ao formato:
   - **clean/split/pulse/stacked/ticker/poster**: Narração curta (60-90 palavras) no estilo mesa-redonda

4. Regras para TODOS os roteiros:

   **Tom e estilo:**
   - **Comentarista de mesa-redonda brasileira** — direto, opinativo, sem papas na língua, visceral
   - Fala PARA o espectador como se estivesse numa conversa ("Ô meu amigo", "eu vou te falar", "presta atenção")
   - Usa expressões fortes: "inadmissível", "absurdo", "coitado", "isso é vergonha"
   - Toma partido, dá opinião, não fica em cima do muro — mesmo em notícias factuais
   - Linguagem coloquial e apaixonada, como torcedor que entende de bola
   - Pode usar hipérbole e dramatização controlada para engajar
   - NÃO mencione o nome de nenhum comentarista real (Neto, Casagrande, etc.)
   - Comece com gancho que prende nos primeiros 3 segundos (interpelação direta ao espectador)
   - Termine com CTA curto: "Matéria completa no site. Siga o canal!"
   - Escreva APENAS a narração, sem títulos ou instruções

   **Otimização para TTS (CRÍTICO — o texto vai direto pro gerador de voz):**
   - Frases CURTAS. Máximo 15-20 palavras por frase. Quebre frases longas com ponto final.
   - Use vírgulas generosamente — cada vírgula gera uma micro-pausa natural no áudio
   - Use ponto final entre ideias — gera pausa maior que vírgula
   - Use reticências "..." para pausas dramáticas antes de revelações
   - Use "—" (travessão) para pausas de respiração no meio da frase
   - NÃO escreva blocos longos sem pontuação — o TTS vai falar tudo corrido e fica robótico
   - NÃO use abreviações numéricas (escreva "primeiro" em vez de "1º")
   - NÃO use "x" para placares — escreva "a" (ex: "2 a 1")
   - NÃO use "R$" — escreva por extenso ("3 milhões de reais")
   - NÃO use asteriscos, markdown ou formatação
   - NÃO use parênteses para informação complementar — quebre em frase separada
   - Números por extenso quando possíveis (mas "16 gols" tá ok, não precisa "dezesseis")
   - Nomes estrangeiros: escreva como se lê em português (ex: "Mêmfis Depái" em vez de "Memphis Depay")

   **Exemplo de roteiro BEM formatado para TTS:**
   ```
   [excited] Ô meu amigo, presta atenção! O Cruzeiro tá na lanterna. Zero vitórias, quatro derrotas, dezesseis gols sofridos. [angry] É a pior defesa da Série A! E o dado mais assustador... desde 2003, todos os times nessa situação foram rebaixados. Todos! [sad] Paysandu, Avaí, Coritiba — caíram. [calm] Agora, Artur Jorge assume a missão. Vai salvar a Raposa? Matéria completa no site. Siga o canal!
   ```

   **Exemplo de roteiro MAL formatado (NÃO fazer):**
   ```
   Cruzeiro em alerta máximo porque a Raposa chegou à sétima rodada do Brasileirão com zero vitórias e quatro derrotas e dezesseis gols sofridos sendo a pior defesa da Série A e o dado mais assustador é que desde 2003 todos os times que chegaram a esse ponto com os mesmos números foram rebaixados como Paysandu Avaí e Coritiba que todos caíram
   ```

5. **TTS Provider**: O default é **Fish Audio**. Se o usuário pedir MiniMax, usar `--tts-provider minimax`.

   **Fish Audio (DEFAULT) — controle de voz** (inline no texto, modelo S2-Pro):
   - Voz padrão (voz diego): `0865d7b8e1c2458bac16a7ad1179a4c5`
   - **Emoções** via tags `[colchetes]`: `[excited]`, `[whisper]`, `[sad]`, `[angry]`, `[calm]`, `[nervous]`
   - Aceita descrições naturais: `[whispering softly]`, `[shouting with excitement]`, `[professional news anchor]`
   - Use 2-4 tags de emoção por roteiro, variando conforme o assunto
   - Combine a tag com o momento: `[angry]` pra polêmica, `[excited]` pra gol/virada, `[calm]` pra análise fria
   - **Pausas**: Fish Audio NÃO tem tags de pausa — use pontuação natural:
     - Vírgula (,) = micro-pausa
     - Ponto (.) = pausa curta
     - Reticências (...) = pausa dramática
     - Travessão (—) = pausa de respiração

   **MiniMax (alternativo) — emoções** (param `--emotion`):
   - `happy` — gols, vitórias, comemorações
   - `sad` — derrotas, lesões, despedidas
   - `angry` — polêmicas, arbitragem, injustiças
   - `fearful` — tensão, decisão, risco de rebaixamento
   - `surprised` — viradas, zebras, números chocantes
   - `neutral` — análises, transições, dados frios
   - `disgusted` — escândalos, situações revoltantes
   - Interjeições: `(laughs)`, `(sighs)`, `(gasps)`, `(clears throat)`, `(sniffs)`, `(groans)`
   - Pausas: `<#0.15#>` (curta) ou `<#0.3#>` (longa)

   **Regras de emoções/tags (ambos providers)**:
   - Use no MÁXIMO 2-4 tags/interjeições por roteiro
   - Tags vão no INÍCIO ou MEIO da frase, NUNCA no final
   - Varie as emoções ao longo do roteiro para manter dinâmico

7. **Vídeo de fundo (opcional)**: Suporta 1 ou MÚLTIPLOS vídeos. Se o usuário fornecer URLs do YouTube ou caminhos locais:
   - Baixe cada vídeo com `yt-dlp` (se URL do YouTube): `yt-dlp -f "bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[height<=1080]" --merge-output-format mp4 -o "/tmp/{slug}-source-{N}.mp4" "URL"`
   - Corte cada trecho com `ffmpeg`: `ffmpeg -y -ss {inicio} -i /tmp/{slug}-source-{N}.mp4 -t {duracao} -c copy generated/remotion-shorts/{slug}/bg-video-{N}.mp4`
   - A duração total dos cortes deve cobrir a narração (~60-70s para ter margem)
   - Pergunte ao usuário o ponto de início de cada vídeo se não foi especificado
   - Passe múltiplos `--bg-video` na linha de comando: `--bg-video clip1.mp4 --bg-video clip2.mp4`
   - O render script concatena automaticamente com ffmpeg antes de passar pro Remotion

8. **Título e descrição para YouTube**: Gere junto com o roteiro:
   - **Título**: Curto (max 70 chars), chamativo, com gancho emocional. Estilo "notícia urgente" para shorts. Pode usar emoji no início (1 no máximo). NÃO repita o título do artigo — crie algo novo e mais atraente.
   - **Descrição**: 2-3 linhas com contexto + link do artigo (se existir) + hashtags. Formato:
     ```
     {frase de contexto curta}

     Leia a matéria completa:
     https://beiradocampo.com.br/{slug}

     #futebol #brasileirao #tag1 #tag2
     ```
   - Se não houver artigo, omita o link "Leia a matéria completa"

8. Mostre ao usuário:
   - O roteiro completo (com interjeições e pausas)
   - A emoção escolhida e por quê
   - O título e descrição do YouTube
   - Contagem de palavras
   - Peça aprovação. Se o usuário pedir ajustes, refine até ele aprovar.

### Fase 2: Renderizar (após aprovação do roteiro)

9. Após aprovação do roteiro, salve:
   - Crie o diretório `generated/remotion-shorts/{slug}/` se não existir
   - Salve em `generated/remotion-shorts/{slug}/narration.txt`

10. Execute APENAS o render (SEM upload):

    **Com artigo (padrão):**
    ```bash
    node scripts/render-remotion-short.js {slug} --format {formato} --narration-file generated/remotion-shorts/{slug}/narration.txt --tts-provider fish --fish-voice 0865d7b8e1c2458bac16a7ad1179a4c5 --speed 1.0
    ```

    **Sem artigo:**
    ```bash
    node scripts/render-remotion-short.js {slug} --format {formato} --title "{título}" --excerpt "{excerpt}" --category "{categoria}" --narration-file generated/remotion-shorts/{slug}/narration.txt --tts-provider fish --fish-voice 0865d7b8e1c2458bac16a7ad1179a4c5 --speed 1.0
    ```

    **Com vídeo de fundo (qualquer modo):**
    Adicione `--bg-video generated/remotion-shorts/{slug}/bg-video.mp4` ao comando.

11. Abra o vídeo renderizado para o usuário assistir:
    ```bash
    open "generated/remotion-shorts/{slug}/{slug}-{formato}-remotion.mp4"
    ```

12. Mostre duração e pergunte: "Ficou bom? Quer ajustar algo ou posso publicar?"

### Fase 3: Upload (SOMENTE após aprovação do vídeo)

13. **Só execute o upload quando o usuário explicitamente aprovar o vídeo.**
    ```bash
    node scripts/upload-youtube-short.js {slug} --format {formato} --privacy public --thumbnail auto --title "{título}" --description "{descrição}"
    ```

14. Mostre a URL do YouTube após o upload.

**IMPORTANTE**: NUNCA pule a fase 3. Sempre espere o usuário assistir e aprovar antes de fazer upload.

## Notas

- Este skill dá controle manual sobre o roteiro, título e descrição antes de gastar TTS/render
- **Fish Audio (default)**: emoção via tags `[excited]` inline no texto
- **MiniMax (alternativo)**: emoção via `--emotion`, interjeições `(gasps)` e pausas `<#0.15#>` inline
- O título e descrição passados via --title/--description sobrescrevem os defaults automáticos do upload script
- **Modo sem artigo**: quando não existe MDX, use `--title`, `--excerpt`, `--category` no render script
- **Vídeo de fundo**: use `--bg-video` para substituir a imagem estática — funciona com ou sem artigo
- **Só render**: use `render-remotion-short.js` em vez de `publish-youtube-short.js` quando o usuário não quer publicar
