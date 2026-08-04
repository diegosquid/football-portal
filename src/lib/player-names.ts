/**
 * Correção de nomes de jogador vindos da apifootball.
 *
 * A fonte guarda boa parte dos nomes invertidos — "Sobrenome Nome":
 * "Henrique Bruno" é o Bruno Henrique, "Jorge Kaio" é o Kaio Jorge,
 * "Arrascaeta de" é o De Arrascaeta. Não dá pra corrigir por regra: "Johan
 * Carbonero" vem certo e "Kennedy John" vem invertido, e os dois são só
 * "Palavra Palavra". Por isso é mapa na mão, igual ao de clubes em
 * src/lib/standings-names.ts.
 *
 * Chave: nome EXATO como a API devolve. Nome fora do mapa é exibido como veio —
 * errar pra menos (nome estranho) é melhor que inventar jogador.
 *
 * Manutenção: `node scripts/build-topscorers.js --unmapped` lista os nomes de
 * artilheiro que ainda não passaram por aqui. Vale revisar a cada janela.
 */
export const PLAYER_NAME_FIXES: Record<string, string> = {
  // ---- Série A ----
  "Arrascaeta de": "De Arrascaeta",
  "Henrique Bruno": "Bruno Henrique",
  "Paqueta Lucas": "Lucas Paquetá",
  "Barbosa Gabriel": "Gabriel Barbosa",
  "Cabral Arthur": "Arthur Cabral",
  "Kennedy John": "John Kennedy",
  "Vinicius Carlos": "Carlos Vinícius",
  "Lopes Breno": "Breno Lopes",
  "Jorge Kaio": "Kaio Jorge",
  "Roque Vitor": "Vitor Roque",
  "Jose Lopez": "José López",
  "Patrick Alan": "Alan Patrick",
  "Hugo Victor": "Victor Hugo",
  "Lino Samuel": "Samuel Lino",
  "Pereira Matheus": "Matheus Pereira",
  "Juba Luciano": "Luciano Juba",
  "Manga Alef": "Alef Manga",
  "Castillo Rodrigo": "Rodrigo Castillo",
  "Capixaba Juninho": "Juninho Capixaba",
  "Duarte David": "David Duarte",
  "Formiga Igor": "Igor Formiga",
  "Teixeira dos Santos Matheus": "Matheus Teixeira",
  "Jose Willian": "Willian José",
  "Henrique Gustavo": "Gustavo Henrique",
  "Kayzer Renato": "Renato Kayzer",
  "Mendes Thiago": "Thiago Mendes",
  "Raul Pedro": "Pedro Raul",
  "Alvaro Barreal": "Álvaro Barreal",
  "Alexandro Bernabei": "Alexandro Bernabéi",
  "Benjamin Rollheiser": "Benjamín Rollheiser",
  "Carlos Gomez": "Carlos Gómez",
  Mauricio: "Maurício",

  // ---- Série B ----
  "Rocha Pedro": "Pedro Rocha",
  "Santos Bruno": "Bruno Santos",
  "Barletta Chrystian": "Chrystian Barletta",
  "Coutinho Gustavo": "Gustavo Coutinho",
  "Ramon Anselmo": "Anselmo Ramon",
  "Taliari Gabriel": "Gabriel Taliari",
  "Bigode Willian": "Willian Bigode",
  "Goncalves Diego": "Diego Gonçalves",
  "Mastriani Gonzalo": "Gonzalo Mastriani",
  "Pottker William": "William Pottker",
  "Belmonte Dadá": "Dadá Belmonte",
  "Castro Pedro": "Pedro Castro",
  "Penha Daniel": "Daniel Penha",
  "Gava Rafael": "Rafael Gava",
  "Brey Patrick": "Patrick Brey",
  "Silva Rafa": "Rafa Silva",
  "Tavares Ronaldo": "Ronaldo Tavares",
  "Safira Alisson": "Alisson Safira",
  "Oyama Luís": "Luís Oyama",
  "Jaco Leo": "Léo Jacó",
  "Luccas Ian": "Ian Luccas",
  "Lucas Jean": "Jean Lucas",
  "Gabriel João": "João Gabriel",
  "Gabriel Marquinhos": "Marquinhos Gabriel",
  "Pereira Hildeberto": "Hildeberto Pereira",
  "Paulo Marcos": "Marcos Paulo",
  "Luiz André": "André Luiz",
  "Luís André": "André Luís",
  "Samuel Vitor": "Vitor Samuel",
  "Bautista Juan": "Juan Bautista",
  Carlao: "Carlão",
  Jaja: "Jajá",
  Cleber: "Cléber",

  // ---- Libertadores ----
  "Villa Sebastián": "Sebastián Villa",
  "Zapiola Franco": "Franco Zapiola",
};

/** Nome de exibição de um jogador — corrigido quando está no mapa. */
export function displayPlayerName(apiName: string): string {
  const clean = apiName.trim();
  return PLAYER_NAME_FIXES[clean] ?? clean;
}
