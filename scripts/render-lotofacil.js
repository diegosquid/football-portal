#!/usr/bin/env node
/**
 * Gera o short "Resultado da Lotofácil" para o Dezeneiro.
 *
 * Reaproveita a engine Remotion + fish.audio do Beira do Campo:
 *   - busca o concurso na API da Caixa (fallback Heroku)
 *   - monta a narração com tags de emoção do fish
 *   - sintetiza voz (synthesizeNarration provider=fish) → narration.m4a
 *   - calcula durationInFrames a partir do áudio
 *   - renderiza a composição LotofacilResultado
 *
 * Uso:
 *   node scripts/render-lotofacil.js [--concurso N] [--fish-voice <id>] [--speed 1.0] [--tts-provider fish]
 *
 * Regra Free/Pro: só entram dados Free (dezenas, premiação, próximo estimado).
 * NUNCA soma/paridade/moldura nem as 25 atrasadas.
 */

const fs = require("fs");
const path = require("path");
const {
  PROJECT_DIR,
  ensureDir,
  run,
  getMediaDuration,
  copyFile,
  synthesizeNarration,
} = require("./lib/short-video-data");

const FPS = 30;
const COMPOSITION_ID = "LotofacilResultado";
const VIDEO_STUDIO_DIR = path.join(PROJECT_DIR, "video-studio");
const GENERATED_ROOT = path.join(PROJECT_DIR, "generated", "lotofacil-shorts");
const DEFAULT_FISH_VOICE = process.env.DEZENEIRO_FISH_VOICE || "0865d7b8e1c2458bac16a7ad1179a4c5";
const SITE_URL = "dezeneiro.com.br";
// Destino final dos entregáveis (.mp4 + capa) — dentro do projeto dezeneiro.
const DEFAULT_DEST = process.env.DEZENEIRO_VIDEO_OUT || "/Users/diegodmacedo/Documents/dezeneiro/videos/lotofacil";

const UA = "Mozilla/5.0 (compatible; DezeneiroBot/1.0; +https://dezeneiro.com.br)";
const HEADERS = {"User-Agent": UA, Referer: "https://dezeneiro.com.br", Accept: "application/json"};

const brl = new Intl.NumberFormat("pt-BR", {style: "currency", currency: "BRL"});

function parseArgs(argv) {
  const a = {concurso: null, fishVoice: DEFAULT_FISH_VOICE, speed: 1.0, ttsProvider: "fish", force: false, dest: DEFAULT_DEST};
  for (let i = 0; i < argv.length; i += 1) {
    const t = argv[i];
    if (t === "--concurso") { a.concurso = parseInt(argv[++i], 10); }
    else if (t === "--fish-voice") { a.fishVoice = argv[++i]; }
    else if (t === "--speed") { a.speed = parseFloat(argv[++i]); }
    else if (t === "--tts-provider") { a.ttsProvider = argv[++i]; }
    else if (t === "--force") { a.force = true; }
    else if (t === "--dest") { a.dest = argv[++i]; }
  }
  return a;
}

function pad2(d) { return String(parseInt(d, 10)).padStart(2, "0"); }

async function fetchJSON(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {headers: HEADERS, signal: ctrl.signal});
    if (!res.ok) throw new Error(`HTTP ${res.status} em ${url}`);
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

