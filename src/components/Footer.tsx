import Link from "next/link";
import { categories } from "@/lib/categories";
import { siteConfig } from "@/lib/site";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Logo } from "@/components/Logo";
import { teams } from "@/lib/teams";

const FEATURED_TEAM_SLUGS = [
  "flamengo",
  "palmeiras",
  "corinthians",
  "sao-paulo",
  "santos",
  "botafogo",
  "fluminense",
  "vasco",
];

export function Footer() {
  const featuredTeams = FEATURED_TEAM_SLUGS.map((slug) => teams[slug]).filter(
    (t): t is NonNullable<typeof t> => Boolean(t),
  );

  return (
    <footer className="bg-secondary text-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div>
            <Link href="/">
              <Logo />
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              {siteConfig.description}
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href={siteConfig.links.twitter}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-300 transition-colors hover:bg-primary hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@beiradocampotv"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="YouTube"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-gray-300 transition-colors hover:bg-red-600 hover:text-white"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
              Categorias
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/jogos-futebol-hoje"
                  className="text-sm font-semibold text-primary transition-colors hover:text-white"
                >
                  Jogos de Hoje
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/categoria/${cat.slug}`}
                    className="text-sm text-gray-300 transition-colors hover:text-primary"
                  >
                    {cat.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Times */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
              Times
            </h3>
            <ul className="space-y-2">
              {featuredTeams.map((team) => (
                <li key={team.slug}>
                  <Link
                    href={`/time/${team.slug}`}
                    className="text-sm text-gray-300 transition-colors hover:text-primary"
                  >
                    {team.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/time"
                  className="text-sm font-semibold text-primary transition-colors hover:text-white"
                >
                  Ver todos os times →
                </Link>
              </li>
            </ul>
          </div>

          {/* Institutional */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
              Institucional
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/sobre"
                  className="text-sm text-gray-300 transition-colors hover:text-primary"
                >
                  Sobre Nós
                </Link>
              </li>
              <li>
                <Link
                  href="/politica-de-privacidade"
                  className="text-sm text-gray-300 transition-colors hover:text-primary"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/termos-de-uso"
                  className="text-sm text-gray-300 transition-colors hover:text-primary"
                >
                  Termos de Uso
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
              Newsletter
            </h3>
            <p className="mb-3 text-sm text-gray-400">
              Receba as principais notícias do dia no seu e-mail.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-gray-500">
          <p>
            &copy; {new Date().getFullYear()} {siteConfig.name}. Todos os
            direitos reservados.
          </p>
          <p className="mt-1">
            As informações deste portal são agregadas de fontes públicas com a
            devida atribuição.
          </p>
        </div>
      </div>
    </footer>
  );
}
