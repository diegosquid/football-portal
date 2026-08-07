#!/usr/bin/env node

const path = require("path");
const sharp = require("sharp");

const root = path.join(
  __dirname,
  "..",
  "artifacts",
  "game-banners",
  "corinthians-x-internacional-2026-08-06",
);

const desktopBackground = path.join(root, "background-desktop.png");
const mobileBackground = path.join(root, "background-mobile.png");
const vupiBrandSource = path.join(
  __dirname,
  "..",
  "public",
  "ads",
  "vupi",
  "palpites-mobile.webp",
);
const vupiLogoOutput = path.join(root, "vupi-logo-white.png");

const desktopOverlay = `
<svg width="1600" height="400" viewBox="0 0 1600 400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#05070b" stop-opacity=".82"/>
      <stop offset=".5" stop-color="#05070b" stop-opacity=".56"/>
      <stop offset="1" stop-color="#05070b" stop-opacity=".72"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="#000" flood-opacity=".65"/>
    </filter>
  </defs>
  <rect width="1600" height="400" fill="url(#shade)"/>
  <rect x="16" y="16" width="1568" height="368" rx="18" fill="none" stroke="#f4cd43" stroke-opacity=".45" stroke-width="2"/>

  <rect x="48" y="38" width="150" height="35" rx="5" fill="#f4cd43"/>
  <text x="123" y="62" text-anchor="middle" fill="#10141b" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="18">BOOST OURO</text>

  <text x="48" y="126" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="39">CORINTHIANS × INTERNACIONAL</text>
  <text x="48" y="169" fill="#c7ccd4" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="19" letter-spacing="2">TOTAL DE GOLS</text>
  <text x="48" y="229" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="48">MAIS DE 0,5</text>

  <line x1="880" y1="91" x2="880" y2="294" stroke="#ffffff" stroke-opacity=".22" stroke-width="2"/>
  <text x="930" y="118" fill="#f4cd43" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="20" letter-spacing="3">ODD ESPECIAL</text>
  <text x="922" y="246" fill="#2af2df" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="112" filter="url(#shadow)">11,00</text>

  <rect x="1222" y="270" width="328" height="67" rx="8" fill="#f4cd43"/>
  <text x="1386" y="312" text-anchor="middle" fill="#10141b" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="23">CLIQUE E APOSTE</text>

  <text x="48" y="361" fill="#ffffff" fill-opacity=".8" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="14">18+  •  Odds sujeitas a alteração  •  Aplicam-se termos e condições</text>
</svg>`;

const mobileOverlay = `
<svg width="1080" height="972" viewBox="0 0 1080 972" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05070b" stop-opacity=".72"/>
      <stop offset=".55" stop-color="#05070b" stop-opacity=".5"/>
      <stop offset="1" stop-color="#05070b" stop-opacity=".78"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="7" stdDeviation="8" flood-color="#000" flood-opacity=".72"/>
    </filter>
  </defs>
  <rect width="1080" height="972" fill="url(#shade)"/>
  <rect x="22" y="22" width="1036" height="928" rx="26" fill="none" stroke="#f4cd43" stroke-opacity=".5" stroke-width="3"/>

  <rect x="410" y="146" width="260" height="58" rx="8" fill="#f4cd43"/>
  <text x="540" y="185" text-anchor="middle" fill="#10141b" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="31">BOOST OURO</text>

  <text x="540" y="270" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="53">CORINTHIANS × INTERNACIONAL</text>
  <text x="540" y="330" text-anchor="middle" fill="#c7ccd4" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="27" letter-spacing="4">TOTAL DE GOLS</text>
  <text x="540" y="407" text-anchor="middle" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="70">MAIS DE 0,5</text>

  <text x="540" y="480" text-anchor="middle" fill="#f4cd43" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="27" letter-spacing="5">ODD ESPECIAL</text>
  <text x="540" y="650" text-anchor="middle" fill="#2af2df" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="174" filter="url(#shadow)">11,00</text>

  <rect x="160" y="704" width="760" height="108" rx="14" fill="#f4cd43"/>
  <text x="540" y="772" text-anchor="middle" fill="#10141b" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="39">APOSTE NA VUPI</text>

  <text x="540" y="908" text-anchor="middle" fill="#ffffff" fill-opacity=".85" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="22">18+  •  Odds sujeitas a alteração</text>
  <text x="540" y="936" text-anchor="middle" fill="#ffffff" fill-opacity=".72" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="18">Aplicam-se termos e condições</text>
</svg>`;

async function render() {
  const { data, info } = await sharp(vupiBrandSource)
    .extract({ left: 390, top: 315, width: 500, height: 300 })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let index = 0; index < data.length; index += 4) {
    const whiteness = Math.min(data[index], data[index + 1], data[index + 2]);
    data[index] = 255;
    data[index + 1] = 255;
    data[index + 2] = 255;
    data[index + 3] = Math.max(0, Math.min(255, (whiteness - 120) * 2.4));
  }

  const logo = await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  await sharp(logo).toFile(vupiLogoOutput);

  const desktopLogo = await sharp(logo).resize({ width: 180 }).png().toBuffer();
  const mobileLogo = await sharp(logo).resize({ width: 170 }).png().toBuffer();

  await sharp(desktopBackground)
    .resize(1600, 400, { fit: "cover", position: "centre" })
    .composite([
      { input: Buffer.from(desktopOverlay) },
      { input: desktopLogo, left: 1368, top: 34 },
    ])
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(root, "banner-desktop.webp"));

  await sharp(mobileBackground)
    .resize(1080, 972, { fit: "cover", position: "centre" })
    .composite([
      { input: Buffer.from(mobileOverlay) },
      { input: mobileLogo, left: 455, top: 38 },
    ])
    .webp({ quality: 92, effort: 6 })
    .toFile(path.join(root, "banner-mobile.webp"));
}

render().catch((error) => {
  console.error(error);
  process.exit(1);
});