function acertosFromDesc(desc) {
  const m = String(desc || "").match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

async function buscarConcurso(numero) {
  const slug = "lotofacil";
  const caixaUrl = numero
    ? `https://servicebus2.caixa.gov.br/portaldeloterias/api/${slug}/${numero}`
    : `https://servicebus2.caixa.gov.br/portaldeloterias/api/${slug}`;
  const herokuUrl = numero
    ? `https://loteriascaixa-api.herokuapp.com/api/${slug}/${numero}`
    : `https://loteriascaixa-api.herokuapp.com/api/${slug}/latest`;

  try {
    const raw = await fetchJSON(caixaUrl);
    return {
      concurso: raw.numero,
      data: raw.dataApuracao,
      dezenas: (raw.listaDezenas || []).map(pad2),
      acumulou: Boolean(raw.acumulado),
      premiacao: (raw.listaRateioPremio || []).map((p) => ({
        acertos: acertosFromDesc(p.descricaoFaixa),
        ganhadores: p.numeroDeGanhadores,
        premio: p.valorPremio,
      })),
      proximoConcurso: raw.numeroConcursoProximo ?? raw.numero + 1,
      proximoEstimado:
        (raw.valorEstimadoProximoConcurso && raw.valorEstimadoProximoConcurso > 0)
          ? raw.valorEstimadoProximoConcurso
          : (raw.valorAcumuladoProximoConcurso || null),
    };
  } catch (err) {
    console.warn(`[caixa] falhou (${err.message}), tentando fallback Heroku...`);
    const raw = await fetchJSON(herokuUrl);
    return {
      concurso: raw.concurso,
      data: raw.data,
      dezenas: (raw.dezenas || []).map(pad2),
      acumulou: Boolean(raw.acumulou),
      premiacao: (raw.premiacoes || []).map((p) => ({
        acertos: acertosFromDesc(p.descricao),
        ganhadores: p.ganhadores,
        premio: p.valorPremio,
      })),
      proximoConcurso: raw.proximoConcurso ?? raw.concurso + 1,
      proximoEstimado: raw.valorEstimadoProximoConcurso ?? null,
    };
  }
}

function dataPorExtenso(dataStr) {
  let y, m, d;
  if (dataStr.includes("/")) {
    [d, m, y] = dataStr.split("/").map(Number);
  } else {
    [y, m, d] = dataStr.split("-").map(Number);
  }
  const dt = new Date(Date.UTC(y, m - 1, d, 12));
  const semana = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];
  const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  return `${semana[dt.getUTCDay()]}, ${d} de ${meses[m - 1]}`;
}

// Forma falada aproximada de um valor em reais (mais natural pro TTS que o número cheio).
function falarValor(n) {
  if (!n || n <= 0) return "zero reais";
  if (n >= 1e6) {
    const mi = Math.round((n / 1e6) * 10) / 10;
    if (mi === 1) return "1 milhão de reais";
    const str = String(mi).replace(".", ",").replace(/,0$/, "");
    return `${str} milhões de reais`;
  }
  if (n >= 1000) {
    return `${Math.round(n / 1000)} mil reais`;
  }
  return `${Math.round(n)} reais`;
}

// Valor compacto pra título (ex: "R$ 2,6 milhões", "R$ 18 mil").
function valorCurto(n) {
  if (!n || n <= 0) return "R$ 0";
  if (n >= 1e6) {
    const mi = Math.round((n / 1e6) * 10) / 10;
    const str = String(mi).replace(".", ",").replace(/,0$/, "");
    return `R$ ${str} ${mi === 1 ? "milhão" : "milhões"}`;
  }
  if (n >= 1000) return `R$ ${Math.round(n / 1000)} mil`;
  return brl.format(n);
}

function dataCurta(dataStr) {
  if (dataStr.includes("/")) { const [d, m] = dataStr.split("/"); return `${d}/${m}`; }
  const [, m, d] = dataStr.split("-"); return `${d}/${m}`;
}

// Título + descrição prontos pra postar (YouTube Shorts / Reels / TikTok / Kwai).
function montarTituloDescricao(c, dataExtenso, dCurta, f15, f14) {
  const acumulou = c.acumulou || !f15 || f15.ganhadores === 0;

  let titulo;
  if (acumulou) {
    titulo = `🍀 Lotofácil ${c.concurso} ACUMULOU! Resultado de ${dCurta} — confira as dezenas`;
  } else {
    const g = f15.ganhadores;
    titulo = `🍀 Resultado Lotofácil Concurso ${c.concurso} (${dCurta}) — ${g} ${g === 1 ? "ganhador" : "ganhadores"} de ${valorCurto(f15.premio)}`;
  }

  const linhasPrem = [];
  if (f15) {
    linhasPrem.push(
      f15.ganhadores === 0
        ? `• 15 acertos: ninguém acertou (acumulou!)`
        : `• 15 acertos: ${f15.ganhadores} ${f15.ganhadores === 1 ? "aposta" : "apostas"} · ${brl.format(f15.premio)}`
    );
  }
  if (f14) linhasPrem.push(`• 14 acertos: ${f14.ganhadores} apostas · ${brl.format(f14.premio)}`);

  const proximoLinha = (c.proximoConcurso && c.proximoEstimado)
    ? `🎯 Próximo concurso (${c.proximoConcurso}): estimativa de ${brl.format(c.proximoEstimado)}`
    : "";

  const descricao = [
    `Resultado da Lotofácil concurso ${c.concurso}, sorteado em ${dCurta} (${dataExtenso.split(",")[0]}).`,
    ``,
    `🔢 Dezenas: ${c.dezenas.join(" - ")}`,
    ``,
    `🏆 Premiação:`,
    ...linhasPrem,
    ...(proximoLinha ? ["", proximoLinha] : []),
    ``,
    `👉 Confira o seu jogo no Dezeneiro: https://dezeneiro.com.br`,
    ``,
    `#lotofacil #resultadolotofacil #lotofacildehoje #loteria #caixa #concurso${c.concurso} #dezeneiro #shorts`,
  ].join("\n");

  return {titulo, descricao};
}

