import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {bundle} from "@remotion/bundler";
import {getCompositions, renderMedia} from "@remotion/renderer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

const propsFile = getArg("--props-file");
const outputLocation = getArg("--out");
const compositionId = getArg("--composition-id") ?? "NewsShortClean";

if (!propsFile || !outputLocation) {
  console.error("Usage: node render-article.mjs --props-file <file> --out <output.mp4> [--composition-id <id>]");
  process.exit(1);
}

const inputProps = JSON.parse(fs.readFileSync(path.resolve(propsFile), "utf8"));
const entryPoint = path.join(__dirname, "src", "index.jsx");

const bundled = await bundle({
  entryPoint,
  webpackOverride: (config) => config,
});

const compositions = await getCompositions(bundled, {
  inputProps,
});

const composition = compositions.find((item) => item.id === compositionId);

if (!composition) {
  console.error(`Composition ${compositionId} not found.`);
  process.exit(1);
}

await renderMedia({
  codec: "h264",
  composition,
  serveUrl: bundled,
  outputLocation: path.resolve(outputLocation),
  inputProps,
  crf: 18,
  imageFormat: "jpeg",
  pixelFormat: "yuv420p",
});
