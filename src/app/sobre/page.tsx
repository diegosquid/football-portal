import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getAllAuthors } from "@/lib/authors";

export const metadata: Metadata = {
  title: "Sobre Nós",
  description:
    "Conheça a equipe editorial do Beira do Campo — jornalistas, analistas e colunistas apaixonados por futebol.",
  alternates: { canonical: "/sobre" },
};

export default function SobrePage() {
  const authors = getAllAuthors();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-black text-secondary lg:text-4xl">
        Sobre o Beira do Campo
      </h1>

      <div className="prose-article mt-6">
        <p>
          O <strong>Beira do Campo</strong> é um portal de notícias dedicado a
          trazer cobertura completa do futebol brasileiro e internacional. Nossa
          missão é entregar informação de qualidade, com análise, contexto e
          opinião para o torcedor que quer ir além do placar.
        </p>
        <p>
          Cobrimos diariamente o <strong>Brasileirão</strong>,{" "}
          <strong>Libertadores</strong>, <strong>Champions League</strong>,
          mercado de transferências e muito mais. Cada matéria passa por um
          rigoroso processo editorial que cruza múltiplas fontes, adiciona
          contexto histórico e estatístico, e oferece análises que você não
          encontra em outros portais.
        </p>

        <h2>Nossa Equipe</h2>
        <p>
          Somos um time de jornalistas, analistas e colunistas com décadas de
          experiência combinada no jornalismo esportivo brasileiro.
        </p>
      </div>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {authors.map((author) => (
          <Link
            key={author.slug}
            href={`/autor/${author.slug}`}
            className="group rounded-xl border border-gray-200 p-6 transition-all hover:border-primary hover:shadow-lg"
          >
            <div className="flex items-start gap-4">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20 transition-all group-hover:ring-primary/40 group-hover:ring-4">
                <Image
                  src={author.avatar}
                  alt={author.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>
              <div>
                <h3 className="font-bold text-secondary group-hover:text-primary">
                  {author.name}
                </h3>
                <p className="text-sm font-medium text-primary">
                  {author.role}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {author.specialty}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-gray-600">
                  {author.bio}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
