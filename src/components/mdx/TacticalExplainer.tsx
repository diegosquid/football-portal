type TacticalExplainerVariant =
  | "formation-shift"
  | "wingback-triggers"
  | "vulnerable-spaces"
  | "block-heights";

interface TacticalExplainerProps {
  variant: TacticalExplainerVariant;
}

type Point = readonly [number, number];

const COLORS = {
  pitch: "#0d2f1f",
  pitchLight: "#17442f",
  chalk: "#f3efe3",
  lime: "#cdf463",
  ink: "#17251c",
  opponent: "#f3efe3",
  danger: "#e8622c",
  blue: "#79a9d1",
};

const DEFENDER = { fill: COLORS.pitchLight, stroke: COLORS.lime };
const OPPONENT = { fill: COLORS.opponent, stroke: COLORS.ink };

function Field({ compact = false }: { compact?: boolean }) {
  return (
    <>
      <rect width="320" height="210" rx="8" fill={COLORS.pitch} />
      <rect
        x="10"
        y="10"
        width="300"
        height="190"
        rx="2"
        fill="none"
        stroke={COLORS.chalk}
        strokeOpacity="0.42"
      />
      <line
        x1="10"
        y1="105"
        x2="310"
        y2="105"
        stroke={COLORS.chalk}
        strokeOpacity="0.34"
      />
      <circle
        cx="160"
        cy="105"
        r="26"
        fill="none"
        stroke={COLORS.chalk}
        strokeOpacity="0.34"
      />
      <rect
        x="78"
        y="155"
        width="164"
        height="45"
        fill="none"
        stroke={COLORS.chalk}
        strokeOpacity="0.42"
      />
      <rect
        x="118"
        y="180"
        width="84"
        height="20"
        fill="none"
        stroke={COLORS.chalk}
        strokeOpacity="0.42"
      />
      {!compact && (
        <>
          <rect
            x="78"
            y="10"
            width="164"
            height="45"
            fill="none"
            stroke={COLORS.chalk}
            strokeOpacity="0.34"
          />
          <rect
            x="118"
            y="10"
            width="84"
            height="20"
            fill="none"
            stroke={COLORS.chalk}
            strokeOpacity="0.34"
          />
        </>
      )}
    </>
  );
}

function Player({
  point,
  fill,
  stroke,
  r = 7,
}: {
  point: Point;
  fill: string;
  stroke: string;
  r?: number;
}) {
  return (
    <g>
      <circle
        cx={point[0]}
        cy={point[1]}
        r={r + 2}
        fill={COLORS.ink}
        fillOpacity="0.28"
      />
      <circle
        cx={point[0]}
        cy={point[1]}
        r={r}
        fill={fill}
        stroke={stroke}
        strokeWidth="2"
      />
    </g>
  );
}

function Ball({ point }: { point: Point }) {
  return (
    <g>
      <circle
        cx={point[0]}
        cy={point[1]}
        r="4.5"
        fill={COLORS.chalk}
        stroke={COLORS.ink}
        strokeWidth="1.4"
      />
      <circle cx={point[0]} cy={point[1]} r="1.4" fill={COLORS.ink} />
    </g>
  );
}

function Arrow({
  from,
  to,
  color = COLORS.lime,
  dashed = false,
  curved = false,
}: {
  from: Point;
  to: Point;
  color?: string;
  dashed?: boolean;
  curved?: boolean;
}) {
  const angle = Math.atan2(to[1] - from[1], to[0] - from[0]);
  const size = 7;
  const arrowPointA: Point = [
    to[0] - size * Math.cos(angle - Math.PI / 6),
    to[1] - size * Math.sin(angle - Math.PI / 6),
  ];
  const arrowPointB: Point = [
    to[0] - size * Math.cos(angle + Math.PI / 6),
    to[1] - size * Math.sin(angle + Math.PI / 6),
  ];
  const curveX = (from[0] + to[0]) / 2;
  const curveY = Math.min(from[1], to[1]) - 34;

  return (
    <g>
      {curved ? (
        <path
          d={`M ${from[0]} ${from[1]} Q ${curveX} ${curveY} ${to[0]} ${to[1]}`}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={dashed ? "7 6" : undefined}
        />
      ) : (
        <line
          x1={from[0]}
          y1={from[1]}
          x2={to[0]}
          y2={to[1]}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={dashed ? "7 6" : undefined}
        />
      )}
      <polygon
        points={`${to[0]},${to[1]} ${arrowPointA[0]},${arrowPointA[1]} ${arrowPointB[0]},${arrowPointB[1]}`}
        fill={color}
      />
    </g>
  );
}

