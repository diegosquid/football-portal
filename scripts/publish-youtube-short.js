#!/usr/bin/env node

const path = require("path");
const {spawnSync} = require("child_process");

const PROJECT_DIR = path.resolve(__dirname, "..");
const NODE_BIN = process.execPath;
const RENDER_SCRIPT = path.join(PROJECT_DIR, "scripts", "render-remotion-short.js");
const UPLOAD_SCRIPT = path.join(PROJECT_DIR, "scripts", "upload-youtube-short.js");

const FLAGS_WITH_VALUES = new Set([
  "--format",
  "--image",
  "--narration-file",
  "--tts-provider",
  "--gemini-voice",
  "--minimax-voice",
  "--elevenlabs-voice",
  "--voice",
  "--rate",
  "--video",
  "--title",
  "--description",
  "--tags",
  "--privacy",
  "--publish-at",
  "--playlist-id",
  "--thumbnail",
  "--token-file",
  "--category-id",
]);

function runScript(scriptPath, args) {
  const result = spawnSync(NODE_BIN, [scriptPath, ...args], {
    cwd: PROJECT_DIR,
    stdio: "inherit",
    env: process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status || 1);
  }
}

function splitArgs(argv) {
  const shared = [];
  const renderOnly = [];
  const uploadOnly = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (!arg.startsWith("--")) {
      shared.push(arg);
      continue;
    }

    const pushFlag = (target) => {
      target.push(arg);
      if (FLAGS_WITH_VALUES.has(arg)) {
        if (typeof next === "undefined") {
          throw new Error(`Missing value for ${arg}`);
        }
        target.push(next);
        index += 1;
      }
    };

    if (arg === "--latest" || arg === "--format") {
      pushFlag(shared);
      continue;
    }

    if (arg === "--ai-narration") {
      renderOnly.push(arg);
      continue;
    }

    if (["--image", "--narration-file", "--tts-provider", "--gemini-voice", "--minimax-voice", "--elevenlabs-voice", "--voice", "--rate"].includes(arg)) {
      pushFlag(renderOnly);
      continue;
    }

    if (
      [
        "--video",
        "--title",
        "--description",
        "--tags",
        "--privacy",
        "--made-for-kids",
        "--publish-at",
        "--playlist-id",
        "--thumbnail",
        "--token-file",
        "--category-id",
        "--no-notify-subscribers",
      ].includes(arg)
    ) {
      pushFlag(uploadOnly);
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    renderArgs: [...shared, ...renderOnly],
    uploadArgs: [...shared, ...uploadOnly],
  };
}

function main() {
  const {renderArgs, uploadArgs} = splitArgs(process.argv.slice(2));
  runScript(RENDER_SCRIPT, renderArgs);
  runScript(UPLOAD_SCRIPT, uploadArgs);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
