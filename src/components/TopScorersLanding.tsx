import Link from "next/link";
import { getPublishedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/ArticleCard";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import type { TopScorersCompetitionCopy } from "@/lib/topscorers-competitions";
import {
  goalsLabel,
  scorersByTeam,
  type EnrichedScorer,
  type EnrichedTopScorersRanking,
} from "@/lib/topscorers";
import { formatUpdatedAt } from "@/lib/standings";

/** Pódio recebe destaque; o resto é lista. */
const MEDAL: Record<number, string> = {
  1: "bg-lima text-ink",
  2: "bg-ink/12 text-ink",
  3: "bg-ink/8 text-ink",
};

function ScorerRow({ scorer }: { scorer: EnrichedScorer }) {
  const name = (
    <span className="font-semibold text-ink">{scorer.displayName}</span>
  );
  return (
    <tr className="border-b border-ink/10 last:border-0">
      <td className="py-3 pl-3 pr-2">
        <span
          className={`flex h-7 w-7 items-center justify-center font-mono text-xs font-bold ${
            MEDAL[scorer.position] ?? "text-gray-500"
          }`}
        >
          {scorer.position}
        </span>
      </td>
      <td className="py-3 pr-3">
        {name}
        <span className="mt-0.5 block text-xs text-gray-500 sm:hidden">
          {scorer.teamName}
        </span>
      </td>
      <td className="hidden py-3 pr-3 text-sm text-gray-600 sm:table-cell">
        {scorer.teamSlug ? (
          <Link
            href={`/time/${scorer.teamSlug}`}
            className="hover:text-primary hover:underline"
          >
            {scorer.teamName}
          </Link>
        ) : (
          scorer.teamName
        )}
      </td>
      <td className="py-3 pr-3 text-right font-mono text-base font-bold tabular-nums text-ink">
        {scorer.goals}
      </td>
    </tr>
  );
}

/**
 * Corpo compartilhado das landings de artilharia.
 * Cada competição traz o próprio texto (src/lib/topscorers-competitions.ts);
 * a estrutura (ranking, artilheiro por time, FAQ) é a mesma pra todas.
 */
export async function TopScorersLanding({
  ranking,
  copy,
  generatedAt,
}: {
  ranking: EnrichedTopScorersRanking;
  copy: TopScorersCompetitionCopy;
  generatedAt?: string;
}) {
  const h1 = copy.h1(ranking.season);
  const updatedAt = formatUpdatedAt(generatedAt);
  const leader = ranking.scorers[0];
  // Empate na ponta é comum e é notícia: "dois artilheiros com 12 gols".
  const leaders = ranking.scorers.filter((s) => s.goals === leader.goals);
  const byTeam = scorersByTeam(ranking).slice(0, 12);

  const faq = [
    {
      question: `Quem é o artilheiro ${copy.possessive} ${ranking.season}?`,
      answer:
        leaders.length === 1
          ? `${leader.displayName}, do ${leader.teamName}, é o artilheiro ${copy.possessive} com ${goalsLabel(leader.goals)}.`
          : `A artilharia ${copy.possessive} está empatada: ${leaders
              .map((s) => `${s.displayName} (${s.teamName})`)
              .join(" e ")} têm ${goalsLabel(leader.goals)} cada.`,
    },
    {
      question: `Quantos gols tem o artilheiro ${copy.possessive}?`,
      answer: `O líder da artilharia tem ${goalsLabel(leader.goals)} até agora. Os ${ranking.scorers.length} jogadores desta lista somam ${ranking.totalGoals} gols na competição.`,
    },
    {
      question: "De quanto em quanto tempo a lista é atualizada?",
      answer:
        "A artilharia é reprocessada todos os dias, junto com a tabela e os palpites. Antes de publicar, conferimos a lista contra os gols que cada time realmente marcou — ranking que não fecha com o placar não vai ao ar.",
    },
    ...(copy.faqExtra ?? []),
  ];

  const related = (await getPublishedArticles())
    .filter((article) => article.category === copy.categorySlug)
    .slice(0, 3);

  return (
    <>
      <CollectionPageJsonLd
        name={h1}
        description={copy.description(ranking.season)}
        url={copy.path}
        items={ranking.scorers.slice(0, 20).map((s) => ({
          name: `${s.position}º ${s.displayName} (${s.teamName}) — ${goalsLabel(s.goals)}`,
          url: s.teamSlug ? `/time/${s.teamSlug}` : copy.path,
        }))}
      />
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Tabelas", url: "/tabela" },
          { name: copy.eyebrow, url: copy.path },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          {copy.eyebrow}
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          {h1}
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          {copy.intro}
        </p>

        {/* Resposta direta — é o que a busca pergunta */}
        <div className="mt-6 border-2 border-ink bg-lima/20 p-5 sm:p-6">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.25em] text-ink/60">
            {leaders.length === 1 ? "Artilheiro" : "Artilharia empatada"}
          </p>
          <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {leaders.map((s) => s.displayName).join(" e ")}
          </p>
          <p className="mt-1 text-sm text-gray-700">
            {leaders.map((s) => s.teamName).join(" e ")} ·{" "}
            <strong className="text-ink">{goalsLabel(leader.goals)}</strong>
          </p>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          {updatedAt && (
            <>
              Atualizado em <time dateTime={generatedAt}>{updatedAt}</time>
              {" · "}
            </>
          )}
          {ranking.scorers.length} jogadores · {ranking.totalGoals} gols na lista
        </p>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          {[...copy.links, { href: "/tabela", label: "Todas as tabelas" }].map(
            (link) => (
              <Link
                key={link.href}
                href={link.href}
                className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            {copy.tableHeading}
          </h2>
          <div className="overflow-hidden border border-ink/15 bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-gray-50 font-mono text-[10px] uppercase tracking-wider text-gray-500">
                  <th scope="col" className="py-2 pl-3 pr-2 font-bold">
                    #
                  </th>
                  <th scope="col" className="py-2 pr-3 font-bold">
                    Jogador
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 font-bold sm:table-cell">
                    Clube
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-bold">
                    Gols
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranking.scorers.map((scorer) => (
                  <ScorerRow
                    key={`${scorer.playerId}-${scorer.position}`}
                    scorer={scorer}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
            O artilheiro de cada time
          </h2>
          <p className="mb-5 mt-2 max-w-2xl text-sm leading-relaxed text-gray-600">
            Quem mais balançou a rede em cada clube, entre os jogadores da lista
            acima.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {byTeam.map((group) => {
              const top = group.scorers[0];
              return (
                <div
                  key={group.teamSlug ?? group.teamName}
                  className="flex items-baseline justify-between gap-3 border border-ink/15 bg-white px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">
                      {top.displayName}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {group.teamSlug ? (
                        <Link
                          href={`/time/${group.teamSlug}`}
                          className="hover:text-primary hover:underline"
                        >
                          {group.teamName}
                        </Link>
                      ) : (
                        group.teamName
                      )}
                    </p>
                  </div>
                  <span className="shrink-0 font-mono text-lg font-bold tabular-nums text-ink">
                    {top.goals}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <ArticleFAQ items={faq} />

        <p className="mt-10 border-l-4 border-primary bg-surface p-4 text-xs leading-relaxed text-gray-600">
          Fonte dos dados: apifootball.com. A lista traz os goleadores de
          destaque da competição e é conferida contra os gols marcados por cada
          time — jogadores com poucos gols podem não constar.
        </p>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="mb-5 font-display text-2xl font-extrabold tracking-tight text-ink">
              Últimas notícias
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((article) => (
                <ArticleCard
                  key={article.slug}
                  title={article.title}
                  slug={article.slug}
                  excerpt={article.excerpt}
                  date={article.date}
                  author={article.author}
                  category={article.category}
                  image={article.image}
                  readingTime={article.readingTime}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
