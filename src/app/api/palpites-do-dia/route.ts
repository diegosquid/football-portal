import { NextResponse } from "next/server";
import { getProbabilitiesData } from "@/lib/probabilities";
import { getTodayBRT, formatDateShortBR } from "@/lib/matches";
import { siteConfig } from "@/lib/site";

export const revalidate = 900; // 15 min

/**
 * Mensagem do dia para notificação push.
 *
 * Consumido por dois lados:
 * 1. o Cron Trigger do Worker (decide se há o que notificar)
 * 2. o service worker no navegador (monta o texto da notificação)
 *
 * O push é enviado sem payload — o service worker busca aqui na hora de
 * exibir. Evita implementar a criptografia aes128gcm no Worker e garante
 * que o conteúdo mostrado esteja sempre fresco.
 */
export async function GET() {
  const data = await getProbabilitiesData();
  const today = getTodayBRT();
  const jogosHoje = (data?.predictions ?? []).filter((p) => p.date === today);

  const url = `${siteConfig.url}/probabilidades?utm_source=push&utm_medium=notification&utm_campaign=palpites_do_dia`;

  if (jogosHoje.length === 0) {
    return NextResponse.json({
      hasContent: false,
      title: "Beira do Campo",
      body: "Nenhum jogo com palpite para hoje. Veja a agenda da semana.",
      url: `${siteConfig.url}/jogos-da-semana`,
    });
  }

  // Destaque: o jogo com o favorito mais forte (a manchete mais interessante).
  const destaque = [...jogosHoje].sort(
    (a, b) =>
      Math.max(b.resultado.casa, b.resultado.fora) -
      Math.max(a.resultado.casa, a.resultado.fora),
  )[0];

  const favoritoCasa = destaque.resultado.casa >= destaque.resultado.fora;
  const favorito = favoritoCasa ? destaque.home : destaque.away;
  const chance = Math.round(
    (favoritoCasa ? destaque.resultado.casa : destaque.resultado.fora) * 100,
  );

  return NextResponse.json({
    hasContent: true,
    title: `Palpites de hoje (${formatDateShortBR(today)}) — ${jogosHoje.length} ${jogosHoje.length === 1 ? "jogo" : "jogos"}`,
    body: `${destaque.home} x ${destaque.away}: ${chance}% para o ${favorito}. Veja todos os palpites do modelo.`,
    url,
    gamesCount: jogosHoje.length,
  });
}
