import type { Metadata } from "next";
import { AdminDashboard } from "@/components/AdminDashboard";

// Painel interno: nunca deve ser indexado.
export const metadata: Metadata = {
  title: "Painel",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
        Interno
      </p>
      <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        Painel
      </h1>
      <p className="mt-3 max-w-2xl text-sm text-gray-600">
        Inscritos em push e newsletter, envios e cliques rastreados. Os dados
        vêm do D1 pelo Worker — o token não sai deste navegador.
      </p>

      <AdminDashboard />
    </div>
  );
}
