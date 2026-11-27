// Line-art scene: an ASHA worker at a pregnant woman's doorstep, speaking the
// visit into her phone. Her voice becomes a record that travels to the PHC.
// Pure SVG, no external assets. Palette: Prussian ink, cream, sindoor accents.

export default function HeroIllustration() {
  const ink = "#1d2c3b";
  return (
    <svg
      className="ln-illus"
      viewBox="0 0 1000 560"
      role="img"
      aria-label="An ASHA worker stands at a village doorstep, speaking into her phone, while a pregnant woman sits on a charpai and talks to her."
    >
      <defs>
        <pattern
          id="weave"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke={ink}
            strokeWidth="0.8"
            opacity="0.5"
          />
        </pattern>
      </defs>

      <g
        fill="none"
        stroke={ink}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* distant hills + sun */}
        <circle
          cx="880"
          cy="96"
          r="38"
          fill="#ca2325"
          opacity="0.12"
          stroke="none"
        />
        <path
          d="M0 300 C120 250 220 270 320 240 S520 230 600 250"
          opacity="0.25"
        />
        <path d="M560 250 C680 210 780 240 1000 215" opacity="0.25" />

        {/* ground */}
        <path d="M20 490 H980" />
        <path
          d="M40 500 l8 -6 M90 502 l6 -7 M300 503 l7 -6 M760 502 l8 -7 M900 500 l6 -6"
          opacity="0.45"
        />

        {/* neem tree */}
        <path d="M150 490 C152 430 140 380 156 320 M156 360 C175 345 190 330 196 310 M154 380 C130 360 118 345 112 330" />
        <g fill="#e9e0cb">
          <circle cx="150" cy="270" r="58" />
          <circle cx="98" cy="300" r="40" />
          <circle cx="205" cy="295" r="44" />
          <circle cx="160" cy="220" r="40" />
        </g>
        <g fill="#3f6b3a" stroke="none" opacity="0.35">
          <ellipse
            cx="120"
            cy="258"
            rx="5"
            ry="2.5"
            transform="rotate(-30 120 258)"
          />
          <ellipse
            cx="176"
            cy="248"
            rx="5"
            ry="2.5"
            transform="rotate(25 176 248)"
          />
          <ellipse
            cx="196"
            cy="300"
            rx="5"
            ry="2.5"
            transform="rotate(-20 196 300)"
          />
          <ellipse
            cx="104"
            cy="306"
            rx="5"
            ry="2.5"
            transform="rotate(35 104 306)"
          />
          <ellipse
            cx="150"
            cy="292"
            rx="5"
            ry="2.5"
            transform="rotate(-40 150 292)"
          />
          <ellipse
            cx="160"
            cy="214"
            rx="5"
            ry="2.5"
            transform="rotate(15 160 214)"
          />
          <ellipse
            cx="222"
            cy="280"
            rx="5"
            ry="2.5"
            transform="rotate(-10 222 280)"
          />
        </g>

        {/* ASHA's bicycle leaning on the tree */}
        <circle cx="218" cy="462" r="27" />
        <circle cx="300" cy="462" r="27" />
        <path d="M218 462 L250 426 L290 426 L300 462 M250 426 L262 462 L218 462 M262 462 L290 426 M246 416 h14 M290 426 l-4 -16 h12" />
        <rect
          x="280"
          y="430"
          width="30"
          height="16"
          rx="2"
          fill="#ca2325"
          opacity="0.85"
        />

        {/* house */}
        <rect x="470" y="236" width="400" height="254" fill="#efe3cc" />
        <path d="M448 246 L670 150 L892 246 Z" fill="#d9c6a6" />
        <path
          d="M500 232 L670 160 M540 238 L670 176 M600 242 L670 196 M840 232 L670 160 M800 238 L670 176 M740 242 L670 196"
          stroke="#ca2325"
          opacity="0.55"
        />
        <path
          d="M486 300 h60 M486 340 h40 M800 400 h50 M780 430 h70"
          opacity="0.25"
        />
        {/* door */}
        <rect x="640" y="320" width="84" height="170" fill="#2c3e50" />
        <rect x="632" y="312" width="100" height="10" fill="#b88a5a" />
        <path
          d="M640 320 V490 M724 320 V490"
          strokeWidth="3"
          stroke="#b88a5a"
        />
        {/* toran over door */}
        <path
          d="M640 330 q10 12 21 0 q10 12 21 0 q10 12 21 0 q10 12 21 0"
          stroke="#ca2325"
        />
        {/* window */}
        <rect x="770" y="300" width="64" height="58" fill="#2c3e50" />
        <path d="M786 300 v58 M802 300 v58 M818 300 v58" stroke="#efe3cc" />
        {/* rangoli at doorstep */}
        <g transform="translate(682 508)" stroke="#ca2325" opacity="0.8">
          <ellipse rx="34" ry="8" />
          <ellipse rx="20" ry="4.5" />
          <circle r="2" fill="#ca2325" />
        </g>
        {/* tulsi pot */}
        <path d="M884 490 v-40 h44 v40 z" fill="#d9c6a6" />
        <path
          d="M906 450 v-28 M906 432 q-12 -8 -16 -20 M906 428 q12 -6 18 -18 M906 440 q-10 -2 -18 -10"
          stroke="#3f6b3a"
        />

        {/* charpai */}
        <rect x="486" y="436" width="132" height="12" fill="url(#weave)" />
        <path d="M494 448 V490 M610 448 V490" strokeWidth="2.4" />

        {/* pregnant woman, seated, facing the ASHA */}
        <path
          d="M576 352 c-10 -24 -38 -22 -42 2 c-2 14 6 22 12 26 c8 6 24 2 30 -6 c4 -6 4 -14 0 -22z"
          fill="#ca2325"
        />
        <circle cx="552" cy="364" r="14" fill="#c48a5f" />
        <path d="M543 362 q3 -2 6 0" />
        <path
          d="M552 378 c-4 10 -18 22 -20 40 c-2 12 4 20 10 20 h44 c4 -20 -2 -42 -10 -58 z"
          fill="#d9a441"
        />
        <path d="M534 404 c-8 8 -8 22 2 30" fill="#d9a441" />
        <path d="M548 398 c-4 8 -6 14 -4 20" />
        <path
          d="M582 438 C560 436 530 438 514 446 L508 490 H548 L552 452 C566 452 580 448 582 438 Z"
          fill="#d9a441"
        />
        <path
          d="M512 470 h36"
          stroke="#ca2325"
          strokeWidth="2.5"
          opacity="0.8"
        />
        <path d="M502 490 h12 M538 490 h12" strokeWidth="3" />
        <path
          d="M574 378 c10 12 16 30 14 58"
          stroke="#ca2325"
          strokeWidth="4"
          opacity="0.85"
        />

        <g className="ln-asha">
          <g className="ln-asha-bob">
            {/* ASHA worker, standing, speaking into her phone */}
            <circle cx="384" cy="282" r="9" fill={ink} />
            <circle cx="396" cy="292" r="16" fill="#b9805a" />
            <path d="M381 288 c2 -14 26 -18 30 -2" fill={ink} />
            <path
              d="M384 312 c-10 4 -14 14 -14 26 l-4 52 c-6 30 -12 64 -12 98 h66 c0 -34 -6 -68 -12 -98 l-4 -52 c0 -12 -4 -22 -14 -26 z"
              fill="#7fa3c4"
            />
            <path
              d="M372 316 L414 402"
              stroke="#ca2325"
              strokeWidth="5"
              opacity="0.9"
            />
            <path d="M356 488 h66" stroke="#ca2325" strokeWidth="4" />
            <path d="M408 318 c10 6 14 18 14 30 c-2 -14 -6 -24 4 -34" />
            <rect x="419" y="300" width="10" height="18" rx="2" fill={ink} />
            <path d="M376 318 L424 396" opacity="0.7" />
            <rect
              x="410"
              y="388"
              width="26"
              height="30"
              rx="4"
              fill="#ca2325"
            />
            <path d="M418 396 h10 M423 391 v10" stroke="#fff" />
          </g>
        </g>
      </g>

      {/* voice waves from the phone */}
      <g className="ln-waves-in">
        <g
          className="ln-waves"
          fill="none"
          stroke="#ca2325"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M440 300 q8 9 0 18" />
          <path d="M452 292 q14 17 0 34" />
          <path d="M466 284 q20 25 0 50" />
        </g>
      </g>

      {/* the record card that leaves with her voice */}
      <g className="ln-card-in">
        <g className="ln-card">
          <rect
            x="430"
            y="120"
            width="210"
            height="76"
            rx="14"
            fill="#003153"
          />
          <circle cx="456" cy="146" r="8" fill="#ca2325" />
          <text
            x="472"
            y="151"
            fill="#f4ede1"
            fontSize="15"
            fontWeight="700"
            fontFamily="system-ui, sans-serif"
          >
            Visit logged by voice
          </text>
          <text
            x="446"
            y="178"
            fill="#b9cddd"
            fontSize="13"
            fontFamily="system-ui, sans-serif"
          >
            ⚠ Danger sign · PHC alerted
          </text>
          <path
            d="M470 196 L452 228"
            stroke="#003153"
            strokeWidth="2"
            strokeDasharray="4 5"
          />
        </g>
      </g>
    </svg>
  );
}
