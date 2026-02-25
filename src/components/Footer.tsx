import Link from "next/link";
import { categories } from "@/lib/categories";
import { siteConfig } from "@/lib/site";
import { NewsletterForm } from "@/components/NewsletterForm";
import { Logo } from "@/components/Logo";

export function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/">
              <Logo />
            </Link>
            <p className="mt-3 text-sm text-gray-400">
              {siteConfig.description}
            </p>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-400">
              Categorias
            </h3>
            <ul className="space-y-2">
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