function PitchPanel({
  label,
  note,
  children,
}: {
  label: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-ink/10 bg-cal p-2.5">
      <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
        <h4 className="m-0 font-display text-sm font-bold text-ink">{label}</h4>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-gray-500">
          {note}
        </span>
      </div>
      <svg
        viewBox="0 0 320 210"
        className="block h-auto w-full"
        aria-hidden="true"
      >
        <Field />
        {children}
      </svg>
    </div>
  );
}

function FormationShift() {
  const onBall: Point[] = [
    [160, 187],
    [88, 157],
    [160, 151],
    [232, 157],
    [30, 108],
    [120, 112],
    [200, 112],
    [290, 108],
    [64, 48],
    [160, 40],
    [256, 48],
  ];
  const offBall: Point[] = [
    [160, 187],
    [38, 157],
    [98, 153],
    [160, 151],
    [222, 153],
    [282, 157],
    [38, 96],
    [120, 101],
    [200, 101],
    [282, 96],
    [160, 42],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <PitchPanel label="Com a bola" note="3-4-3">
        {onBall.map((point, index) => (
          <Player
            key={index}
            point={point}
            {...DEFENDER}
            stroke={index === 4 || index === 7 ? COLORS.chalk : COLORS.lime}
          />
        ))}
        <Arrow from={[30, 108]} to={[30, 143]} color={COLORS.chalk} dashed />
        <Arrow from={[290, 108]} to={[290, 143]} color={COLORS.chalk} dashed />
      </PitchPanel>
      <PitchPanel label="Sem a bola" note="5-4-1">
        {offBall.map((point, index) => (
          <Player
            key={index}
            point={point}
            {...DEFENDER}
            stroke={index === 1 || index === 5 ? COLORS.chalk : COLORS.lime}
          />
        ))}
        <line
          x1="31"
          y1="170"
          x2="289"
          y2="170"
          stroke={COLORS.lime}
          strokeWidth="2"
          strokeDasharray="5 5"
          opacity="0.8"
        />
      </PitchPanel>
    </div>
  );
}

function TriggerCard({
  number,
  label,
  note,
  children,
}: {
  number: string;
  label: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-ink/10 bg-cal p-2.5">
      <div className="mb-2 flex gap-2 px-1">
        <span className="font-mono text-xs font-bold text-primary">{number}</span>
        <div>
          <h4 className="m-0 font-display text-sm font-bold text-ink">{label}</h4>
          <p className="m-0 mt-0.5 text-xs leading-snug text-gray-600">{note}</p>
        </div>
      </div>
      <svg viewBox="0 0 320 210" className="block h-auto w-full" aria-hidden="true">
        <Field compact />
        {children}
      </svg>
    </div>
  );
}

function WingbackTriggers() {
  const backThree: Point[] = [
    [104, 164],
    [160, 158],
    [216, 164],
  ];

  return (
    <div className="grid gap-3 md:grid-cols-3">
      <TriggerCard number="01" label="Passe no ponta" note="encurtar ou proteger o fundo">
        {backThree.map((point, index) => (
          <Player key={index} point={point} {...DEFENDER} />
        ))}
        <Player point={[274, 157]} {...DEFENDER} stroke={COLORS.chalk} />
        <Player point={[285, 92]} {...OPPONENT} />
        <Ball point={[285, 92]} />
        <Arrow from={[274, 148]} to={[282, 105]} />
        <Arrow from={[216, 158]} to={[244, 146]} color={COLORS.blue} dashed />
      </TriggerCard>

      <TriggerCard number="02" label="Ultrapassagem" note="pedir ajuda no corredor">
        {backThree.map((point, index) => (
          <Player key={index} point={point} {...DEFENDER} />
        ))}
        <Player point={[274, 157]} {...DEFENDER} stroke={COLORS.chalk} />
        <Player point={[285, 103]} {...OPPONENT} />
        <Player point={[252, 72]} {...OPPONENT} />
        <Player point={[229, 114]} {...DEFENDER} />
        <Ball point={[285, 103]} />
        <Arrow from={[229, 108]} to={[259, 88]} />
        <Arrow from={[252, 72]} to={[288, 48]} color={COLORS.chalk} dashed />
      </TriggerCard>

      <TriggerCard number="03" label="Inversão longa" note="ajustar enquanto a bola viaja">
        {backThree.map((point, index) => (
          <Player key={index} point={point} {...DEFENDER} />
        ))}
        <Player point={[46, 153]} {...DEFENDER} stroke={COLORS.chalk} />
        <Player point={[274, 153]} {...DEFENDER} stroke={COLORS.chalk} />
        <Player point={[36, 72]} {...OPPONENT} />
        <Player point={[282, 72]} {...OPPONENT} />
        <Ball point={[36, 72]} />
        <Arrow from={[46, 145]} to={[75, 151]} />
        <Arrow from={[42, 68]} to={[275, 68]} color={COLORS.chalk} dashed curved />
      </TriggerCard>
    </div>
  );
}

