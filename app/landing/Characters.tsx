// ASHA Awaaz — character set for storytelling (deck + preview pages).
// Same line-art language as HeroIllustration: ink stroke 1.8, flat fills,
// Prussian / cream / sindoor palette. Each figure stands on its own 240x360
// canvas so it can be placed anywhere.

const INK = "#1d2c3b";
const SINDOOR = "#ca2325";
const PRUSSIAN = "#003153";
const MUSTARD = "#d9a441";

export type CharacterName = "asha" | "pregnant" | "girl" | "woman";

const LABEL: Record<CharacterName, string> = {
  asha: "An ASHA worker in her blue sari with a red sash, speaking into her phone, carrying her kit.",
  pregnant: "A pregnant woman in a mustard sari, one hand resting on her belly.",
  girl: "A teenage girl in school uniform with two plaits and red ribbons, holding a book.",
  woman: "A woman in her forties in a red sari with a measuring tape at her waist.",
};

function Ground() {
  return (
    <>
      <ellipse cx="120" cy="338" rx="62" ry="7" fill={INK} opacity="0.08" stroke="none" />
      <path d="M40 338 H200" opacity="0.35" />
    </>
  );
}

function Asha() {
  return (
    <>
      <Ground />
      {/* bun + head */}
      <circle cx="104" cy="58" r="10" fill={INK} />
      <circle cx="120" cy="72" r="21" fill="#b9805a" />
      <path d="M99 70 c0 -28 42 -30 42 -2 c-8 -12 -32 -14 -42 2z" fill={INK} />
      <path d="M112 74 q3 -2 6 0 M124 74 q3 -2 6 0" />
      <path d="M115 84 q5 4 10 0" />
      <circle cx="120" cy="63" r="1.8" fill={SINDOOR} stroke="none" />
      {/* sari */}
      <path d="M100 100 c-12 6 -16 20 -16 34 l-4 70 c-6 40 -12 80 -12 130 h104 c0 -50 -6 -90 -12 -130 l-4 -70 c0 -14 -4 -28 -16 -34 z" fill="#7fa3c4" />
      <path d="M66 330 h108" stroke={SINDOOR} strokeWidth="4" />
      {/* red sash, ASHA identity */}
      <path d="M100 104 L150 214" stroke={SINDOOR} strokeWidth="6" opacity="0.9" />
      {/* right arm up, phone at mouth */}
      <path d="M142 108 c14 10 18 30 6 46 c-6 -10 -10 -22 -10 -34" fill="#7fa3c4" />
      <path d="M146 150 c2 -24 -4 -44 -8 -52" />
      <rect x="132" y="84" width="11" height="20" rx="2.5" fill={INK} />
      {/* voice waves */}
      <g stroke={SINDOOR} strokeWidth="2.2">
        <path d="M152 84 q7 8 0 16" />
        <path d="M162 78 q12 14 0 28" />
      </g>
      {/* left arm + kit */}
      <path d="M96 112 c-12 20 -14 50 -10 76" />
      <rect x="72" y="186" width="32" height="34" rx="5" fill={SINDOOR} />
      <path d="M82 196 h12 M88 190 v12" stroke="#fff" />
      <path d="M78 186 c0 -10 20 -10 20 0" />
      {/* feet */}
      <path d="M96 340 h14 M128 340 h14" strokeWidth="3" />
    </>
  );
}

function Pregnant() {
  return (
    <>
      <Ground />
      <circle cx="136" cy="58" r="10" fill={INK} />
      <circle cx="120" cy="72" r="21" fill="#c48a5f" />
      <path d="M99 70 c0 -28 42 -30 42 -2 c-8 -12 -32 -14 -42 2z" fill={INK} />
      <path d="M112 74 q3 -2 6 0 M124 74 q3 -2 6 0" />
      <path d="M115 84 q5 3 10 0" />
      <circle cx="120" cy="63" r="1.8" fill={SINDOOR} stroke="none" />
      {/* pallu over head, sindoor */}
      <path d="M98 62 c-4 -26 46 -30 46 -2 c4 18 2 34 -4 44 c-2 -18 -8 -32 -20 -40 c-10 2 -18 2 -22 -2z" fill={SINDOOR} opacity="0.9" />
      {/* sari with belly */}
      <path d="M100 100 c-12 6 -16 22 -16 36 l-2 56 c-6 46 -12 88 -14 138 h104 c-2 -40 -6 -70 -10 -96 c16 -14 18 -44 2 -62 l-2 -36 c0 -14 -4 -30 -16 -36 z" fill={MUSTARD} />
      <path d="M66 330 h106" stroke={SINDOOR} strokeWidth="4" />
      {/* belly curve + hand resting on it */}
      <path d="M140 170 c18 12 20 40 4 58" opacity="0.6" />
      <path d="M142 112 c8 20 6 50 -4 74" />
      <path d="M130 186 c6 -6 14 -6 18 2 c-4 4 -12 6 -18 -2z" fill="#c48a5f" />
      {/* pallu falling over shoulder */}
      <path d="M140 104 c-10 30 -32 52 -48 62" stroke={SINDOOR} strokeWidth="5" opacity="0.85" />
      <path d="M96 112 c-10 24 -12 52 -8 80" />
      {/* bangles */}
      <path d="M86 186 h6 M86 190 h6" stroke={SINDOOR} strokeWidth="2.4" />
      <path d="M98 340 h14 M128 340 h14" strokeWidth="3" />
    </>
  );
}

