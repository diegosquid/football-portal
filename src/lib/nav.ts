import { categories } from "@/lib/categories";

/**
 * Estrutura da navegação principal e a regra de "em que hub eu estou".
 *
 * Mora num módulo próprio, e não dentro do Header, por dois motivos: o Header é
 * client component e importar a copy inteira das competições só pra sublinhar
 * um item mandaria alguns KB de texto de FAQ pro bundle de TODAS as páginas; e
 * a regra de destaque é lógica, não marcação.
 *
 * Os caminhos abaixo repetem os que estão em standings-competitions.ts,
 * topscorers-competitions.ts e brackets-route.tsx. É a única duplicação aqui, e
 * é deliberada — quem cria uma landing nova já passa pelo nav de qualquer jeito.
 */
export interface NavItem {
  href: string;
  label: string;
  /** Outras rotas EXATAS que acendem este item. */
  also?: string[];
  /**
   * Prefixos que acendem este item. Só hierarquia de verdade, sempre com "/"
   * no fim: artigo mora na raiz (`/[slug]`), então um prefixo solto tipo
   * "/artilharia-" acenderia o nav numa matéria sobre artilharia.
   */
  under?: string[];
}

/** Item do "ao vivo" — tem estilo próprio, fica fora da lista comum. */
export const NAV_LIVE: NavItem = {
  href: "/jogos-futebol-hoje",
  label: "Jogos de hoje",
  also: ["/jogos-de-amanha", "/jogos-da-semana"],
  under: ["/jogos-futebol-hoje/", "/proximos-jogos/", "/onde-assistir/"],
};

/**
 * Linha 1 — ferramentas. O que o leitor VEM buscar (jogo, palpite, tabela).
 * Junto com NAV_LIVE, são 5 itens: cabem numa linha em qualquer desktop.
 */
export const NAV_TOOLS: NavItem[] = [
  {
    href: "/probabilidades",
    label: "Palpites",
    also: ["/metodologia-dos-palpites"],
    under: ["/probabilidades/"],
  },
  {
    href: "/tabela",
    label: "Tabelas",
    also: [
      "/tabela-do-brasileirao",
      "/tabela-do-brasileirao-serie-b",
      "/tabela-do-brasileirao-serie-c",
      "/chaveamento-da-copa-do-brasil",
      "/chaveamento-da-libertadores",
      "/chaveamento-da-sul-americana",
      "/estadios-do-brasileirao",
    ],
  },
  {
    href: "/artilharia-do-brasileirao",
    label: "Artilharia",
    also: [
      "/artilharia-do-brasileirao-serie-b",
      "/artilharia-da-libertadores",
    ],
  },
  {
    href: "/estatisticas",
    label: "Estatísticas",
    under: ["/estatisticas/"],
  },
];

/**
 * Landings que pertencem ao assunto de uma categoria mas moram na raiz.
 * Sem isso, o hub da Seleção não acende nada no menu.
 */
const CATEGORY_EXTRA_PATHS: Record<string, string[]> = {
  selecao: ["/selecao-brasileira", "/copa-do-mundo-feminina-2027"],
};

function categoryItem(slug: string, label: string): NavItem {
  return {
    href: `/categoria/${slug}`,
    label,
    also: CATEGORY_EXTRA_PATHS[slug],
    under: [`/categoria/${slug}/`],
  };
}

/**
 * Linha 2 — editorias. Onde o leitor navega DEPOIS de chegar.
 *
 * Cabem todas as categorias porque a segunda linha existe: antes, com uma linha
 * só, Seleção e Internacional ficavam de fora do desktop e Opinião era cortada
 * fora da tela. Estes links são o único caminho rastreável até as categorias —
 * o rodapé não linka nenhuma —, então esconder qualquer um sai caro.
 */
export const NAV_SECTIONS: NavItem[] = [
  ...categories.map((cat) => categoryItem(cat.slug, cat.label)),
  { href: "/time", label: "Times", under: ["/time/"] },
];

/**
 * O item corresponde à rota atual?
 *
 * `/categoria/opiniao` é exato e `/categoria/opiniao/pagina/2` entra pelo
 * prefixo — por isso os dois testes, e não um `startsWith` no href, que faria
 * "/time" acender em "/timeline-qualquer-coisa".
 */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  if (pathname === item.href) return true;
  if (item.also?.includes(pathname)) return true;
  return Boolean(item.under?.some((prefix) => pathname.startsWith(prefix)));
}
