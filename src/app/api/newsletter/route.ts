import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { error: "Email é obrigatório." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Email inválido." },
        { status: 400 },
      );
    }

    // Insert into Supabase
    const { error } = await supabase
      .from("subscribers")
      .insert({ email: email.toLowerCase().trim() });

    if (error) {
      // Unique constraint violation = already subscribed
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

    return NextResponse.json(
      { message: "Inscrito com sucesso!" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "Erro interno do servidor." },
      { status: 500 },
    );
  }
}