function Girl() {
  return (
    <>
      <Ground />
      {/* plaits with red ribbons */}
      <path d="M102 76 c-6 20 -8 40 -4 58" strokeWidth="6" stroke={INK} />
      <path d="M138 76 c6 20 8 40 4 58" strokeWidth="6" stroke={INK} />
      <circle cx="120" cy="76" r="19" fill="#c9926a" />
      <path d="M101 74 c0 -26 38 -28 38 -2 c-8 -10 -28 -12 -38 2z" fill={INK} />
      <path d="M113 78 q3 -2 6 0 M123 78 q3 -2 6 0" />
      <path d="M115 87 q5 4 10 0" />
      {/* kurta (school uniform, light) */}
      <path d="M102 102 c-10 6 -14 18 -14 30 l-4 112 h72 l-4 -112 c0 -12 -4 -24 -14 -30 z" fill="#e8eef3" />
      {/* dupatta V */}
      <path d="M102 104 q18 26 36 0" stroke={PRUSSIAN} strokeWidth="6" />
      {/* plait ends fall in front of the shoulders, red ribbons */}
      <path d="M100 96 c-4 16 -4 30 -2 44 M140 96 c4 16 4 30 2 44" strokeWidth="6" stroke={INK} />
      <path d="M92 142 l6 -5 l6 5 M136 142 l6 -5 l6 5" stroke={SINDOOR} strokeWidth="3.5" />
      {/* salwar */}
      <path d="M90 244 l2 92 h24 l2 -70 l2 70 h24 l2 -92 z" fill={PRUSSIAN} />
      {/* bag strap */}
      <path d="M136 104 L96 220" stroke={MUSTARD} strokeWidth="4" />
      {/* arms holding a book */}
      <path d="M96 112 c-10 20 -10 40 2 58 c8 4 18 4 24 -2" />
      <path d="M144 112 c8 20 8 40 -4 56" />
      <rect x="104" y="148" width="34" height="26" rx="2" fill={SINDOOR} transform="rotate(-8 121 161)" />
      <path d="M110 156 h20 M110 163 h14" stroke="#fff" transform="rotate(-8 121 161)" />
      <path d="M100 340 h14 M126 340 h14" strokeWidth="3" />
    </>
  );
}

function Woman() {
  return (
    <>
      <Ground />
      {/* bun with a grey streak */}
      <circle cx="104" cy="58" r="11" fill={INK} />
      <path d="M98 52 q6 -4 12 0" stroke="#9aa5ae" strokeWidth="2.2" />
      <circle cx="120" cy="72" r="21" fill="#b47a52" />
      <path d="M99 70 c0 -28 42 -30 42 -2 c-8 -12 -32 -14 -42 2z" fill={INK} />
      <path d="M108 62 q10 -6 22 -4" stroke="#9aa5ae" strokeWidth="1.6" />
      <path d="M112 74 q3 -2 6 0 M124 74 q3 -2 6 0" />
      <path d="M115 85 q5 3 10 0" />
      <path d="M110 80 q-2 2 0 4 M130 80 q2 2 0 4" opacity="0.4" />
      <circle cx="120" cy="63" r="2.2" fill={SINDOOR} stroke="none" />
      {/* sari, sindoor red */}
      <path d="M100 100 c-14 6 -18 22 -18 38 l-4 66 c-6 40 -10 80 -10 126 h104 c0 -46 -4 -86 -10 -126 l-4 -66 c0 -16 -4 -32 -18 -38 z" fill={SINDOOR} opacity="0.88" />
      <path d="M66 330 h108" stroke={MUSTARD} strokeWidth="4" />
      {/* pallu with mustard border */}
      <path d="M140 102 C120 130 100 150 82 162" stroke={MUSTARD} strokeWidth="6" />
      {/* waist tape: the CBAC waist measurement */}
      <path d="M86 184 q34 12 68 0" stroke="#f4ede1" strokeWidth="5" />
      <path d="M86 184 q34 12 68 0" stroke={INK} strokeWidth="1" strokeDasharray="2 4" />
      <path d="M154 184 c6 10 4 22 -2 30" stroke="#f4ede1" strokeWidth="5" />
      <text x="128" y="212" fontSize="9" fontFamily="system-ui, sans-serif" fill={INK} stroke="none">88</text>
      {/* arms */}
      <path d="M96 114 c-12 22 -14 48 -10 72" />
      <path d="M144 114 c12 22 14 48 10 72" />
      <path d="M84 176 h7 M84 180 h7 M149 176 h7" stroke={MUSTARD} strokeWidth="2.4" />
      <path d="M98 340 h14 M128 340 h14" strokeWidth="3" />
    </>
  );
}

const FIGURES: Record<CharacterName, () => React.JSX.Element> = {
  asha: Asha,
  pregnant: Pregnant,
  girl: Girl,
  woman: Woman,
};

export default function Character({
  name,
  className,
  size = 160,
}: {
  name: CharacterName;
  className?: string;
  size?: number;
}) {
  const Figure = FIGURES[name];
  return (
    <svg
      className={className}
      viewBox="0 0 240 360"
      width={size}
      height={(size * 360) / 240}
      role="img"
      aria-label={LABEL[name]}
      xmlns="http://www.w3.org/2000/svg"
    >
      <g fill="none" stroke={INK} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <Figure />
      </g>
    </svg>
  );
}
