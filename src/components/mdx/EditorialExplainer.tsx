import { ExplainerFrame } from "./ExplainerFrame";

type EditorialExplainerVariant =
  | "saot-decision-path"
  | "saot-equal-criteria";

interface EditorialExplainerProps {
  variant: EditorialExplainerVariant;
}

type Point = readonly [number, number];

const COLORS = {
  pitch: "#0d2f1f",
  pitchLight: "#17442f",
  chalk: "#f3efe3",
  lime: "#cdf463",
  ink: "#17251c",
  danger: "#e8622c",
  blue: "#79a9d1",
};

function Marker({
  point,
  fill,
  stroke,
}: {
  point: Point;
  fill: string;
  stroke: string;
}) {
  return (
    <g>
      <circle cx={point[0]} cy={point[1]} r="12" fill={COLORS.ink} fillOpacity="0.28" />
      <circle
        cx={point[0]}
        cy={point[1]}
        r="10"
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
      <circle cx={point[0]} cy={point[1]} r="5" fill={COLORS.chalk} stroke={COLORS.ink} />
      <circle cx={point[0]} cy={point[1]} r="1.5" fill={COLORS.ink} />
    </g>
  );
}

function SaotDecisionPath() {
  const cameras: Point[] = [
    [84, 66],
    [174, 42],
    [266, 66],
    [356, 42],
    [448, 66],
    [538, 42],
  ];

  return (
    <div className="border border-ink/10 bg-cal p-2.5 sm:p-3">
      <svg
        viewBox="0 0 640 310"
        className="block h-auto w-full"
        role="img"
        aria-label="Câmeras captam o lance, o sistema identifica o passe e a posição dos jogadores, e o VAR valida a decisão"
      >
        <rect width="640" height="310" rx="10" fill={COLORS.pitch} />
        <path
          d="M 26 108 H 614 V 194 H 26 Z"
          fill={COLORS.pitchLight}
          stroke={COLORS.chalk}
          strokeOpacity="0.38"
        />
        <line x1="26" y1="151" x2="614" y2="151" stroke={COLORS.chalk} strokeOpacity="0.25" />
        {cameras.map((point, index) => (
          <g key={index}>
            <circle cx={point[0]} cy={point[1]} r="10" fill={COLORS.blue} />
            <circle cx={point[0]} cy={point[1]} r="4" fill={COLORS.chalk} />
            <path
              d={`M ${point[0] - 15} ${point[1] + 18} L ${point[0]} ${point[1] + 4} L ${point[0] + 15} ${point[1] + 18}`}
              fill="none"
              stroke={COLORS.blue}
              strokeWidth="1.5"
              strokeOpacity="0.72"
            />
          </g>
        ))}
        <Marker point={[237, 146]} fill={COLORS.chalk} stroke={COLORS.ink} />
        <Marker point={[338, 136]} fill={COLORS.pitchLight} stroke={COLORS.lime} />
        <Marker point={[414, 153]} fill={COLORS.pitchLight} stroke={COLORS.lime} />
        <Ball point={[237, 119]} />
        <line
          x1="338"
          y1="102"
          x2="338"
          y2="201"
          stroke={COLORS.danger}
          strokeWidth="3"
          strokeDasharray="8 6"
        />
        <line
          x1="250"
          y1="113"
          x2="319"
          y2="113"
          stroke={COLORS.chalk}
          strokeWidth="3"
          strokeDasharray="7 6"
        />
        <polygon points="319,113 307,107 307,119" fill={COLORS.chalk} />
        <path
          d="M 320 216 C 320 240, 272 238, 272 257 M 320 216 C 320 240, 368 238, 368 257"
          fill="none"
          stroke={COLORS.lime}
          strokeWidth="2.5"
          strokeDasharray="6 5"
        />
        <rect x="205" y="221" width="230" height="40" rx="20" fill={COLORS.ink} />
        <g
          fill={COLORS.chalk}
          fontFamily="var(--font-spline-mono), ui-monospace"
          fontWeight="700"
        >
          <text x="320" y="246" fontSize="13" textAnchor="middle">VAR CONFIRMA O LANCE</text>
          <text x="26" y="25" fontSize="12">CÂMERAS</text>
          <text x="45" y="286" fontSize="12">PONTO DO PASSE</text>
          <text x="442" y="286" fontSize="12">LINHA DE IMPEDIMENTO</text>
        </g>
      </svg>
    </div>
  );
}

