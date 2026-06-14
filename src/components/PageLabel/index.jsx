import React from 'react';

// Subtle 3D monochrome icons (brushed-metal gray, soft depth). Not colorful.
function Icon({ name, dark }) {
  const id = React.useId();
  const top = dark ? '#e9edf2' : '#f2f4f7';
  const mid = dark ? '#aab2bd' : '#c4cad2';
  const bot = dark ? '#7c8693' : '#9aa2ad';
  const paths = ICON_PATHS[name] || ICON_PATHS.gear;
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" style={{ display: 'block', filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.35))' }}>
      <defs>
        <linearGradient id={`g${id}`} x1="4" y1="2" x2="20" y2="22" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={top} />
          <stop offset="0.5" stopColor={mid} />
          <stop offset="1" stopColor={bot} />
        </linearGradient>
      </defs>
      <g fill={`url(#g${id})`} stroke="rgba(0,0,0,0.22)" strokeWidth="0.5" strokeLinejoin="round">
        {paths.map((d, i) => <path key={i} d={d} />)}
      </g>
    </svg>
  );
}

const ICON_PATHS = {
  gear: ['M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 00.12-.61l-1.92-3.32a.49.49 0 00-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54A.48.48 0 0013.4 2h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 00-.59.22L1.74 8.87a.49.49 0 00.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 00-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32a.49.49 0 00-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1112 8.4a3.6 3.6 0 010 7.2z'],
  rocket: ['M9.19 6.35c-2.04 2.29-3.44 5.58-3.57 5.89L2 10.69l4.05-4.05c.47-.47 1.15-.68 1.81-.55l1.33.26zM11.17 17s3.74-1.55 5.89-3.7c5.4-5.4 4.5-9.62 4.21-10.57-.95-.3-5.17-1.19-10.57 4.21C8.55 9.09 7 12.83 7 12.83L11.17 17zm6.48-2.19c-2.29 2.04-5.58 3.44-5.89 3.57L13.31 22l4.05-4.05c.47-.47.68-1.15.55-1.81l-.26-1.33zM15 9a1.5 1.5 0 110-3 1.5 1.5 0 010 3z'],
  chart: ['M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zM16.2 13H19v6h-2.8z'],
  history: ['M13 3a9 9 0 00-9 9H1l3.96 3.96L9 12H6a7 7 0 117 7 6.96 6.96 0 01-4.94-2.06l-1.42 1.42A8.98 8.98 0 1013 3zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8z'],
  more: ['M6 10a2 2 0 100 4 2 2 0 000-4zm12 0a2 2 0 100 4 2 2 0 000-4zm-6 0a2 2 0 100 4 2 2 0 000-4z'],
};

export default function PageLabel({ icon = 'gear', text, dark = false }) {
  return (
    <div style={{
      position: 'fixed',
      top: 'calc(14px + env(safe-area-inset-top))',
      left: 16,
      zIndex: 60,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      pointerEvents: 'none',
    }}>
      <Icon name={icon} dark={dark} />
      <span style={{
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 600,
        letterSpacing: 0.3,
        color: dark ? 'rgba(255,255,255,0.55)' : 'rgba(60,70,75,0.7)',
      }}>{text}</span>
    </div>
  );
}
