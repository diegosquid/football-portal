/**
 * Correção de nomes que vêm sem acento da apifootball.
 *
 * Só pra clube que aparece em tabela mas NÃO tem página no portal — quem está
 * em src/lib/teams.ts já ganha o nome canônico de lá. Cadastrar esses clubes
 * como time só pelo acento criaria dezenas de páginas vazias.
 *
 * Chave: nome exato como a API devolve.
 */
export const API_NAME_FIXES: Record<string, string> = {
  // Série C
  Anapolis: "Anápolis",
  Confianca: "Confiança",
  Ferroviaria: "Ferroviária",
  "Maringa FC": "Maringá",
  Maranhao: "Maranhão",
  "Paysandu PA": "Paysandu",
  "Ypiranga FC": "Ypiranga",
  "SER Caxias": "Caxias",
  "Floresta EC": "Floresta",
  "Barra FC": "Barra",
  "Inter de Limeira": "Inter de Limeira",
  "Santa Cruz": "Santa Cruz",
  Brusque: "Brusque",
  Guarani: "Guarani",
  Amazonas: "Amazonas",
  Figueirense: "Figueirense",
  Ituano: "Ituano",
  "Volta Redonda": "Volta Redonda",
  Itabaiana: "Itabaiana",
};

/** Sigla de 3 letras pros clubes sem cadastro — evita cortar no meio da palavra. */
export const API_SHORT_NAMES: Record<string, string> = {
  Anapolis: "ANA",
  Confianca: "CON",
  Ferroviaria: "FER",
  "Maringa FC": "MAR",
  Maranhao: "MRN",
  "Paysandu PA": "PAY",
  "Ypiranga FC": "YPI",
  "SER Caxias": "CAX",
  "Floresta EC": "FLO",
  "Barra FC": "BAR",
  "Inter de Limeira": "INT",
  "Santa Cruz": "SCR",
  Brusque: "BRU",
  Guarani: "GUA",
  Amazonas: "AMA",
  Figueirense: "FIG",
  Ituano: "ITU",
  "Volta Redonda": "VOL",
  Itabaiana: "ITA",
};
