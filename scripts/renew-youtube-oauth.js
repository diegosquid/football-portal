#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const http = require("http");
const {URL} = require("url");
require("dotenv").config({path: path.resolve(__dirname, "../.env.local")});

const PROJECT_DIR = path.resolve(__dirname, "..");
const DEFAULT_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || "http://127.0.0.1:4815/oauth2callback";
const DEFAULT_TOKEN_PATH = path.join(PROJECT_DIR, "generated", "youtube", "oauth-token.json");
const YOUTUBE_UPLOAD_SCOPE = "https://www.googleapis.com/auth/youtube.upload";

function ensureDir(p) {
  fs.mkdirSync(p, {recursive: true});
}

function ensureEnv() {
  if (!process.env.YOUTUBE_CLIENT_ID) {
    throw new Error("YOUTUBE_CLIENT_ID não está definido em .env.local");
  }
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

function waitForOAuthCode(redirectUri) {
  const redirect = new URL(redirectUri);
  if (!["127.0.0.1", "localhost"].includes(redirect.hostname)) {
    throw new Error("Fluxo automático suporta apenas redirect URIs em localhost.");
  }

  const state = Math.random().toString(36).slice(2);
  const authUrl = createOAuthUrl({redirectUri, state});

  process.stdout.write("\nAbra esta URL no navegador e autorize o canal do YouTube:\n");
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
        res.end("Autorização recusada. Pode fechar esta aba.");
        server.close(() => reject(new Error(`OAuth error: ${error}`)));
        return;
      }
      if (!code || returnedState !== state) {
        res.statusCode = 400;
        res.end("Resposta inválida. Pode fechar esta aba.");
        server.close(() => reject(new Error("Invalid OAuth callback.")));
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end("<html><body style=\"font-family:sans-serif;padding:24px\">Token renovado. Pode fechar esta aba.</body></html>");
      server.close(() => resolve(code));
    });
    server.listen(Number(redirect.port || 80), redirect.hostname, () => {
      process.stdout.write(`Aguardando callback OAuth em ${redirectUri}...\n`);
    });
    server.on("error", reject);
  });
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
  const expiresInMs = Number(json.expires_in || 0) * 1000;
  return {
    access_token: json.access_token,
    refresh_token: json.refresh_token || null,
    scope: json.scope || YOUTUBE_UPLOAD_SCOPE,
    token_type: json.token_type || "Bearer",
    expiry_date: expiresInMs ? Date.now() + expiresInMs : null,
  };
}

async function main() {
  ensureEnv();
  const tokenPath = DEFAULT_TOKEN_PATH;
  ensureDir(path.dirname(tokenPath));

  if (fs.existsSync(tokenPath)) {
    const backup = `${tokenPath}.${Date.now()}.bak`;
    fs.copyFileSync(tokenPath, backup);
    process.stdout.write(`Backup do token anterior em: ${backup}\n`);
  }

  const code = await waitForOAuthCode(DEFAULT_REDIRECT_URI);
  const token = await exchangeCodeForToken({code, redirectUri: DEFAULT_REDIRECT_URI});

  if (!token.refresh_token) {
    throw new Error("Google não retornou refresh_token. Revogue o acesso em https://myaccount.google.com/permissions e tente novamente.");
  }

  fs.writeFileSync(tokenPath, JSON.stringify(token, null, 2));
  process.stdout.write(`\nNovo token salvo em: ${tokenPath}\n`);
  if (token.expiry_date) {
    process.stdout.write(`Expira em: ${new Date(token.expiry_date).toISOString()}\n`);
  }
}

main().catch((err) => {
  process.stderr.write(`\n${err.message || err}\n`);
  process.exit(1);
});
