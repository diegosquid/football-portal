#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const http = require("http");
const {URL} = require("url");
require("dotenv").config({path: path.resolve(__dirname, "../.env.local")});

const {PROJECT_DIR, SITE_NAME, SITE_URL, getLatestArticleSlug, loadArticle, ensureDir} = require("./lib/short-video-data");

const GENERATED_ROOT = path.join(PROJECT_DIR, "generated", "remotion-shorts");
const DEFAULT_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || "http://127.0.0.1:4815/oauth2callback";
const DEFAULT_TOKEN_PATH = path.join(PROJECT_DIR, "generated", "youtube", "oauth-token.json");
const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const YOUTUBE_UPLOAD_BASE = "https://www.googleapis.com/upload/youtube/v3";
const DEFAULT_CATEGORY_ID = "17";

function parseArgs(argv) {
  const args = {
    slug: null,
    latest: false,
    format: null,
    video: null,
    title: null,
    description: null,
    tags: null,
    privacy: "private",
    madeForKids: false,
    publishAt: null,
    playlistId: null,
    thumbnail: null,
    tokenFile: DEFAULT_TOKEN_PATH,
    categoryId: DEFAULT_CATEGORY_ID,
    notifySubscribers: true,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--latest") {
      args.latest = true;
    } else if (arg === "--format") {
      args.format = argv[++index];
    } else if (arg === "--video") {
      args.video = argv[++index];
    } else if (arg === "--title") {
      args.title = argv[++index];
    } else if (arg === "--description") {
      args.description = argv[++index];
    } else if (arg === "--tags") {
      args.tags = argv[++index];
    } else if (arg === "--privacy") {
      args.privacy = argv[++index];
    } else if (arg === "--made-for-kids") {
      args.madeForKids = true;
    } else if (arg === "--publish-at") {
      args.publishAt = argv[++index];
    } else if (arg === "--playlist-id") {
      args.playlistId = argv[++index];
    } else if (arg === "--thumbnail") {
      args.thumbnail = argv[++index];
    } else if (arg === "--token-file") {
      args.tokenFile = argv[++index];
    } else if (arg === "--category-id") {
      args.categoryId = argv[++index];
    } else if (arg === "--no-notify-subscribers") {
      args.notifySubscribers = false;
    } else if (!arg.startsWith("--") && !args.slug) {
      args.slug = arg;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function normalizeTag(tag) {
  return String(tag || "")
    .replace(/^#/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function buildDefaultTags(article) {
  return uniq([
    SITE_NAME,
    article.data.category,
    ...(Array.isArray(article.data.teams) ? article.data.teams : []),
    ...(Array.isArray(article.data.tags) ? article.data.tags : []),
  ])
    .map(normalizeTag)
    .filter(Boolean)
    .slice(0, 15);
}

function buildDefaultDescription(article) {
  const excerpt = String(article.data.excerpt || "").trim();
  const lines = [];
  if (excerpt) lines.push(excerpt);
  lines.push("");
  lines.push("Leia a matéria completa no site:");
  lines.push(`https://${SITE_URL}/${article.slug}`);
  return lines.join("\n");
}

function formatHashtags(tags) {
  return tags
    .map((tag) => String(tag || "").trim())
    .filter(Boolean)
    .map((tag) => `#${tag.replace(/\s+/g, "")}`)
    .join(" ");
}

function buildDescriptionWithHashtags(description, tags) {
  const hashtagLine = formatHashtags(tags);
  if (!hashtagLine) return String(description || "").trim();
  const base = String(description || "").trim();
  return [base, "", hashtagLine].filter(Boolean).join("\n");
}

function parseTags(rawTags, article) {
  if (!rawTags) return buildDefaultTags(article);
  return uniq(
    String(rawTags)
      .split(",")
      .map((item) => normalizeTag(item))
      .filter(Boolean)
  ).slice(0, 15);
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolveSlug(args) {
  return args.slug || (args.latest ? getLatestArticleSlug() : getLatestArticleSlug());
}

function resolveOutputDir(slug) {
  return path.join(GENERATED_ROOT, slug);
}

function resolveVideoPath({outputDir, slug, format, explicitVideo}) {
  if (explicitVideo) {
    const resolved = path.resolve(explicitVideo);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Video not found: ${resolved}`);
    }
    return resolved;
  }

  if (format) {
    const candidate = path.join(outputDir, `${slug}-${format}-remotion.mp4`);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const manifestPath = path.join(outputDir, "manifest.json");
  const manifest = readJsonIfExists(manifestPath);
  if (manifest?.videoPath && fs.existsSync(manifest.videoPath)) {
    return manifest.videoPath;
  }

  const files = fs.readdirSync(outputDir).filter((file) => file.endsWith(".mp4"));
  if (files.length === 1) {
    return path.join(outputDir, files[0]);
  }

  if (files.length > 1) {
    files.sort((a, b) => fs.statSync(path.join(outputDir, b)).mtimeMs - fs.statSync(path.join(outputDir, a)).mtimeMs);
    return path.join(outputDir, files[0]);
  }

  throw new Error(`No MP4 found in ${outputDir}. Render the short first or pass --video.`);
}

function resolveThumbnailPath(args, outputDir, manifest) {
  if (!args.thumbnail) return null;
  if (args.thumbnail === "auto") {
    if (manifest?.imagePath && fs.existsSync(manifest.imagePath)) {
      return manifest.imagePath;
    }
    return null;
  }

  const resolved = path.resolve(args.thumbnail);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Thumbnail not found: ${resolved}`);
  }
  return resolved;
}

function ensureYoutubeEnv() {
  const required = ["YOUTUBE_CLIENT_ID"];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing YouTube OAuth env vars: ${missing.join(", ")}`);
  }
}

async function exchangeCodeForToken({code, redirectUri}) {
  const body = new URLSearchParams({
    code,
    client_id: process.env.YOUTUBE_CLIENT_ID,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  if (process.env.YOUTUBE_CLIENT_SECRET) {
    body.set("client_secret", process.env.YOUTUBE_CLIENT_SECRET);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Token exchange failed: ${JSON.stringify(json)}`);
  }

  return normalizeToken(json);
}

async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    client_id: process.env.YOUTUBE_CLIENT_ID,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  if (process.env.YOUTUBE_CLIENT_SECRET) {
    body.set("client_secret", process.env.YOUTUBE_CLIENT_SECRET);
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {"Content-Type": "application/x-www-form-urlencoded"},
    body,
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Token refresh failed: ${JSON.stringify(json)}`);
  }

  return normalizeToken(json, refreshToken);
}

function normalizeToken(token, fallbackRefreshToken = null) {
  const expiresInMs = Number(token.expires_in || 0) * 1000;
  return {
    access_token: token.access_token,
    refresh_token: token.refresh_token || fallbackRefreshToken || null,
    scope: token.scope || YOUTUBE_UPLOAD_SCOPE,
    token_type: token.token_type || "Bearer",
    expiry_date: Date.now() + expiresInMs,
  };
}

function writeTokenFile(tokenPath, token) {
  ensureDir(path.dirname(tokenPath));
  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
}

function readTokenFile(tokenPath) {
  return readJsonIfExists(tokenPath);
}

function tokenIsValid(token) {
  return Boolean(token?.access_token && token?.expiry_date && token.expiry_date > Date.now() + 60_000);
}

function createOAuthUrl({redirectUri, state}) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", process.env.YOUTUBE_CLIENT_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", YOUTUBE_UPLOAD_SCOPE);
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);
  return url.toString();
}

async function waitForOAuthCode(redirectUri) {
  const redirect = new URL(redirectUri);
  if (!["127.0.0.1", "localhost"].includes(redirect.hostname)) {
    throw new Error("Automatic OAuth flow only supports localhost redirect URIs.");
  }

  const state = Math.random().toString(36).slice(2);
  const authUrl = createOAuthUrl({redirectUri, state});

  process.stdout.write("\nAbra esta URL no navegador e autorize o acesso ao canal:\n");
  process.stdout.write(`${authUrl}\n\n`);

  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const reqUrl = new URL(req.url, redirectUri);
      if (reqUrl.pathname !== redirect.pathname) {
        res.statusCode = 404;
        res.end("Not found");
        return;
      }

      const code = reqUrl.searchParams.get("code");
      const returnedState = reqUrl.searchParams.get("state");
      const error = reqUrl.searchParams.get("error");

      if (error) {
        res.statusCode = 400;
        res.end("Autorização recusada. Você pode fechar esta janela.");
        server.close(() => reject(new Error(`OAuth error: ${error}`)));
        return;
      }

      if (!code || returnedState !== state) {
        res.statusCode = 400;
        res.end("Resposta inválida. Você pode fechar esta janela.");
        server.close(() => reject(new Error("Invalid OAuth callback.")));
        return;
      }

      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end("<html><body style=\"font-family:sans-serif;padding:24px\">Autorização concluída. Pode fechar esta aba.</body></html>");
      server.close(() => resolve(code));
    });

    server.listen(Number(redirect.port || 80), redirect.hostname, () => {
      process.stdout.write(`Aguardando callback OAuth em ${redirectUri}...\n`);
    });

    server.on("error", (error) => reject(error));
  });
}

async function getAccessToken(tokenPath) {
  ensureYoutubeEnv();
  const redirectUri = DEFAULT_REDIRECT_URI;
  let token = readTokenFile(tokenPath);

  if (tokenIsValid(token)) {
    return token;
  }

  if (token?.refresh_token) {
    token = await refreshAccessToken(token.refresh_token);
    writeTokenFile(tokenPath, token);
    return token;
  }

  const code = await waitForOAuthCode(redirectUri);
  token = await exchangeCodeForToken({code, redirectUri});

  if (!token.refresh_token) {
    throw new Error("Google não retornou refresh_token. Revogue o acesso e autorize novamente com prompt=consent.");
  }

  writeTokenFile(tokenPath, token);
  return token;
}

async function createResumableUploadSession({accessToken, metadata, videoPath, notifySubscribers}) {
  const stat = fs.statSync(videoPath);
  const response = await fetch(
    `${YOUTUBE_UPLOAD_BASE}/videos?part=snippet,status${notifySubscribers ? "" : "&notifySubscribers=false"}&uploadType=resumable`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json; charset=UTF-8",
        "X-Upload-Content-Length": String(stat.size),
        "X-Upload-Content-Type": "video/mp4",
      },
      body: JSON.stringify(metadata),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to start resumable upload: ${text}`);
  }

  const location = response.headers.get("location");
  if (!location) {
    throw new Error("YouTube did not return resumable upload location.");
  }

  return location;
}

