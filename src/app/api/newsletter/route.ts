import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/**
 * Inscrição na newsletter.
 *
 * Migrando do Supabase para o D1 (Cloudflare). Quando API_URL está
 * configurado, encaminha para o Worker; senão cai no Supabase, o que
 * permite fazer o corte sem janela de indisponibilidade.
 *
 * Depois que todos os e-mails estiverem no D1 (scripts/migrate-newsletter.js),
 * basta remover o bloco do Supabase e a dependência @supabase/supabase-js.
 */
const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email é obrigatório." }, { status: 400 });
    }
    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Email inválido." }, { status: 400 });
    }

    const normalized = email.toLowerCase().trim();

    // Caminho novo: Cloudflare Worker + D1
    if (API_URL) {
      const res = await fetch(`${API_URL}/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalized }),
      });
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data, { status: res.status });
    }

    // Caminho antigo: Supabase (removível após a migração)
    const { error } = await supabase
      .from("subscribers")
      .insert({ email: normalized });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Este email já está cadastrado." },
          { status: 409 },
        );
      }
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Erro ao cadastrar. Tente novamente." },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Inscrito com sucesso!" }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Erro interno do servidor." }, { status: 500 });
  }
}
