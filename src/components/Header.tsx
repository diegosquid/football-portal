"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/Logo";
import {
  isNavItemActive,
  NAV_LIVE,
  NAV_SECTIONS,
  NAV_TOOLS,
  type NavItem,
} from "@/lib/nav";

/**
 * Item do menu mobile. A página atual é marcada por sublinhado, não por cor:
 * metade dos itens já é lima o tempo todo, então cor sozinha não distinguiria.
 */
function MobileNavLink({
  item,
  marker,
  tone,
  active,
  animation,
  onNavigate,
}: {
  item: NavItem;
  marker: string;
  tone: "lima" | "cal";
  active: boolean;
  animation: string;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={`${animation} flex items-baseline gap-4 border-b border-cal/10 py-4`}
    >
      {/* O marcador continua sendo o número: trocar por um símbolo no item
          ativo abria um buraco na sequência (05, ■, 07). Quem marca a página
          atual é o sublinhado; aqui só a cor muda. */}
      <span
        className={`font-mono text-xs ${
          active || tone === "lima" ? "text-lima" : "text-cal/40"
        }`}
      >
        {marker}
      </span>
      <span
        className={`font-display text-3xl font-extrabold uppercase tracking-tight transition-colors ${
          tone === "lima" ? "text-lima" : "text-cal hover:text-lima"
        } ${
          active
            ? "underline decoration-lima decoration-2 underline-offset-[6px]"
            : ""
        }`}
      >
        {item.label}
      </span>
    </Link>
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname() ?? "/";

  /**
   * `aria-current` faz as duas coisas de uma vez: anuncia a página atual pro
   * leitor de tela e é o seletor que fixa a régua do `.hover-line`
   * (globals.css). Assim o destaque visual não tem como divergir do estado real.
   */
  const current = (item: NavItem) =>
    isNavItemActive(item, pathname) ? ("page" as const) : undefined;

  return (
    <>
      {/* Microbarra */}
      <div className="bg-campo-deep font-mono text-[11px] uppercase tracking-[0.2em] text-cal/50">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <span className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 bg-lima" />
            O melhor do futebol, todos os dias
          </span>
          <div className="hidden gap-5 sm:flex">
            <Link href="/sobre" className="transition-colors hover:text-lima">
              Sobre
            </Link>
            <Link href="/contato" className="transition-colors hover:text-lima">
              Contato
            </Link>
            <a href="/feed.xml" className="transition-colors hover:text-lima">
              RSS
            </a>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <div className="bg-campo">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:py-5">
          <Link href="/" aria-label="Beira do Campo — Início">
            <Logo />
          </Link>

          <p className="hidden font-serif text-lg italic text-cal/50 lg:block">
            O jogo inteiro, contado de onde ele acontece.
          </p>

          {/* Botão do menu mobile */}
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-end gap-1.5 p-2 lg:hidden"
            aria-label="Abrir menu"
          >
            <span className="block h-0.5 w-7 bg-cal" />
            <span className="block h-0.5 w-5 bg-lima" />
            <span className="block h-0.5 w-7 bg-cal" />
          </button>
        </div>
      </div>

      {/*
        Navegação fixa em duas faixas: ferramentas em cima, editorias embaixo.
        Antes era uma linha só com 12 itens rolando na horizontal sem barra de
        rolagem visível — "Opinião" simplesmente não existia pra quem não
        arrastasse, e Seleção e Internacional nem entravam.

        No mobile fica só o atalho ao vivo: o resto seria repetição do menu
        cheio, que já abre no hambúrguer. Os links das duas faixas continuam no
        HTML (escondidos por CSS, não removidos), porque são o único caminho
        rastreável até as categorias.
      */}
      <nav
        aria-label="Navegação principal"
        className="sticky top-0 z-40 border-y border-lima/20 bg-campo/95 backdrop-blur-sm"
      >
        <div className="mx-auto max-w-7xl px-1 sm:px-4">
          {/* Faixa 1 — ferramentas */}
          <div className="flex items-center">
            <Link
              href={NAV_LIVE.href}
              aria-current={current(NAV_LIVE)}
              className="hover-line flex shrink-0 items-center gap-2 px-3 py-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-lima transition-colors hover:text-cal"
            >
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lima opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-lima" />
              </span>
              {NAV_LIVE.label}
            </Link>

            {NAV_TOOLS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current(item)}
                className={`hover-line hidden shrink-0 px-3 py-3 text-[13px] font-semibold uppercase tracking-wide transition-colors hover:text-cal lg:block ${
                  current(item) ? "text-cal" : "text-cal/80"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Faixa 2 — editorias */}
          <div className="hidden items-center border-t border-lima/10 lg:flex">
            {NAV_SECTIONS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current(item)}
                className={`hover-line-sm shrink-0 px-3 py-2 text-[12px] font-semibold uppercase tracking-wide transition-colors hover:text-cal ${
                  current(item) ? "text-cal" : "text-cal/60"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Menu mobile em tela cheia */}
      {menuOpen && (
        <div className="fixed inset-0 z-[80] flex flex-col overflow-y-auto bg-campo-deep px-6 py-5 lg:hidden">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              onClick={() => setMenuOpen(false)}
              aria-label="Beira do Campo — Início"
            >
              <Logo />
            </Link>
            <button
              onClick={() => setMenuOpen(false)}
              className="flex h-11 w-11 items-center justify-center border border-cal/20 text-cal transition-colors hover:border-lima hover:text-lima"
              aria-label="Fechar menu"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <nav className="mt-10 flex flex-col">
            <MobileNavLink
              item={NAV_LIVE}
              marker="00"
              tone="lima"
              active={Boolean(current(NAV_LIVE))}
              animation="rise"
              onNavigate={() => setMenuOpen(false)}
            />
            {NAV_TOOLS.map((item) => (
              <MobileNavLink
                key={item.href}
                item={item}
                marker="•"
                tone="lima"
                active={Boolean(current(item))}
                animation="rise"
                onNavigate={() => setMenuOpen(false)}
              />
            ))}
            {NAV_SECTIONS.map((item, i) => (
              <MobileNavLink
                key={item.href}
                item={item}
                marker={String(i + 1).padStart(2, "0")}
                tone="cal"
                active={Boolean(current(item))}
                animation={i < 4 ? `rise-${i + 1}` : "rise-4"}
                onNavigate={() => setMenuOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-auto flex items-center justify-between pt-10">
            <Link
              href="/sobre"
              onClick={() => setMenuOpen(false)}
              className="font-mono text-xs uppercase tracking-[0.2em] text-cal/50 transition-colors hover:text-lima"
            >
              Sobre nós
            </Link>
            <p className="font-serif italic text-cal/40">
              beiradocampo.com.br
            </p>
          </div>
        </div>
      )}
    </>
  );
}
