# Upload de Shorts no YouTube

Fluxo separado do editorial e da renderização.

O script faz:

- autenticação OAuth 2.0 com Google;
- salva `refresh_token` localmente;
- sobe o MP4 do short no YouTube;
- opcionalmente envia thumbnail;
- opcionalmente adiciona o vídeo a uma playlist.

## Arquivo principal

- `scripts/upload-youtube-short.js`

## Credenciais necessárias

No Google Cloud, você precisa:

1. criar um projeto;
2. habilitar a **YouTube Data API v3**;
3. configurar a **OAuth consent screen**;
4. criar um **OAuth Client ID** do tipo **Desktop app** ou **Web application**;
5. se usar `Web application`, cadastrar o redirect:
   - `http://127.0.0.1:4815/oauth2callback`

## Variáveis no `.env.local`

```bash
YOUTUBE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=seu-client-secret # opcional para alguns tipos de client
YOUTUBE_REDIRECT_URI=http://127.0.0.1:4815/oauth2callback
```

## Onde o token fica salvo

Por padrão:

`generated/youtube/oauth-token.json`

Esse arquivo guarda `access_token` e `refresh_token`.

## Primeiro uso

```bash
npm run youtube:upload -- --latest
```

O script:

- imprime uma URL;
- você abre no navegador;
- autoriza o canal;
- o callback local captura o `code`;
- o token é salvo;
- o upload acontece.

## Exemplos

### Render + upload em um comando só

```bash
npm run short:publish -- --latest --format clean
```

Com parâmetros de upload:

```bash
npm run short:publish -- --latest --format split --privacy unlisted --thumbnail auto
```

### Upload do último short renderizado

```bash
npm run youtube:upload -- --latest
```

### Upload de uma matéria específica

```bash
npm run youtube:upload -- celta-vigo-1x2-real-madrid-valverde-laliga-2026
```

### Escolher formato específico

```bash
npm run youtube:upload -- --latest --format split
```

### Definir título, descrição e tags

```bash
npm run youtube:upload -- --latest \
  --title "Fluminense x Flamengo: final única decide o Carioca 2026" \
  --description "Resumo da final e contexto completo no site." \
  --tags "Fluminense, Flamengo, FlaFlu, Carioca 2026"
```

As tags também são incluídas no fim da descrição como hashtags.

### Upload não listado

```bash
npm run youtube:upload -- --latest --privacy unlisted
```

### Enviar thumbnail usando a imagem do artigo

```bash
npm run youtube:upload -- --latest --thumbnail auto
```

### Adicionar em playlist

```bash
npm run youtube:upload -- --latest --playlist-id SEU_PLAYLIST_ID
```

## Saída

Após upload, o script grava:

- `generated/remotion-shorts/<slug>/youtube-upload.json`

Esse arquivo registra:

- `videoId`
- `youtubeUrl`
- `title`
- `description`
- `tags`
- `videoPath`
- `thumbnailPath`

## Observações

- `publishAt` agenda o vídeo e força `privacyStatus=private`;
- categoria padrão enviada ao YouTube: `17` (Sports);
- o script usa o MP4 gerado em `generated/remotion-shorts/<slug>/`.
