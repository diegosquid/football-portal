import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";
import { getAllMatches } from "@/lib/matches";

// O seletor de jogos do painel acompanha o JSON publicado no R2 em runtime.
export const dynamic = "force-dynamic";

// Painel interno: nunca deve ser indexado.
export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false, nocache: true },
};

export default async function AdminPage() {
  const matches = (await getAllMatches()).map((match) => ({
    slug: match.slug,
    label: `${match.home} x ${match.away} · ${match.date} ${match.time}`,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
        Interno
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Painel
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-gray-600">
        Inscritos, cliques e campanhas por jogo. Os dados vêm do D1 pelo Worker;
        o token fica salvo apenas neste navegador e só é enviado à API interna.
      </p>

      <AdminDashboard matches={matches} />
    </div>
  );
}