async function uploadVideoBinary({uploadUrl, accessToken, videoPath}) {
  const stat = fs.statSync(videoPath);
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Length": String(stat.size),
      "Content-Type": "video/mp4",
    },
    body: fs.createReadStream(videoPath),
    duplex: "half",
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(`Video upload failed: ${JSON.stringify(json)}`);
  }

  return json;
}

async function uploadThumbnail({accessToken, videoId, thumbnailPath}) {
  const stat = fs.statSync(thumbnailPath);
  const ext = path.extname(thumbnailPath).toLowerCase();
  const contentType = ext === ".png" ? "image/png" : "image/jpeg";
  const response = await fetch(`${YOUTUBE_UPLOAD_BASE}/thumbnails/set?videoId=${encodeURIComponent(videoId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
    },
    body: fs.createReadStream(thumbnailPath),
    duplex: "half",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Thumbnail upload failed: ${text}`);
  }

  return response.json();
}

async function addVideoToPlaylist({accessToken, videoId, playlistId}) {
  const response = await fetch(`${YOUTUBE_API_BASE}/playlistItems?part=snippet`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json; charset=UTF-8",
    },
    body: JSON.stringify({
      snippet: {
        playlistId,
        resourceId: {
          kind: "youtube#video",
          videoId,
        },
      },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Playlist insert failed: ${text}`);
  }

  return response.json();
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = resolveSlug(args);
  const article = loadArticle(slug);
  const outputDir = resolveOutputDir(slug);
  const manifestPath = path.join(outputDir, "manifest.json");
  const manifest = readJsonIfExists(manifestPath);
  const videoPath = resolveVideoPath({
    outputDir,
    slug,
    format: args.format,
    explicitVideo: args.video,
  });

  const token = await getAccessToken(path.resolve(args.tokenFile));
  const title = String(args.title || article.data.title || "").trim();
  const tags = parseTags(args.tags, article);
  const description = buildDescriptionWithHashtags(
    String(args.description || buildDefaultDescription(article)).trim(),
    tags
  );
  const thumbnailPath = resolveThumbnailPath(args, outputDir, manifest);

  if (!title) {
    throw new Error("Video title is empty. Pass --title or set title in the article.");
  }

  if (!["private", "public", "unlisted"].includes(String(args.privacy))) {
    throw new Error("Invalid --privacy. Use private, public or unlisted.");
  }

  const metadata = {
    snippet: {
      title,
      description,
      tags,
      categoryId: String(args.categoryId || DEFAULT_CATEGORY_ID),
    },
    status: {
      privacyStatus: String(args.privacy),
      selfDeclaredMadeForKids: Boolean(args.madeForKids),
    },
  };

  if (args.publishAt) {
    metadata.status.publishAt = new Date(args.publishAt).toISOString();
    metadata.status.privacyStatus = "private";
  }

  const uploadUrl = await createResumableUploadSession({
    accessToken: token.access_token,
    metadata,
    videoPath,
    notifySubscribers: args.notifySubscribers,
  });

  const uploadResult = await uploadVideoBinary({
    uploadUrl,
    accessToken: token.access_token,
    videoPath,
  });

  let thumbnailResult = null;
  if (thumbnailPath) {
    thumbnailResult = await uploadThumbnail({
      accessToken: token.access_token,
      videoId: uploadResult.id,
      thumbnailPath,
    });
  }

  let playlistResult = null;
  if (args.playlistId) {
    playlistResult = await addVideoToPlaylist({
      accessToken: token.access_token,
      videoId: uploadResult.id,
      playlistId: args.playlistId,
    });
  }

  const youtubeManifest = {
    slug,
    uploadedAt: new Date().toISOString(),
    videoId: uploadResult.id,
    youtubeUrl: `https://www.youtube.com/watch?v=${uploadResult.id}`,
    uploadPrivacy: metadata.status.privacyStatus,
    title,
    description,
    tags,
    videoPath,
    thumbnailPath,
    articlePath: article.path,
    sourceManifestPath: manifestPath,
    response: uploadResult,
    thumbnailResult,
    playlistResult,
  };

  const uploadManifestPath = path.join(outputDir, "youtube-upload.json");
  fs.writeFileSync(uploadManifestPath, JSON.stringify(youtubeManifest, null, 2));
  process.stdout.write(`${JSON.stringify(youtubeManifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
