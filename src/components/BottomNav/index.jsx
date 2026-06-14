import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore.js';

const TABS = [
  { id: 'home', label: 'Главная', icon: HomeIcon },
  { id: 'params', label: 'Параметры', icon: SlidersIcon },
  { id: 'results', label: 'Результаты', icon: ChartIcon },
  { id: 'history', label: 'История', icon: ClockIcon },
  { id: 'more', label: 'Ещё', icon: DotsIcon },
];

export default function BottomNav() {
  const { screen, setScreen } = useStore();
  const [pressed, setPressed] = useState(null);
  const innerRef = useRef(null);
  const btnRefs = useRef([]);
  const [thumb, setThumb] = useState({ left: 0, width: 0, ready: false });

  const activeIndex = Math.max(0, TABS.findIndex(t => t.id === screen));

  // Slide glass thumb to active tab
  useLayoutEffect(() => {
    const el = btnRefs.current[activeIndex];
    if (!el) return;
    setThumb({ left: el.offsetLeft, width: el.offsetWidth, ready: true });
  }, [activeIndex]);

  useEffect(() => {
    function onResize() {
      const el = btnRefs.current[activeIndex];
      if (el) setThumb(t => ({ ...t, left: el.offsetLeft, width: el.offsetWidth }));
    }
    window.addEventListener('resize', onResize, { passive: true });
    return () => window.removeEventListener('resize', onResize);
  }, [activeIndex]);

  return (
    <nav style={navStyle}>
      <div ref={innerRef} style={innerStyle}>
        {/* Sliding liquid-glass thumb */}
        <span
          aria-hidden
          style={{
            ...thumbStyle,
            width: thumb.width,
            transform: `translateX(${thumb.left}px)`,
            opacity: thumb.ready ? 1 : 0,
          }}
        />
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const active = screen === t.id;
          const press = pressed === t.id;
          return (
            <button
              key={t.id}
              ref={el => (btnRefs.current[i] = el)}
              onClick={() => {
                setPressed(t.id);
                setTimeout(() => setPressed(null), 320);
                setScreen(t.id);
              }}
              style={{
                ...btnStyle,
                color: active ? '#7ee06a' : 'rgba(255,255,255,0.5)',
              }}
            >
              <span className={press ? 'nav-icon-press' : ''} style={{ display: 'flex' }}>
                <Icon active={active} />
              </span>
              <span style={{
                fontSize: 10,
                fontWeight: active ? 600 : 500,
                marginTop: 3,
                letterSpacing: 0.1,
              }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

const navStyle = {
  position: 'fixed',
  left: '50%',
  bottom: 'calc(14px + env(safe-area-inset-bottom))',
  transform: 'translateX(-50%)',
  width: 'min(660px, calc(100% - 28px))',
  zIndex: 100,
};
const innerStyle = {
  position: 'relative',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  height: 64,
  padding: '6px',
  borderRadius: 30,
  // Darkened liquid glass
  background: 'rgba(18,20,26,0.55)',
  backdropFilter: 'blur(28px) saturate(180%)',
  WebkitBackdropFilter: 'blur(28px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -1px 0 rgba(0,0,0,0.3)',
};
const thumbStyle = {
  position: 'absolute',
  left: 0,
  top: 6,
  bottom: 6,
  borderRadius: 22,
  background: 'linear-gradient(160deg, rgba(255,255,255,0.22), rgba(255,255,255,0.06))',
  border: '1px solid rgba(255,255,255,0.25)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -2px 6px rgba(0,0,0,0.18), 0 4px 14px rgba(0,0,0,0.25)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  transition: 'transform 0.42s cubic-bezier(0.34,1.56,0.64,1), width 0.42s cubic-bezier(0.34,1.56,0.64,1), opacity 0.3s',
  pointerEvents: 'none',
  zIndex: 1,
};
const btnStyle = {
  flex: 1,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  zIndex: 2,
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
  transition: 'color 0.25s',
};

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.7}>
      <path d="M3 11l9-8 9 8v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2V11z" strokeLinejoin="round" />
    </svg>
  );
}
function SlidersIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.7}>
      <line x1="4" y1="7" x2="20" y2="7" /><circle cx="10" cy="7" r="2.4" fill="currentColor" stroke="none" />
      <line x1="4" y1="12" x2="20" y2="12" /><circle cx="15" cy="12" r="2.4" fill="currentColor" stroke="none" />
      <line x1="4" y1="17" x2="20" y2="17" /><circle cx="8" cy="17" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  );
}
function ClockIcon({ active }) {
  // lucide-react "clock"
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15.5 14" />
    </svg>
  );
}
function ChartIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.7}>
      <path d="M3 20l5-9 4 5 6-11 3 4" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
function DotsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}
