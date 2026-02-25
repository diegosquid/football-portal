/**
 * Banco de imagens curadas e verificadas para o portal.
 *
 * Todas as URLs abaixo foram testadas manualmente e retornam HTTP 200.
 * Fonte: Unsplash (licença gratuita para uso comercial e editorial).
 *
 * O cron job deve usar estas imagens como fallback quando não conseguir
 * uma imagem específica para o artigo.
 */

const UNSPLASH_PARAMS = "?w=800&h=450&fit=crop";

/** Imagens verificadas organizadas por categoria */
export const imageCatalog: Record<string, string[]> = {
  brasileirao: [
    `https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d${UNSPLASH_PARAMS}`, // bola de futebol em campo
    `https://images.unsplash.com/photo-1553778263-73a83bab9b0c${UNSPLASH_PARAMS}`, // campo de futebol vista aérea
    `https://images.unsplash.com/photo-1551958219-acbc608c6377${UNSPLASH_PARAMS}`, // jogadores em ação
    `https://images.unsplash.com/photo-1575361204480-aadea25e6e68${UNSPLASH_PARAMS}`, // futebol jogada
  ],
  transferencias: [
    `https://images.unsplash.com/photo-1579952363873-27f3bade9f55${UNSPLASH_PARAMS}`, // bola com fundo dramático
    `https://images.unsplash.com/photo-1459865264687-595d652de67e${UNSPLASH_PARAMS}`, // estádio panorâmica
    `https://images.unsplash.com/photo-1486286701208-1d58e9338013${UNSPLASH_PARAMS}`, // campo de futebol close
  ],
  analises: [
    `https://images.unsplash.com/photo-1553778263-73a83bab9b0c${UNSPLASH_PARAMS}`, // campo vista aérea (tática)
    `https://images.unsplash.com/photo-1540747913346-19e32dc3e97e${UNSPLASH_PARAMS}`, // campo com marcações
    `https://images.unsplash.com/photo-1606925797300-0b35e9d1794e${UNSPLASH_PARAMS}`, // bola em ação
  ],
  champions: [
    `https://images.unsplash.com/photo-1522778119026-d647f0596c20${UNSPLASH_PARAMS}`, // estádio europeu luzes
    `https://images.unsplash.com/photo-1517466787929-bc90951d0974${UNSPLASH_PARAMS}`, // estádio noturno
    `https://images.unsplash.com/photo-1459865264687-595d652de67e${UNSPLASH_PARAMS}`, // grande estádio
  ],
  libertadores: [
    `https://images.unsplash.com/photo-1574629810360-7efbbe195018${UNSPLASH_PARAMS}`, // Maracanã / estádio grande
    `https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9${UNSPLASH_PARAMS}`, // torcida no estádio
    `https://images.unsplash.com/photo-1518604666860-9ed391f76460${UNSPLASH_PARAMS}`, // futebol noite
  ],
  selecao: [
    `https://images.unsplash.com/photo-1574629810360-7efbbe195018${UNSPLASH_PARAMS}`, // grande estádio
    `https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9${UNSPLASH_PARAMS}`, // torcida
    `https://images.unsplash.com/photo-1529900748604-07564a03e7a6${UNSPLASH_PARAMS}`, // esporte ação
  ],
  "futebol-internacional": [
    `https://images.unsplash.com/photo-1522778119026-d647f0596c20${UNSPLASH_PARAMS}`, // estádio europeu
    `https://images.unsplash.com/photo-1517466787929-bc90951d0974${UNSPLASH_PARAMS}`, // estádio noturno
    `https://images.unsplash.com/photo-1556056504-5c7696c4c28d${UNSPLASH_PARAMS}`, // futebol europeu
    `https://images.unsplash.com/photo-1543326727-cf6c39e8f84c${UNSPLASH_PARAMS}`, // campo europeu
  ],
  opiniao: [
    `https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9${UNSPLASH_PARAMS}`, // torcida
    `https://images.unsplash.com/photo-1560272564-c83b66b1ad12${UNSPLASH_PARAMS}`, // estádio atmosfera
    `https://images.unsplash.com/photo-1471295253337-3ceaaedca402${UNSPLASH_PARAMS}`, // esporte genérico
  ],
  estatisticas: [
    `https://images.unsplash.com/photo-1551958219-acbc608c6377${UNSPLASH_PARAMS}`, // jogadores em ação
    `https://images.unsplash.com/photo-1540747913346-19e32dc3e97e${UNSPLASH_PARAMS}`, // campo vista
    `https://images.unsplash.com/photo-1606925797300-0b35e9d1794e${UNSPLASH_PARAMS}`, // ação com bola
  ],
};

/** Imagens genéricas de futebol para qualquer contexto */
const genericFallbacks = [
  `https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d${UNSPLASH_PARAMS}`,
  `https://images.unsplash.com/photo-1574629810360-7efbbe195018${UNSPLASH_PARAMS}`,
  `https://images.unsplash.com/photo-1553778263-73a83bab9b0c${UNSPLASH_PARAMS}`,
  `https://images.unsplash.com/photo-1579952363873-27f3bade9f55${UNSPLASH_PARAMS}`,
  `https://images.unsplash.com/photo-1522778119026-d647f0596c20${UNSPLASH_PARAMS}`,
  `https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9${UNSPLASH_PARAMS}`,
  `https://images.unsplash.com/photo-1551958219-acbc608c6377${UNSPLASH_PARAMS}`,
  `https://images.unsplash.com/photo-1517466787929-bc90951d0974${UNSPLASH_PARAMS}`,
];

/**
 * Retorna uma imagem de fallback para a categoria.
 * Usa um índice baseado na data para variar as imagens ao longo dos dias.
 */
export function getFallbackImage(category?: string): string {
  const pool = (category && imageCatalog[category]) || genericFallbacks;
  const dayIndex = new Date().getDate() % pool.length;
  return pool[dayIndex];
}

/**
 * Retorna uma imagem aleatória do banco genérico.
 */
export function getRandomFallback(): string {
  const index = Math.floor(Math.random() * genericFallbacks.length);
  return genericFallbacks[index];
}

/**
 * Imagem padrão para quando não há nenhuma outra disponível.
 * Esta URL foi verificada e é estável.
 */
export const DEFAULT_ARTICLE_IMAGE = `https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d${UNSPLASH_PARAMS}`;
