"use client";

import Link from "next/link";
import { useState } from "react";
import { categories } from "@/lib/categories";
import { Logo } from "@/components/Logo";

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-secondary text-white shadow-lg">
      {/* Top bar */}
      <div className="bg-dark text-xs text-gray-400">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-1.5">
          <span>O melhor do futebol brasileiro, todos os dias</span>
          <div className="hidden gap-4 sm:flex">
            <Link href="/sobre" className="hover:text-white transition-colors">
              Sobre
            </Link>
            <Link href="/contato" className="hover:text-white transition-colors">
              Contato
            </Link>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/">
          <Logo />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="transition-colors hover:text-primary"
            >
              {cat.label}
            </Link>
          ))}
          <Link
            href="/categoria/opiniao"
            className="transition-colors hover:text-primary"
          >
            Opinião
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="lg:hidden p-2"
          aria-label="Menu"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            {menuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="border-t border-white/10 bg-secondary px-4 pb-4 lg:hidden">
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/categoria/${cat.slug}`}
              className="block py-2 text-sm transition-colors hover:text-primary"
              onClick={() => setMenuOpen(false)}
            >
              {cat.label}
            </Link>
          ))}
          <hr className="my-2 border-white/10" />
          <Link
            href="/sobre"
            className="block py-2 text-sm text-gray-400 hover:text-white"
            onClick={() => setMenuOpen(false)}
          >
            Sobre
          </Link>
        </nav>
      )}
    </header>
  );
}
