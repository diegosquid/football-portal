import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArticleFAQ } from "@/components/ArticleFAQ";
import {
  BreadcrumbJsonLd,
  CollectionPageJsonLd,
  FAQPageJsonLd,
} from "@/components/JsonLd";
import { formatUpdatedAt } from "@/lib/standings";
import {
  formatCapacity,
  getVenues,
  getVenuesData,
  surfaceLabel,
  uniqueStadiums,
  type StadiumRow,
} from "@/lib/venues";
import { siteConfig } from "@/lib/site";

/**
 * Estádios do Brasileirão — evergreen puro.
 * A capacidade quase não muda, então a página envelhece bem e serve de destino
 * para "capacidade do Maracanã", "maior estádio do Brasileirão" e afins.
 */

export const revalidate = 86400; // 24 h — capacidade não muda de hora em hora

const PATH = "/estadios-do-brasileirao";
const KEYWORDS = [
  "estádios do brasileirão",
  "capacidade dos estádios do brasileirão",
  "maior estádio do brasileirão",
  "estádio de cada time do brasileirão",
  "maiores estádios do brasil",
];

export async function generateMetadata(): Promise<Metadata> {
  const comp = await getVenues("brasileirao");
  if (!comp) return {};

  const biggest = comp.venues[0];
  const title = `Estádios do Brasileirão: capacidade de cada time`;
  const description =
    `Os ${comp.uniqueStadiums} estádios do Brasileirão Série A e a capacidade de cada um. ` +
    `O maior é o ${biggest.stadium}, com ${formatCapacity(biggest.capacity)} lugares. ` +
    `Média de ${formatCapacity(comp.averageCapacity)} por praça.`;

  return {
    title,
    description,
    keywords: KEYWORDS,
    alternates: { canonical: `${siteConfig.url}${PATH}` },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${PATH}`,
      siteName: siteConfig.name,
      locale: "pt_BR",
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function StadiumTableRow({ row, rank }: { row: StadiumRow; rank: number }) {
  return (
    <tr className="border-b border-ink/10 last:border-0">
      <td className="py-3 pl-3 pr-2 font-mono text-xs text-gray-500">{rank}</td>
      <td className="py-3 pr-3">
        <span className="font-semibold text-ink">{row.stadium}</span>
        <span className="mt-0.5 block text-xs text-gray-500">
          {row.teams.map((team, i) => (
            <span key={team.name}>
              {i > 0 && " e "}
              {team.slug ? (
                <Link
                  href={`/time/${team.slug}`}
                  className="hover:text-primary hover:underline"
                >
                  {team.name}
                </Link>
              ) : (
                team.name
              )}
            </span>
          ))}
        </span>
      </td>
      <td className="hidden py-3 pr-3 text-sm text-gray-600 sm:table-cell">
        {row.city ?? "—"}
      </td>
      <td className="py-3 pr-3 text-right font-mono text-base font-bold tabular-nums text-ink">
        {formatCapacity(row.capacity)}
      </td>
    </tr>
  );
}

export default async function EstadiosPage() {
  const [comp, data] = await Promise.all([
    getVenues("brasileirao"),
    getVenuesData(),
  ]);
  if (!comp) notFound();

  const updatedAt = formatUpdatedAt(data?.generatedAt);
  const stadiums = uniqueStadiums(comp);
  const biggest = comp.venues[0];
  const smallest = comp.venues[comp.venues.length - 1];
  const oldest = [...comp.venues]
    .filter((v) => v.founded)
    .sort((a, b) => (a.founded ?? 0) - (b.founded ?? 0))[0];

  const faq = [
    {
      question: "Qual é o maior estádio do Brasileirão?",
      answer: `O ${biggest.stadium}, em ${biggest.city}, com ${formatCapacity(biggest.capacity)} lugares. É a casa do ${biggest.teamName}${biggest.sharedWith.length > 0 ? ` e do ${biggest.sharedWith.join(", ")}` : ""}.`,
    },
    {
      question: "Qual é o menor estádio do Brasileirão?",
      answer: `O ${smallest.stadium}, em ${smallest.city}, com ${formatCapacity(smallest.capacity)} lugares — casa do ${smallest.teamName}.`,
    },
    {
      question: "Quantos lugares somam todos os estádios do Brasileirão?",
      answer: `Os ${comp.uniqueStadiums} estádios da Série A somam ${formatCapacity(comp.totalCapacity)} lugares, uma média de ${formatCapacity(comp.averageCapacity)} por praça. São ${comp.teams} clubes em ${comp.uniqueStadiums} estádios porque alguns dividem a mesma casa.`,
    },
    ...(oldest
      ? [
          {
            question: "Qual é o clube mais antigo do Brasileirão?",
            answer: `O ${oldest.teamName}, fundado em ${oldest.founded}. Manda seus jogos no ${oldest.stadium}.`,
          },
        ]
      : []),
  ];

  return (
    <>
      <CollectionPageJsonLd
        name="Estádios do Brasileirão"
        description={`Capacidade dos ${comp.uniqueStadiums} estádios do Brasileirão Série A.`}
        url={PATH}
        items={comp.venues.map((v) => ({
          name: `${v.stadium} — ${formatCapacity(v.capacity)} lugares (${v.teamName})`,
          url: v.teamSlug ? `/time/${v.teamSlug}` : PATH,
        }))}
      />
      <FAQPageJsonLd items={faq} />
      <BreadcrumbJsonLd
        items={[
          { name: "Início", url: "/" },
          { name: "Estádios do Brasileirão", url: PATH },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 py-8">
        <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-gray-500">
          Estádios
        </p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-none tracking-tight text-ink sm:text-6xl">
          Estádios do Brasileirão
        </h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-gray-600">
          A casa de cada clube da Série A, com capacidade oficial, cidade e o
          tipo de gramado. São {comp.teams} clubes em {comp.uniqueStadiums}{" "}
          estádios — alguns dividem a mesma praça.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="border-2 border-ink bg-lima/20 p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink/60">
              Maior estádio
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">
              {formatCapacity(biggest.capacity)}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">{biggest.stadium}</p>
          </div>
          <div className="border border-ink/15 bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Média por praça
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">
              {formatCapacity(comp.averageCapacity)}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">
              {comp.uniqueStadiums} estádios
            </p>
          </div>
          <div className="border border-ink/15 bg-white p-4">
            <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500">
              Capacidade somada
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold text-ink">
              {formatCapacity(comp.totalCapacity)}
            </p>
            <p className="mt-0.5 text-xs text-gray-600">lugares na Série A</p>
          </div>
        </div>

        <p className="mt-4 text-sm text-gray-500">
          {updatedAt && (
            <>
              Atualizado em <time dateTime={data?.generatedAt}>{updatedAt}</time>
            </>
          )}
        </p>

        <nav className="mb-10 mt-5 flex flex-wrap gap-2 text-sm">
          {[
            { href: "/tabela-do-brasileirao", label: "Tabela do Brasileirão" },
            { href: "/artilharia-do-brasileirao", label: "Artilharia" },
            { href: "/jogos-futebol-hoje/brasileirao", label: "Jogos do Brasileirão" },
            { href: "/time", label: "Todos os times" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="border border-ink/15 bg-white px-4 py-2 font-medium text-ink transition-colors hover:border-primary hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <section>
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            Capacidade de cada estádio
          </h2>
          <div className="overflow-hidden border border-ink/15 bg-white">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-ink/15 bg-gray-50 font-mono text-[10px] uppercase tracking-wider text-gray-500">
                  <th scope="col" className="py-2 pl-3 pr-2 font-bold">
                    #
                  </th>
                  <th scope="col" className="py-2 pr-3 font-bold">
                    Estádio
                  </th>
                  <th scope="col" className="hidden py-2 pr-3 font-bold sm:table-cell">
                    Cidade
                  </th>
                  <th scope="col" className="py-2 pr-3 text-right font-bold">
                    Lugares
                  </th>
                </tr>
              </thead>
              <tbody>
                {stadiums.map((row, i) => (
                  <StadiumTableRow key={row.stadium} row={row} rank={i + 1} />
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-14">
          <h2 className="mb-4 font-display text-2xl font-extrabold tracking-tight text-ink">
            Ficha dos clubes
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[...comp.venues]
              .sort((a, b) => a.teamName.localeCompare(b.teamName, "pt-BR"))
              .map((venue) => (
                <div
                  key={`ficha-${venue.teamId}`}
                  className="border border-ink/15 bg-white p-4"
                >
                  <p className="font-semibold text-ink">
                    {venue.teamSlug ? (
                      <Link
                        href={`/time/${venue.teamSlug}`}
                        className="hover:text-primary hover:underline"
                      >
                        {venue.teamName}
                      </Link>
                    ) : (
                      venue.teamName
                    )}
                  </p>
                  <dl className="mt-2 space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between gap-3">
                      <dt className="text-gray-500">Estádio</dt>
                      <dd className="text-right font-medium text-ink">
                        {venue.stadium}
                      </dd>
                    </div>
                    {venue.founded && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Fundação</dt>
                        <dd className="font-medium text-ink">{venue.founded}</dd>
                      </div>
                    )}
                    {surfaceLabel(venue.surface) && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-gray-500">Gramado</dt>
                        <dd className="font-medium text-ink">
                          {surfaceLabel(venue.surface)}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              ))}
          </div>
        </section>

        <ArticleFAQ items={faq} />

        <p className="mt-10 border-l-4 border-primary bg-surface p-4 text-xs leading-relaxed text-gray-600">
          {data?.disclaimer} Fonte: apifootball.com.
        </p>
      </div>
    </>
  );
}
