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

export interface AdminMatchOption {
  slug: string;
  label: string;
}

interface GameBanner {
  matchSlug: string;
  campaignName: string;
  advertiser: string;
  targetUrl: string;
  altText: string;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  enabled: boolean;
  activeNow: boolean;
  updatedAt: string;
}

export function AdminDashboard({ matches }: { matches: AdminMatchOption[] }) {
  const [token, setToken] = useState("");
  const [input, setInput] = useState("");
  const [stats, setStats] = useState<Stats | null>(null);
  const [banners, setBanners] = useState<GameBanner[]>([]);
  const [editingBanner, setEditingBanner] = useState<GameBanner | null>(null);
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
      const headers = { Authorization: `Bearer ${t}` };
      const [statsResponse, bannersResponse] = await Promise.all([
        fetch(`${API}/admin/stats`, { headers }),
        fetch(`${API}/admin/game-banners`, { headers }),
      ]);
      if (statsResponse.status === 401 || bannersResponse.status === 401) {
        setError("Token inválido.");
        setStats(null);
        setBanners([]);
        localStorage.removeItem(TOKEN_KEY);
        setToken("");
        return;
      }
      if (!statsResponse.ok || !bannersResponse.ok) throw new Error();

      const [nextStats, bannerData] = await Promise.all([
        statsResponse.json() as Promise<Stats>,
        bannersResponse.json() as Promise<{ banners: GameBanner[] }>,
      ]);
      setStats(nextStats);
      setBanners(bannerData.banners);
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
            setBanners([]);
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

      <BannerManager
        token={token}
        matches={matches}
        banners={banners}
        editingBanner={editingBanner}
        onEdit={setEditingBanner}
        onChanged={() => load(token)}
      />
    </div>
  );
}

