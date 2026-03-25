---
name: short
description: Gera roteiro de narração para YouTube Shorts a partir de um artigo do portal. Cria o texto com emoções e interjeições, mostra pro usuário aprovar, salva em narration.txt e depois roda o render+upload mecânico. Suporta MiniMax e Fish Audio TTS.
user-invocable: true
allowed-tools: Read, Grep, Glob, Bash, Edit, Write
argument-hint: [slug-ou-latest] [formato]
---

# Gerador de YouTube Shorts — Beira do Campo

Gere um roteiro de narração para short e depois renderize o vídeo.

## Argumentos

- `$ARGUMENTS[0]`: slug do artigo ou "latest" (default: latest)
- `$ARGUMENTS[1]`: formato visual — clean, split, pulse, stacked, ticker, poster (default: clean)

## Fluxo

### Fase 1: Roteiro (criativa — com aprovação do usuário)

1. Resolva o slug:
   - Se `$ARGUMENTS[0]` for "latest" ou vazio, descubra o artigo mais recente em `content/articles/` (ordene por data no frontmatter, pegue o mais recente que não seja draft)
   - Caso contrário, use o slug fornecido

2. Leia o artigo completo em `content/articles/{slug}.mdx`

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
   - Voz padrão: `16a44fcd0a404937bdc18160ce998619`
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

7. **Título e descrição para YouTube**: Gere junto com o roteiro:
   - **Título**: Curto (max 70 chars), chamativo, com gancho emocional. Estilo "notícia urgente" para shorts. Pode usar emoji no início (1 no máximo). NÃO repita o título do artigo — crie algo novo e mais atraente.
   - **Descrição**: 2-3 linhas com contexto + link do artigo + hashtags. Formato:
     ```
     {frase de contexto curta}

     Leia a matéria completa:
     https://beiradocampo.com.br/{slug}

     #futebol #brasileirao #tag1 #tag2
     ```

8. Mostre ao usuário:
   - O roteiro completo (com interjeições e pausas)
   - A emoção escolhida e por quê
   - O título e descrição do YouTube
   - Contagem de palavras
   - Peça aprovação. Se o usuário pedir ajustes, refine até ele aprovar.

### Fase 2: Salvar, Renderizar e Upload (mecânica — sem intervenção)

9. Após aprovação, salve o roteiro:
   - Crie o diretório `generated/remotion-shorts/{slug}/` se não existir
   - Salve em `generated/remotion-shorts/{slug}/narration.txt`

10. Execute o render + upload com o publish script:

    **Fish Audio (default — Craque Neto):**
    ```bash
    node scripts/publish-youtube-short.js {slug} --format {formato} --narration-file generated/remotion-shorts/{slug}/narration.txt --tts-provider fish --fish-voice 16a44fcd0a404937bdc18160ce998619 --speed 1.0 --privacy public --thumbnail auto --title "{título}" --description "{descrição}"
    ```

    **MiniMax (alternativo):**
    ```bash
    node scripts/publish-youtube-short.js {slug} --format {formato} --narration-file generated/remotion-shorts/{slug}/narration.txt --tts-provider minimax --minimax-voice Portuguese_Jovialman --emotion {emoção-escolhida} --speed 1.15 --privacy public --thumbnail auto --title "{título}" --description "{descrição}"
    ```

11. Mostre o resultado (path do vídeo, duração, URL do YouTube) baseado no manifest e youtube-upload.json gerados.

## Notas

- Este skill dá controle manual sobre o roteiro, título e descrição antes de gastar TTS/render
- **Fish Audio (default)**: emoção via tags `[excited]` inline no texto
- **MiniMax (alternativo)**: emoção via `--emotion`, interjeições `(gasps)` e pausas `<#0.15#>` inline
- O título e descrição passados via --title/--description sobrescrevem os defaults automáticos do upload script
