"use client";

import Link from "next/link";
import { useState } from "react";
import { categories } from "@/lib/categories";
import { Logo } from "@/components/Logo";

const NAV_CATEGORIES = categories.slice(0, 5);

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

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

      {/* Navegação fixa */}
      <nav className="sticky top-0 z-40 border-y border-lima/20 bg-campo/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center overflow-x-auto px-1 sm:px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Link
            href="/jogos-futebol-hoje"
            className="flex shrink-0 items-center gap-2 px-3 py-3 font-mono text-xs font-bold uppercase tracking-[0.15em] text-lima transition-colors hover:text-cal"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lima opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-lima" />
            </span>
            Jogos de hoje
          </Link>

          {NAV_CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="hover-line shrink-0 px-3 py-3 text-[13px] font-semibold uppercase tracking-wide text-cal/80 transition-colors hover:text-cal"
            >
              {cat.label}
            </Link>
          ))}

          <Link
            href="/time"
            className="hover-line shrink-0 px-3 py-3 text-[13px] font-semibold uppercase tracking-wide text-cal/80 transition-colors hover:text-cal"
          >
            Times
          </Link>
          <Link
            href="/categoria/opiniao"
            className="hover-line shrink-0 px-3 py-3 text-[13px] font-semibold uppercase tracking-wide text-cal/80 transition-colors hover:text-cal"
          >
            Opinião
          </Link>
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
            <Link
              href="/jogos-futebol-hoje"
              onClick={() => setMenuOpen(false)}
              className="rise flex items-baseline gap-4 border-b border-cal/10 py-4"
            >
              <span className="font-mono text-xs text-lima">00</span>
              <span className="font-display text-3xl font-extrabold uppercase tracking-tight text-lima">
                Jogos de hoje
              </span>
            </Link>
            {categories.map((cat, i) => (
              <Link
                key={cat.slug}
                href={`/categoria/${cat.slug}`}
                onClick={() => setMenuOpen(false)}
                className={`flex items-baseline gap-4 border-b border-cal/10 py-4 ${
                  i < 4 ? `rise-${i + 1}` : "rise-4"
                }`}
              >
                <span className="font-mono text-xs text-cal/40">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="font-display text-3xl font-extrabold uppercase tracking-tight text-cal transition-colors hover:text-lima">
                  {cat.label}
                </span>
              </Link>
            ))}
            <Link
              href="/time"
              onClick={() => setMenuOpen(false)}
              className="rise-4 flex items-baseline gap-4 border-b border-cal/10 py-4"
            >
              <span className="font-mono text-xs text-cal/40">
                {String(categories.length + 1).padStart(2, "0")}
              </span>
              <span className="font-display text-3xl font-extrabold uppercase tracking-tight text-cal transition-colors hover:text-lima">
                Times
              </span>
            </Link>
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
