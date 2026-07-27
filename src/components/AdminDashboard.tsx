"use client";

import { useCallback, useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "";
const TOKEN_KEY = "bdc_admin_token";

interface Stats {
  pushSubscribers: number;
  pushNew7d: number;
  newsletterSubscribers: number;
  lastPush: {
    sent_at: string;
    total: number;
    ok: number;
    failed: number;
    gone: number;
  } | null;
  clicksToday: number;
  clicksByEvent: { event: string; n: number }[];
  clicksByDay: { day: string; n: number }[];
}

export function AdminDashboard() {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // O token fica só no navegador — nunca é embutido no build.
  useEffect(() => {
    const saved = localStorage.getItem(TOKEN_KEY);
    if (saved) setToken(saved);
  }, []);

  const load = useCallback(async (t: string) => {
    if (!API) {
      setError("NEXT_PUBLIC_API_URL não configurado.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API}/admin/stats`, {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 401) {
        setError("Token inválido.");
        setStats(null);
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        return;
      }
      if (!res.ok) throw new Error();
      setStats(await res.json());
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      setError("Não foi possível carregar. O Worker está no ar?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void load(token);
  }, [token, load]);

  if (!token) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) setToken(input.trim());
        }}
        className="mt-8 max-w-sm"
      >
        <label className="block text-sm font-medium text-ink" htmlFor="tk">
          Token de acesso
        </label>
        <input
          id="tk"
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="ADMIN_TOKEN do Worker"
          className="mt-2 w-full border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="mt-3 rounded-md border-2 border-ink bg-lima px-5 py-2.5 text-sm font-bold text-ink"
        >
          Entrar
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </form>
    );
  }

  return (
    <div className="mt-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => load(token)}
          disabled={loading}
          className="border border-ink/15 bg-white px-4 py-2 text-sm font-medium text-ink hover:border-primary disabled:opacity-50"
        >
          {loading ? "Carregando…" : "Atualizar"}
        </button>
        <button
          onClick={() => {
            localStorage.removeItem(TOKEN_KEY);
            setToken("");
            setStats(null);
          }}
          className="text-xs text-gray-500 underline"
        >
          sair
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-ink/15 bg-ink/10 sm:grid-cols-4">
            <Card
              label="Inscritos push"
              value={stats.pushSubscribers}
              hint={stats.pushNew7d > 0 ? `+${stats.pushNew7d} em 7 dias` : undefined}
            />
            <Card label="Newsletter" value={stats.newsletterSubscribers} />
            <Card label="Cliques hoje" value={stats.clicksToday} />
            <Card
              label="Último push"
              value={stats.lastPush ? `${stats.lastPush.ok}` : "—"}
              hint={
                stats.lastPush
                  ? `de ${stats.lastPush.total} · ${stats.lastPush.sent_at.slice(0, 10)}`
                  : "nenhum envio"
              }
            />
          </div>

          <Section title="Cliques por tipo (30 dias)">
            {stats.clicksByEvent.length > 0 ? (
              <Table
                rows={stats.clicksByEvent.map((r) => [r.event, String(r.n)])}
                head={["Evento", "Cliques"]}
              />
            ) : (
              <Empty />
            )}
          </Section>

          <Section title="Cliques por dia (14 dias)">
            {stats.clicksByDay.length > 0 ? (
              <Table
                rows={stats.clicksByDay.map((r) => [r.day, String(r.n)])}
                head={["Dia", "Cliques"]}
              />
            ) : (
              <Empty />
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Card({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="bg-white px-4 py-4">
      <div className="font-display text-3xl font-extrabold tabular-nums text-ink">
        {value}
      </div>
      <div className="mt-1 font-mono text-[11px] uppercase tracking-wide text-gray-500">
        {label}
      </div>
      {hint && <div className="mt-0.5 text-[11px] text-primary">{hint}</div>}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 font-display text-lg font-extrabold text-ink">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Table({ head, rows }: { head: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto border border-ink/15 bg-white">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-ink/15 bg-gray-50 text-left">
            {head.map((h) => (
              <th
                key={h}
                className="px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-gray-500"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className={i > 0 ? "border-t border-ink/10" : undefined}>
              {r.map((c, j) => (
                <td
                  key={j}
                  className={
                    j === 0
                      ? "px-3 py-2 font-medium text-ink"
                      : "px-3 py-2 font-mono tabular-nums text-ink"
                  }
                >
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Empty() {
  return (
    <p className="border border-ink/15 bg-white p-4 text-sm text-gray-500">
      Nenhum dado ainda.
    </p>
  );
}
