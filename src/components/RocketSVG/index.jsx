import React from 'react';

// Live SVG Politech rocket — reacts to params
// pressure → body scale X
// waterVol → blue liquid level
// nozzle → nozzle radius
// dryMass → vertical sag
export default function RocketSVG({ params, exhaust = false, scale = 1 }) {
  const { pressure = 5.5, waterVol = 0.4, tankVol = 1.5, nozzle = 10, diameter = 92, dryMass = 350 } = params || {};

  const pressureScale = 1 + Math.min((pressure - 1) / 14, 1) * 0.06;
  const waterPct = Math.min(waterVol / tankVol, 1);
  const waterY = 230 - waterPct * 130;
  const nozzleR = Math.max(8, Math.min(nozzle * 0.9, 22));
  const sag = Math.min((dryMass - 50) / 1950, 1) * 6;

  return (
    <svg
      viewBox="0 0 200 480"
      style={{
        width: '100%',
        maxWidth: 260 * scale,
        height: 'auto',
        display: 'block',
        margin: '0 auto',
        transform: `translateY(${sag}px)`,
        transition: 'transform 0.3s ease',
        filter: 'drop-shadow(0 18px 32px rgba(0,0,0,0.18))',
      }}
    >
      <defs>
        <linearGradient id="bodyGrad" x1="0" x2="1">
          <stop offset="0" stopColor="#5aaa30" />
          <stop offset="0.5" stopColor="#76c442" />
          <stop offset="1" stopColor="#4a9e2f" />
        </linearGradient>
        <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#64b5f6" stopOpacity="0.85" />
          <stop offset="1" stopColor="#1976d2" stopOpacity="0.95" />
        </linearGradient>
        <radialGradient id="logoGrad" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#76c442" />
          <stop offset="1" stopColor="#4a9e2f" />
        </radialGradient>
      </defs>

      <g style={{ transition: 'transform 0.3s ease', transformOrigin: '100px 240px', transform: `scaleX(${pressureScale})` }}>
        {/* Nose cone */}
        <path d="M100 20 Q60 100 60 140 L140 140 Q140 100 100 20Z" fill="url(#bodyGrad)" />
        <path d="M100 20 Q60 100 60 140 L100 140 Z" fill="rgba(0,0,0,0.08)" />

        {/* Upper grey collar */}
        <rect x="56" y="138" width="88" height="10" fill="#8a8a8a" />
        <rect x="56" y="138" width="88" height="3" fill="#aaa" />

        {/* Payload section bright green */}
        <rect x="60" y="148" width="80" height="40" fill="#76c442" />
        <rect x="74" y="156" width="52" height="22" fill="#5aaa30" rx="2" />

        {/* Second collar */}
        <rect x="56" y="188" width="88" height="10" fill="#8a8a8a" />

        {/* Main body upper — green with Politech logo */}
        <rect x="60" y="198" width="80" height="100" fill="url(#bodyGrad)" />

        {/* Water liquid inside body */}
        <rect x="64" y={waterY} width="72" height={298 - waterY} fill="url(#liquidGrad)"
          style={{ transition: 'y 0.3s ease, height 0.3s ease' }} />
        <ellipse cx="100" cy={waterY} rx="36" ry="3" fill="#90caf9" opacity="0.6"
          style={{ transition: 'cy 0.3s ease' }} />

        {/* Politech logo box */}
        <rect x="78" y="220" width="44" height="46" rx="6" fill="white" />
        <text x="100" y="252" textAnchor="middle" fontFamily="Georgia, serif" fontWeight="700"
          fontSize="32" fill="#4a9e2f">П</text>
        <text x="100" y="288" textAnchor="middle" fontFamily="sans-serif" fontWeight="700"
          fontSize="9" fill="white" letterSpacing="1">ПОЛИТЕХ</text>

        {/* Red stripe */}
        <rect x="58" y="298" width="84" height="8" fill="#e53935" />

        {/* Lower body */}
        <rect x="60" y="306" width="80" height="50" fill="url(#bodyGrad)" />
        <text x="100" y="338" textAnchor="middle" fontFamily="monospace" fontSize="12" fill="rgba(255,255,255,0.5)">2026</text>

        {/* Purple stripe */}
        <rect x="58" y="356" width="84" height="6" fill="#7b1fa2" />

        {/* White base collar */}
        <rect x="60" y="362" width="80" height="22" fill="#e0e0e0" />

        {/* Fins */}
        <path d="M60 362 L30 410 L30 408 L60 384 Z" fill="#37474f" />
        <path d="M140 362 L170 410 L170 408 L140 384 Z" fill="#37474f" />
        <path d="M100 362 L100 390 L88 390 L100 362Z" fill="#455a64" opacity="0.6" />

        {/* Nozzle */}
        <path
          d={`M${100 - nozzleR} 384 L${100 - nozzleR * 0.65} 416 L${100 + nozzleR * 0.65} 416 L${100 + nozzleR} 384Z`}
          fill="#4a9e2f"
          style={{ transition: 'd 0.3s ease' }}
        />
        <ellipse cx="100" cy="416" rx={nozzleR * 0.65} ry="3" fill="#2a6b1d" />
      </g>

      {/* Exhaust flames (optional) */}
      {exhaust && (
        <g>
          <ellipse cx="100" cy="436" rx={nozzleR * 0.8} ry="14" fill="#ffd54f" opacity="0.85"
            style={{ animation: 'flameFlicker 0.18s infinite' }} />
          <ellipse cx="100" cy="450" rx={nozzleR} ry="20" fill="#ff8a00" opacity="0.6" />
          <ellipse cx="100" cy="465" rx={nozzleR * 1.3} ry="22" fill="#fff" opacity="0.35" />
        </g>
      )}
    </svg>
  );
}
