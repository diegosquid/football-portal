import type { Prediction } from "@/lib/probabilities";

const pct = (x: number) => Math.round(x * 100);

/** Barra segmentada casa / empate / fora + mercados. Server component (SEO-safe). */
export function ProbabilityPanel({
  prediction,
  showExplanation = true,
}: {
  prediction: Prediction;
  showExplanation?: boolean;
}) {
  const { resultado, gols, ambosMarcam, placarProvavel, golsEsperados } =
    prediction;
  const casa = pct(resultado.casa);
  const empate = pct(resultado.empate);
  const fora = pct(resultado.fora);
  const homeSample = prediction.explicacao.jogosConsiderados.casa;
  const awaySample = prediction.explicacao.jogosConsiderados.fora;
  const smallSample = Math.min(homeSample, awaySample) < 3;

  return (
    <div className="border border-ink/15 bg-white p-4 sm:p-5">
      {/* Rótulos 1x2 */}
      <div className="mb-1.5 flex items-baseline justify-between text-sm font-bold text-ink">
        <span className="truncate">{prediction.home}</span>
        <span className="px-2 text-xs font-medium uppercase tracking-wider text-gray-500">
          Empate
        </span>
        <span className="truncate text-right">{prediction.away}</span>
      </div>

      {/* Barra segmentada */}
      <div
        className="flex h-9 w-full overflow-hidden rounded-md text-xs font-bold"
        role="img"
        aria-label={`Probabilidade: ${prediction.home} ${casa}%, empate ${empate}%, ${prediction.away} ${fora}%`}
      >
        <div
          style={{ width: `${casa}%` }}
          className="flex items-center justify-center bg-primary text-white"
        >
          {casa >= 8 ? `${casa}%` : ""}
        </div>
        <div
          style={{ width: `${empate}%` }}
          className="flex items-center justify-center bg-gray-300 text-gray-800"
        >
          {empate >= 8 ? `${empate}%` : ""}
        </div>
        <div
          style={{ width: `${fora}%` }}
          className="flex items-center justify-center bg-ink text-white"
        >
          {fora >= 8 ? `${fora}%` : ""}
        </div>
      </div>

      {/* Mercados */}
      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-ink/10 bg-ink/10 text-center sm:grid-cols-4">
        <Stat label="Mais de 2.5 gols" value={`${pct(gols.over25)}%`} />
        <Stat label="Ambos marcam" value={`${pct(ambosMarcam.sim)}%`} />
        <Stat label="Placar provável" value={placarProvavel} />
        <Stat label="Gols esperados" value={golsEsperados.toFixed(2)} />
      </dl>

      {showExplanation && (
        <p className="mt-3 text-xs leading-relaxed text-gray-500">
          Baseado na força de ataque e defesa calculada a partir de {homeSample}{" "}
          {homeSample === 1 ? "jogo" : "jogos"} do mandante em casa e{" "}
          {awaySample} {awaySample === 1 ? "jogo" : "jogos"} do visitante fora.
          {smallSample && (
            <strong className="ml-1 text-amber-700">
              Amostra pequena; interprete com cautela.
            </strong>
          )}
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white px-2 py-3">
      <dd className="font-display text-xl font-extrabold tabular-nums text-ink">
        {value}
      </dd>
      <dt className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </dt>
    </div>
  );
}
