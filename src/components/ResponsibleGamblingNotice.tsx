import Link from "next/link";

export function ResponsibleGamblingNotice({
  showVupiAuthorization = false,
}: {
  showVupiAuthorization?: boolean;
}) {
  return (
    <div
      role="note"
      aria-label="Aviso de jogo responsável"
      className="flex min-h-24 flex-col items-center justify-center gap-2 border-t border-white/10 bg-[#0b0e14] px-4 py-4 text-center"
    >
      <p className="text-sm font-extrabold leading-snug text-white sm:text-base">
        <span className="mr-2 inline-flex bg-white px-1.5 py-0.5 text-xs font-black text-[#0b0e14]">
          18+
        </span>
        Ministério da Fazenda adverte: Aposta não é investimento.
      </p>

      {showVupiAuthorization && (
        <p className="text-[10px] font-semibold uppercase tracking-wide text-white/65 sm:text-[11px]">
          Jogue com responsabilidade · Autorização SPA/MF nº 320/2025
        </p>
      )}

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