function montarNarracao(c, dataExtenso, f15, proximoEstimado) {
  const dezenasFaladas = c.dezenas.map((d) => String(parseInt(d, 10))).join(", ");
  const linhas = [];
  linhas.push(`[excited] Saiu o resultado da Lotofácil! Concurso ${c.concurso}, de ${dataExtenso}.`);
  linhas.push(`[calm] As quinze dezenas sorteadas foram: ${dezenasFaladas}.`);
  if (c.acumulou || !f15 || f15.ganhadores === 0) {
    linhas.push(`[calm] Ninguém acertou as quinze dezenas. O prêmio acumulou!`);
  } else if (f15.ganhadores === 1) {
    linhas.push(`[happy] Uma aposta acertou as quinze e levou ${falarValor(f15.premio)}!`);
  } else {
    linhas.push(`[happy] ${f15.ganhadores} apostas acertaram as quinze e levaram ${falarValor(f15.premio)} cada!`);
  }
  if (c.proximoConcurso && proximoEstimado) {
    linhas.push(`[excited] O próximo concurso, número ${c.proximoConcurso}, está estimado em ${falarValor(proximoEstimado)}.`);
  }
  linhas.push(`[excited] Confere o seu jogo agora no Dezeneiro. Boa sorte!`);
  return linhas.join(" ");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(`🎰 Buscando concurso ${args.concurso || "(último)"} da Lotofácil...`);
  const c = await buscarConcurso(args.concurso);
  if (!c.dezenas || c.dezenas.length !== 15) {
    throw new Error(`Concurso ${c.concurso} retornou ${c.dezenas?.length || 0} dezenas (esperado 15).`);
  }

  const slug = `lotofacil-${c.concurso}`;
  const dataExtenso = dataPorExtenso(c.data);
  const f15 = c.premiacao.find((p) => p.acertos === 15);
  const f14 = c.premiacao.find((p) => p.acertos === 14);
  const {titulo, descricao} = montarTituloDescricao(c, dataExtenso, dataCurta(c.data), f15, f14);

  console.log(`📋 Concurso ${c.concurso} · ${dataExtenso} · dezenas: ${c.dezenas.join(" ")}`);
  console.log(`   15 acertos: ${f15 ? `${f15.ganhadores} × ${brl.format(f15.premio)}` : "—"} | acumulou: ${c.acumulou}`);

  const outputDir = path.join(GENERATED_ROOT, slug);
  const remotionAssetDir = path.join(VIDEO_STUDIO_DIR, "public", "renders", slug);
  const videoPath = path.join(outputDir, `${slug}-remotion.mp4`);
  // Destino final no projeto dezeneiro.
  const destVideoPath = path.join(args.dest, `${slug}.mp4`);
  const destCapaPath = path.join(args.dest, `${slug}.png`);

  // Idempotência: Lotofácil não sorteia domingo, então "último" se repete.
  // Se o vídeo desse concurso já está no destino, não regera (a não ser com --force).
  if (fs.existsSync(destVideoPath) && !args.force) {
    console.log(`⏭️  Concurso ${c.concurso} já tem vídeo em ${destVideoPath} — nada a fazer.`);
    process.stdout.write(`${JSON.stringify({slug, concurso: c.concurso, skipped: true, destVideoPath}, null, 2)}\n`);
    return;
  }

  ensureDir(outputDir);
  ensureDir(remotionAssetDir);

  // 1) Narração + TTS (fish)
  const narration = montarNarracao(c, dataExtenso, f15, c.proximoEstimado);
  const narrationTextPath = path.join(outputDir, "narration.txt");
  fs.writeFileSync(narrationTextPath, narration);
  console.log(`\n🗣️  Narração (${narration.split(/\s+/).length} palavras):\n${narration}\n`);

  console.log(`🎙️  Sintetizando voz (${args.ttsProvider}, voice=${args.fishVoice})...`);
  const audio = await synthesizeNarration({
    text: narration,
    textPath: narrationTextPath,
    outputDir,
    provider: args.ttsProvider,
    fishVoiceId: args.fishVoice,
    fishSpeed: args.speed,
  });

  // 2) Copiar áudio pro public do video-studio
  const audioName = "narration.m4a";
  copyFile(audio.m4aPath, path.join(remotionAssetDir, audioName));

  // 3) Duração → frames
  const durationSeconds = getMediaDuration(audio.m4aPath);
  const durationInFrames = Math.ceil(durationSeconds * FPS) + 12;
  console.log(`⏱️  Áudio: ${durationSeconds.toFixed(2)}s → ${durationInFrames} frames`);

  // 4) Props (SÓ dado Free)
  const props = {
    slug,
    concurso: c.concurso,
    dataExtenso,
    dezenas: c.dezenas,
    acumulou: c.acumulou,
    ganhadores15: f15 ? f15.ganhadores : 0,
    premio15Label: f15 ? brl.format(f15.premio) : "",
    ganhadores14: f14 ? f14.ganhadores : 0,
    premio14Label: f14 ? brl.format(f14.premio) : "",
    proximoConcurso: c.proximoConcurso,
    proximoEstimadoLabel: c.proximoEstimado ? brl.format(c.proximoEstimado) : "",
    audioSrc: `renders/${slug}/${audioName}`,
    siteUrl: SITE_URL,
    durationInFrames,
    fps: FPS,
  };
  const propsPath = path.join(outputDir, "input-props.json");
  fs.writeFileSync(propsPath, JSON.stringify(props, null, 2));

  // 5) Render
  console.log(`\n🎬 Renderizando ${COMPOSITION_ID}...`);
  run("npm", [
    "--prefix", VIDEO_STUDIO_DIR,
    "run", "render:article", "--",
    "--props-file", propsPath,
    "--composition-id", COMPOSITION_ID,
    "--out", videoPath,
  ], {stdio: "inherit"});

  // 6) Capa (frame perto do fim, com tudo na tela) + cópia pro destino no dezeneiro
  const capaWorkPath = path.join(outputDir, "capa.png");
  const capaT = Math.max(0, durationSeconds * 0.88).toFixed(2);
  run("ffmpeg", ["-y", "-loglevel", "error", "-ss", String(capaT), "-i", videoPath, "-frames:v", "1", capaWorkPath]);
  ensureDir(args.dest);
  copyFile(videoPath, destVideoPath);
  copyFile(capaWorkPath, destCapaPath);

  // Título + descrição prontos pra postar
  const txtWorkPath = path.join(outputDir, "post.txt");
  const destTxtPath = path.join(args.dest, `${slug}.txt`);
  const txtConteudo = `TÍTULO\n${titulo}\n\nDESCRIÇÃO\n${descricao}\n`;
  fs.writeFileSync(txtWorkPath, txtConteudo);
  copyFile(txtWorkPath, destTxtPath);
  console.log(`📦 Copiado pro dezeneiro: ${destVideoPath}`);
  console.log(`📝 Título/descrição: ${destTxtPath}`);

  const manifest = {
    slug,
    concurso: c.concurso,
    dataExtenso,
    titulo,
    destVideoPath,
    destCapaPath,
    destTxtPath,
    videoPath,
    propsPath,
    narrationTextPath,
    ttsProvider: audio.provider,
    fishVoice: args.fishVoice,
    durationSeconds: Number(durationSeconds.toFixed(2)),
    durationInFrames,
    dezenas: c.dezenas,
    acumulou: c.acumulou,
    narration,
  };
  const manifestPath = path.join(outputDir, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log(`\n✅ Pronto: ${destVideoPath}`);
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