function CriteriaPanel({
  label,
  note,
  consistent,
}: {
  label: string;
  note: string;
  consistent: boolean;
}) {
  const color = consistent ? COLORS.lime : COLORS.danger;

  return (
    <div className="border border-ink/10 bg-cal p-2.5">
      <div className="mb-2 px-1">
        <h4 className="m-0 font-display text-sm font-bold text-ink">{label}</h4>
        <p className="m-0 mt-0.5 text-xs leading-snug text-gray-600">{note}</p>
      </div>
      <svg viewBox="0 0 320 190" className="block h-auto w-full" aria-hidden="true">
        <rect width="320" height="190" rx="8" fill={COLORS.pitch} />
        {[44, 160, 276].map((x) => (
          <g key={x}>
            <rect
              x={x - 35}
              y="42"
              width="70"
              height="74"
              rx="5"
              fill={COLORS.pitchLight}
              stroke={COLORS.chalk}
              strokeOpacity="0.45"
            />
            <circle cx={x} cy="66" r="8" fill={COLORS.blue} />
            <circle cx={x} cy="94" r="8" fill={COLORS.chalk} />
            <line
              x1={x - 21}
              y1="105"
              x2={x + 21}
              y2="105"
              stroke={color}
              strokeWidth="2"
              strokeDasharray="5 4"
            />
          </g>
        ))}
        {!consistent && (
          <rect x="125" y="50" width="70" height="58" rx="5" fill={COLORS.ink} fillOpacity="0.88" />
        )}
        <g
          textAnchor="middle"
          fontFamily="var(--font-spline-mono), ui-monospace"
          fontWeight="700"
        >
          <text x="44" y="136" fill={COLORS.chalk} fontSize="10">JOGO 1</text>
          <text x="160" y="136" fill={COLORS.chalk} fontSize="10">JOGO 2</text>
          <text x="276" y="136" fill={COLORS.chalk} fontSize="10">JOGO 3</text>
          <text x="160" y="165" fill={color} fontSize="13">
            {consistent ? "MESMO MÉTODO" : "MÉTODO MISTO"}
          </text>
        </g>
      </svg>
    </div>
  );
}

function SaotEqualCriteria() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <CriteriaPanel
        label="Fase com critério único"
        note="todos os mandos usam o mesmo protocolo"
        consistent
      />
      <CriteriaPanel
        label="Fase com infraestrutura desigual"
        note="um confronto muda de método no mata-mata"
        consistent={false}
      />
    </div>
  );
}

const EXPLAINERS: Record<
  EditorialExplainerVariant,
  {
    eyebrow: string;
    title: string;
    caption: string;
    description: string;
    content: React.ReactNode;
  }
> = {
  "saot-decision-path": {
    eyebrow: "Do campo ao vídeo",
    title: "Onde a tecnologia entra na decisão",
    caption:
      "As câmeras identificam o instante do passe e a posição relevante dos jogadores; a informação segue para a revisão do VAR, que ainda precisa validar o lance e aplicar a regra.",
    description:
      "Diagrama explica o fluxo entre as câmeras do estádio, o ponto do passe, a linha de impedimento e a confirmação do VAR.",
    content: <SaotDecisionPath />,
  },
  "saot-equal-criteria": {
    eyebrow: "Justiça de método",
    title: "A fase precisa falar uma língua só",
    caption:
      "No mata-mata, a igualdade está em submeter cada confronto ao mesmo protocolo de decisão.",
    description:
      "Comparação entre uma fase com o mesmo método em todos os jogos e uma fase com métodos diferentes.",
    content: <SaotEqualCriteria />,
  },
};

export function EditorialExplainer({ variant }: EditorialExplainerProps) {
  const explainer = EXPLAINERS[variant];

  return (
    <ExplainerFrame label="Visual editorial" {...explainer}>
      {explainer.content}
    </ExplainerFrame>
  );
}