function BannerManager({
  token,
  matches,
  banners,
  editingBanner,
  onEdit,
  onChanged,
}: {
  token: string;
  matches: AdminMatchOption[];
  banners: GameBanner[];
  editingBanner: GameBanner | null;
  onEdit: (banner: GameBanner | null) => void;
  onChanged: () => Promise<void> | void;
}) {
  const [actionError, setActionError] = useState("");
  const [toggling, setToggling] = useState("");

  async function toggleBanner(banner: GameBanner) {
    setToggling(banner.matchSlug);
    setActionError("");
    try {
      const response = await fetch(
        `${API}/admin/game-banners/${encodeURIComponent(banner.matchSlug)}/toggle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ enabled: !banner.enabled }),
        },
      );
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) throw new Error(body?.error || "Falha ao alterar banner.");
      await onChanged();
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : "Falha ao alterar banner.",
      );
    } finally {
      setToggling("");
    }
  }

  return (
    <Section title="Banners por jogo">
      <p className="mb-5 max-w-2xl text-sm leading-relaxed text-gray-600">
        A campanha entra apenas no slug informado. Arte e configuração são
        publicadas em runtime — não exigem build nem deploy do portal.
      </p>

      <BannerForm
        key={editingBanner?.matchSlug ?? "new-banner"}
        token={token}
        matches={matches}
        banner={editingBanner}
        onCancel={() => onEdit(null)}
        onSaved={async () => {
          onEdit(null);
          await onChanged();
        }}
      />

      {actionError && <p className="mt-4 text-sm text-red-600">{actionError}</p>}

      <div className="mt-8 space-y-4">
        {banners.length === 0 ? (
          <Empty />
        ) : (
          banners.map((banner) => (
            <BannerCard
              key={banner.matchSlug}
              banner={banner}
              toggling={toggling === banner.matchSlug}
              onEdit={() => onEdit(banner)}
              onToggle={() => toggleBanner(banner)}
            />
          ))
        )}
      </div>
    </Section>
  );
}

function BannerForm({
  token,
  matches,
  banner,
  onCancel,
  onSaved,
}: {
  token: string;
  matches: AdminMatchOption[];
  banner: GameBanner | null;
  onCancel: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startsAt = String(form.get("startsAt") ?? "");
    const endsAt = String(form.get("endsAt") ?? "");
    form.set("startsAt", startsAt ? new Date(startsAt).toISOString() : "");
    form.set("endsAt", endsAt ? new Date(endsAt).toISOString() : "");
    form.set("enabled", String(form.get("enabled") === "on"));

    setSaving(true);
    setError("");
    try {
      const response = await fetch(`${API}/admin/game-banners`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) throw new Error(body?.error || "Falha ao salvar banner.");
      await onSaved();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Falha ao salvar banner.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="border border-ink/15 bg-white p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <h3 className="font-display text-base font-extrabold text-ink">
          {banner ? "Editar campanha" : "Nova campanha"}
        </h3>
        {banner && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-gray-500 underline"
          >
            cancelar edição
          </button>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Slug da página do jogo" className="sm:col-span-2">
          <input
            name="matchSlug"
            list="match-slugs"
            defaultValue={banner?.matchSlug ?? ""}
            readOnly={Boolean(banner)}
            required
            placeholder="corinthians-x-internacional-2026-08-09"
            className={inputClass}
          />
          <datalist id="match-slugs">
            {matches.map((match) => (
              <option key={match.slug} value={match.slug}>
                {match.label}
              </option>
            ))}
          </datalist>
        </Field>

        <Field label="Nome da campanha">
          <input
            name="campaignName"
            defaultValue={banner?.campaignName ?? ""}
            required
            placeholder="Inter x Corinthians — odd 11"
            className={inputClass}
          />
        </Field>
        <Field label="Anunciante">
          <input
            name="advertiser"
            defaultValue={banner?.advertiser ?? "Vupi"}
            required
            className={inputClass}
          />
        </Field>

        <Field label="Link de destino" className="sm:col-span-2">
          <input
            name="targetUrl"
            type="url"
            defaultValue={banner?.targetUrl ?? ""}
            required
            placeholder="https://..."
            className={inputClass}
          />
        </Field>
        <Field label="Descrição acessível da arte" className="sm:col-span-2">
          <input
            name="altText"
            defaultValue={banner?.altText ?? ""}
            required
            placeholder="Oferta especial para Internacional x Corinthians"
            className={inputClass}
          />
        </Field>

        <Field label="Arte desktop (4:1)">
          <input
            name="desktopImage"
            type="file"
            accept="image/avif,image/jpeg,image/png,image/webp"
            required={!banner}
            className={fileClass}
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Sugestão: 1600 × 400 px. Máximo 5 MB.
          </p>
        </Field>
        <Field label="Arte mobile (10:9, opcional)">
          <input
            name="mobileImage"
            type="file"
            accept="image/avif,image/jpeg,image/png,image/webp"
            className={fileClass}
          />
          <p className="mt-1 text-[11px] text-gray-500">
            Sugestão: 1080 × 972 px. Sem ela, usa a desktop.
          </p>
        </Field>

        <Field label="Começa em (opcional)">
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={toLocalDateTime(banner?.startsAt)}
            className={inputClass}
          />
        </Field>
        <Field label="Termina em (opcional)">
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={toLocalDateTime(banner?.endsAt)}
            className={inputClass}
          />
        </Field>
      </div>

      <label className="mt-5 flex items-center gap-2 text-sm font-medium text-ink">
        <input
          name="enabled"
          type="checkbox"
          defaultChecked={banner?.enabled ?? true}
          className="h-4 w-4 accent-primary"
        />
        Publicar ativa
      </label>

      <label className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-ink">
        <input
          name="complianceConfirmed"
          type="checkbox"
          value="true"
          required
          className="mt-1 h-4 w-4 shrink-0 accent-primary"
        />
        <span>
          Revisei a peça: é 18+, não promete ganho fácil/renda/investimento e o
          aviso obrigatório será mantido pelo portal.
        </span>
      </label>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={saving}
        className="mt-5 rounded-md border-2 border-ink bg-lima px-5 py-2.5 text-sm font-bold text-ink disabled:opacity-50"
      >
        {saving ? "Publicando…" : banner ? "Salvar alterações" : "Publicar banner"}
      </button>
    </form>
  );
}

function BannerCard({
  banner,
  toggling,
  onEdit,
  onToggle,
}: {
  banner: GameBanner;
  toggling: boolean;
  onEdit: () => void;
  onToggle: () => void;
}) {
  const live = banner.activeNow;

  return (
    <article className="grid gap-4 border border-ink/15 bg-white p-4 sm:grid-cols-[180px_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={banner.desktopImageUrl}
        alt=""
        className="aspect-[4/1] w-full bg-gray-100 object-cover sm:aspect-video"
      />
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-display font-extrabold text-ink">
              {banner.campaignName}
            </p>
            <p className="mt-0.5 break-all font-mono text-[11px] text-gray-500">
              /onde-assistir/{banner.matchSlug}
            </p>
          </div>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
              live
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {live ? "no ar" : banner.enabled ? "agendado/encerrado" : "desativado"}
          </span>
        </div>
        <p className="mt-2 text-xs text-gray-600">
          {banner.advertiser}
          {banner.endsAt
            ? ` · até ${new Date(banner.endsAt).toLocaleString("pt-BR")}`
            : " · sem data final"}
        </p>
        <div className="mt-3 flex gap-3 text-xs font-medium">
          <button onClick={onEdit} className="text-primary underline">
            Editar
          </button>
          <button
            onClick={onToggle}
            disabled={toggling}
            className="text-gray-600 underline disabled:opacity-50"
          >
            {toggling
              ? "alterando…"
              : banner.enabled
                ? "Desativar agora"
                : "Ativar agora"}
          </button>
        </div>
      </div>
    </article>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={className}>
      <span className="mb-1.5 block text-xs font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function toLocalDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const inputClass =
  "w-full border border-ink/20 bg-white px-3 py-2 text-sm outline-none focus:border-primary read-only:bg-gray-50 read-only:text-gray-500";
const fileClass =
  "block w-full text-xs text-gray-600 file:mr-3 file:border-0 file:bg-ink file:px-3 file:py-2 file:font-bold file:text-white";

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
