/**
 * Preserva todos os confrontos já publicados antes que a agenda móvel seja
 * substituída. Execute antes e depois de atualizar content/jogos.json.
 */

const { readFileSync, writeFileSync } = require("fs");
const { join } = require("path");

const contentDir = join(process.cwd(), "content");
const currentPath = join(contentDir, "jogos.json");
const historyPath = join(contentDir, "jogos-historico.json");
const probabilitiesPath = join(contentDir, "probabilidades.json");
const probabilityHistoryPath = join(
  contentDir,
  "probabilidades-historico.json",
);

function readJson(path, fallback) {
  try {
    return JSON.parse(readFileSync(path, "utf-8"));
  } catch {
    return fallback;
  }
}

function gameKey(game) {
  return [game.date, game.home, game.away]
    .join("|")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const current = readJson(currentPath, {
  updatedAt: new Date().toISOString(),
  games: [],
});
const history = readJson(historyPath, {
  updatedAt: current.updatedAt,
  games: [],
});
const merged = new Map(history.games.map((game) => [gameKey(game), game]));

for (const game of current.games) {
  merged.set(gameKey(game), { ...merged.get(gameKey(game)), ...game });
}

const games = [...merged.values()].sort((a, b) =>
  a.date === b.date
    ? a.time.localeCompare(b.time)
    : a.date.localeCompare(b.date),
);

writeFileSync(
  historyPath,
  `${JSON.stringify({ updatedAt: current.updatedAt, games }, null, 2)}\n`,
);

console.log(`✓ Histórico de jogos atualizado: ${games.length} confrontos.`);

const currentProbabilities = readJson(probabilitiesPath, {
  generatedAt: current.updatedAt,
  predictions: [],
});
const probabilityHistory = readJson(probabilityHistoryPath, {
  updatedAt: currentProbabilities.generatedAt,
  predictions: [],
  metrics: { evaluated: 0, hitRate: 0, brierScore: 0, minimumSample: 20 },
});
const fixturesByKey = new Map(games.map((game) => [gameKey(game), game]));
const predictions = new Map(
  probabilityHistory.predictions.map((prediction) => [
    gameKey(prediction),
    prediction,
  ]),
);

for (const prediction of currentProbabilities.predictions) {
  const fixture = fixturesByKey.get(gameKey(prediction));
  predictions.set(gameKey(prediction), {
    ...predictions.get(gameKey(prediction)),
    ...prediction,
    time: prediction.time ?? fixture?.time,
    competition: prediction.competition ?? fixture?.competition,
    round: prediction.round ?? fixture?.round,
  });
}

writeFileSync(
  probabilityHistoryPath,
  `${JSON.stringify(
    {
      ...probabilityHistory,
      updatedAt: currentProbabilities.generatedAt,
      predictions: [...predictions.values()].sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
    },
    null,
    2,
  )}\n`,
);

console.log(
  `✓ Histórico de probabilidades atualizado: ${predictions.size} palpites.`,
);