function VulnerableSpaces() {
  const defenders: Point[] = [
    [35, 164],
    [96, 157],
    [160, 153],
    [224, 157],
    [285, 164],
  ];
  const midfielders: Point[] = [
    [88, 99],
    [160, 89],
    [232, 99],
  ];

  return (
    <div className="border border-ink/10 bg-cal p-2.5 sm:p-3">
      <svg
        viewBox="0 0 640 340"
        className="block h-auto w-full"
        role="img"
        aria-label="Linha de cinco diante da área com zonas vulneráveis destacadas na entrada da área e entre alas e zagueiros externos"
      >
        <rect width="640" height="340" rx="10" fill={COLORS.pitch} />
        <rect
          x="18"
          y="18"
          width="604"
          height="304"
          fill="none"
          stroke={COLORS.chalk}
          strokeOpacity="0.42"
        />
        <rect
          x="157"
          y="228"
          width="326"
          height="94"
          fill="none"
          stroke={COLORS.chalk}
          strokeOpacity="0.42"
        />
        <rect
          x="234"
          y="282"
          width="172"
          height="40"
          fill="none"
          stroke={COLORS.chalk}
          strokeOpacity="0.42"
        />
        <path
          d="M 195 228 A 125 125 0 0 0 445 228"
          fill="none"
          stroke={COLORS.chalk}
          strokeOpacity="0.42"
        />

        <rect
          x="205"
          y="138"
          width="230"
          height="60"
          rx="30"
          fill={COLORS.danger}
          fillOpacity="0.28"
          stroke={COLORS.danger}
          strokeWidth="2"
          strokeDasharray="7 6"
        />
        <ellipse
          cx="126"
          cy="244"
          rx="38"
          ry="67"
          fill={COLORS.danger}
          fillOpacity="0.2"
          transform="rotate(-18 126 244)"
        />
        <ellipse
          cx="514"
          cy="244"
          rx="38"
          ry="67"
          fill={COLORS.danger}
          fillOpacity="0.2"
          transform="rotate(18 514 244)"
        />

        {defenders.map(([x, y], index) => (
          <Player key={`d-${index}`} point={[x * 2, y * 1.65]} {...DEFENDER} r={10} />
        ))}
        {midfielders.map(([x, y], index) => (
          <Player key={`m-${index}`} point={[x * 2, y * 1.45]} {...DEFENDER} r={10} />
        ))}
        <Player point={[320, 173]} {...OPPONENT} r={10} />
        <Player point={[245, 221]} {...OPPONENT} r={10} />
        <Player point={[395, 221]} {...OPPONENT} r={10} />
        <Ball point={[320, 173]} />

        <g fontFamily="var(--font-spline-mono), ui-monospace" textAnchor="middle">
          <text x="320" y="100" fill={COLORS.chalk} fontSize="13" fontWeight="700">
            ESPAÇO À FRENTE DA LINHA
          </text>
          <text x="112" y="316" fill={COLORS.chalk} fontSize="11" fontWeight="700">
            ALA ↔ ZAGUEIRO
          </text>
          <text x="528" y="316" fill={COLORS.chalk} fontSize="11" fontWeight="700">
            ZAGUEIRO ↔ ALA
          </text>
        </g>
      </svg>
    </div>
  );
}

