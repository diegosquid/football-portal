/** Jogador na formação tática */
export interface Player {
  /** Número da camisa */
  number: number;
  /** Nome do jogador */
  name: string;
}

/** Formações suportadas */
export type FormationId =
  | "4-3-3"
  | "4-4-2"
  | "4-2-3-1"
  | "4-1-4-1"
  | "3-5-2"
  | "3-4-3"
  | "5-3-2"
  | "5-4-1"
  | "4-4-2-diamond"
  | "4-3-2-1";

/** Props do componente TacticalFormation */
export interface TacticalFormationProps {
  /** Formação (ex: "4-3-3") */
  formation: FormationId;
  /** Array de 11 jogadores: GK → defensores → meias → atacantes (L→R) */
  players?: Player[];
  /** Nome do time */
  team?: string;
  /** Cor principal do time (hex). Default: "#e94560" */
  color?: string;
  /** Cor de destaque para gradientes (hex). Auto-derivada se omitida */
  accentColor?: string;
  /** Título exibido acima do campo */
  title?: string;
  /** Exibir labels de posição (GK, CB, CM...). Default: true */
  showPositions?: boolean;
}

/** Coordenada de posição no campo (uso interno) */
export interface PositionCoord {
  /** X em % da largura do campo (0-100) */
  x: number;
  /** Y em % da altura do campo (0=gol próprio, 100=gol adversário) */
  y: number;
  /** Label da posição (GK, CB, CM, etc.) */
  label: string;
}
