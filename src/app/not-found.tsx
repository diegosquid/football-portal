import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[65vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.3em] text-gray-500">
        Erro 404
      </p>
      <h1 className="num-jersey mt-4 text-[6rem] leading-none sm:text-[9rem]">
        404
      </h1>
      <p className="mt-2 font-display text-3xl font-extrabold uppercase tracking-tight text-ink">
        Impedimento marcado
      </p>
      <p className="mt-3 max-w-md font-serif text-lg italic text-gray-600">
        A página que você procura não existe ou saiu de campo.
      </p>
      <Link
        href="/"
        className="mt-8 border-2 border-ink bg-ink px-8 py-3 font-mono text-sm font-bold uppercase tracking-[0.15em] text-cal transition-colors hover:bg-lima hover:text-ink"
      >
        Voltar para o gramado
      </Link>
    </div>
  );
}