function BlockPanel({
  label,
  note,
  y,
  bandY,
}: {
  label: string;
  note: string;
  y: number;
  bandY: number;
}) {
  const lastLine: Point[] = [
    [38, y],
    [99, y - 4],
    [160, y - 6],
    [221, y - 4],
    [282, y],
  ];
  const middleLine: Point[] = [
    [52, y - 50],
    [124, y - 55],
    [196, y - 55],
    [268, y - 50],
  ];
  const forward: Point = [160, Math.max(26, y - 99)];

  return (
    <PitchPanel label={label} note={note}>
      <rect
        x="11"
        y={bandY}
        width="298"
        height={198 - bandY}
        fill={COLORS.lime}
        fillOpacity="0.09"
      />
      <line
        x1="11"
        y1={y + 13}
        x2="309"
        y2={y + 13}
        stroke={COLORS.lime}
        strokeWidth="2"
        strokeDasharray="6 5"
      />
      {lastLine.map((point, index) => (
        <Player key={`d-${index}`} point={point} {...DEFENDER} />
      ))}
      {middleLine.map((point, index) => (
        <Player key={`m-${index}`} point={point} {...DEFENDER} />
      ))}
      <Player point={forward} {...DEFENDER} />
    </PitchPanel>
  );
}

function BlockHeights() {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <BlockPanel label="Bloco baixo" note="proteger a área" y={166} bandY={112} />
      <BlockPanel label="Bloco médio" note="induzir para fora" y={137} bandY={80} />
      <BlockPanel label="Bloco alto" note="fechar o volante" y={108} bandY={50} />
    </div>
  );
}

const EXPLAINERS: Record<
  TacticalExplainerVariant,
  {
    eyebrow: string;
    title: string;
    caption: string;
    description: string;
    content: React.ReactNode;
  }
> = {
  "formation-shift": {
    eyebrow: "Mudança de comportamento",
    title: "Os alas transformam o desenho",
    caption:
      "Os mesmos onze jogadores podem atacar em 3-4-3 e defender em 5-4-1. A formação muda quando os alas percorrem o corredor e completam a última linha.",
    description:
      "Comparação entre uma equipe atacando em 3-4-3 e a mesma equipe defendendo em 5-4-1, com os alas recuados.",
    content: <FormationShift />,
  },
  "wingback-triggers": {
    eyebrow: "Leitura do corredor",
    title: "Os três gatilhos do ala",
    caption:
      "O ala não corre para trás por reflexo: ele lê a recepção do ponta, a ultrapassagem e o tempo da inversão para decidir quem pressiona e quem cobre.",
    description:
      "Três diagramas mostram a reação do ala ao passe no ponta, à ultrapassagem do lateral e a uma inversão longa.",
    content: <WingbackTriggers />,
  },
  "vulnerable-spaces": {
    eyebrow: "Mapa de risco",
    title: "Cinco atrás não fecham todos os espaços",
    caption:
      "A área fica povoada, mas a entrada da área e os intervalos entre ala e zagueiro externo aparecem quando meio-campo e defesa deixam de encurtar juntos.",
    description:
      "Mapa tático destaca a entrada da área e os dois intervalos entre alas e zagueiros externos como espaços vulneráveis.",
    content: <VulnerableSpaces />,
  },
  "block-heights": {
    eyebrow: "Altura de marcação",
    title: "Linha de cinco não significa bloco baixo",
    caption:
      "O número de defensores descreve a última linha; a altura do bloco mostra onde a equipe escolhe pressionar e recuperar a bola.",
    description:
      "Três diagramas comparam uma linha de cinco em bloco baixo, médio e alto.",
    content: <BlockHeights />,
  },
};

export function TacticalExplainer({ variant }: TacticalExplainerProps) {
  const explainer = EXPLAINERS[variant];

  return (
    <figure
      className="not-prose my-10 overflow-hidden border border-ink/15 bg-gray-50 shadow-[0_18px_45px_rgba(13,47,31,0.08)]"
      role="group"
      aria-label={explainer.description}
    >
      <header className="border-b border-ink/10 px-4 py-4 sm:px-6">
        <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
          Prancheta · {explainer.eyebrow}
        </span>
        <h3 className="m-0 mt-1 font-display text-xl font-bold tracking-tight text-ink sm:text-2xl">
          {explainer.title}
        </h3>
      </header>

      <div className="p-3 sm:p-5">{explainer.content}</div>

      <figcaption className="border-l-2 border-lima px-4 py-3 font-mono text-[11px] leading-relaxed text-gray-600 sm:px-5">
        {explainer.caption}
      </figcaption>
    </figure>
  );
}
