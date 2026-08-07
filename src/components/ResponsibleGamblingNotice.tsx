import Link from "next/link";

export function ResponsibleGamblingNotice() {
  return (
    <div
      role="note"
      aria-label="Aviso de jogo responsável"
      className="flex min-h-20 flex-col items-center justify-center gap-1.5 border-t border-white/10 bg-[#0b0e14] px-3 py-2 text-center"
    >
      <p className="text-xs font-bold uppercase tracking-wide text-white/90">
        18+. Ministério da Fazenda adverte: Aposta não é investimento.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-bold">
        <Link
          href="/jogo-responsavel"
          className="text-white/80 underline decoration-white/40 underline-offset-2 transition hover:text-white"
        >
          Jogo responsável e canais de apoio
        </Link>
        <a
          href="https://www.gov.br/pt-br/servicos/plataforma-centralizada-de-autoexclusao-apostas"
          target="_blank"
          rel="noopener noreferrer"
          className="text-white/80 underline decoration-white/40 underline-offset-2 transition hover:text-white"
        >
          Autoexclusão no Gov.br ↗
        </a>
      </div>
    </div>
  );
}
