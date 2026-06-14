import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import ParticleRocket from '../../components/ParticleRocket/index.jsx';
import EarthBg from '../../components/EarthBg/index.jsx';

export default function Home() {
  const setScreen = useStore(s => s.setScreen);
  const [exploding, setExploding] = useState(false);
  const wrapRef = useRef(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    function onScroll() {
      if (el.scrollTop > 60 && !exploding) {
        setExploding(true);
        setTimeout(() => setExploding(false), 1500);
      }
    }
    function onMove(e) {
      const r = el.getBoundingClientRect();
      setTilt({
        x: ((e.clientX - r.left) / r.width - 0.5) * -10,
        y: ((e.clientY - r.top) / r.height - 0.5) * -7,
      });
    }
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('mousemove', onMove, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('mousemove', onMove);
    };
  }, [exploding]);

  return (
    <div
      ref={wrapRef}
      className="screen screen-dark"
      style={{
        background: '#080c10',
        position: 'relative',
        overflow: 'hidden',
        height: '100vh',
        padding: 0,
      }}
    >
      <Stars />
      <ShootingStars />
      <EarthBg />
      <ParticleRocket exploding={exploding} />

      <div style={{
        position: 'absolute',
        top: '6%',
        left: '5%',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        zIndex: 4,
      }}>
        <img
          src="/images/logopol.png"
          height="44"
          style={{ display: 'block', objectFit: 'contain' }}
          alt="Политех"
        />
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.6px',
          fontWeight: 500,
        }}>
          СПбПУ · Политех
        </span>
      </div>

      <div style={{
        position: 'absolute',
        top: '50%',
        left: '5%',
        transform: `translateY(-50%) translate(${tilt.x * 0.5}px, ${tilt.y * 0.5}px)`,
        maxWidth: '52%',
        zIndex: 4,
        transition: 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
        pointerEvents: 'auto',
      }}>
        <h1 className="hero-title" style={{
          fontFamily: 'var(--font-hero)',
          fontSize: 'clamp(64px, 8.5vw, 132px)',
          fontWeight: 400,
          lineHeight: 0.88,
          letterSpacing: '-2px',
          margin: '0 0 24px',
          textTransform: 'uppercase',
          position: 'relative',
          display: 'inline-block',
        }}>
          <span style={{
            display: 'block',
            color: '#ffffff',
            textShadow: `
              1px 1px 0 #c8c8c8,
              2px 2px 0 #9a9a9a,
              3px 3px 0 #6e6e6e,
              4px 4px 10px rgba(0,0,0,0.5),
              0 0 50px rgba(255,213,79,0.15)
            `,
          }}>Rocket</span>
          <span style={{
            display: 'block',
            color: 'transparent',
            WebkitTextStroke: '2px rgba(255,255,255,0.85)',
            marginTop: -8,
          }}>Sim</span>
        </h1>

        <h2 className="hero-sub" style={{
          fontFamily: 'var(--font-body)',
          fontWeight: 600,
          fontSize: 'clamp(19px, 2.3vw, 30px)',
          lineHeight: 1.15,
          letterSpacing: '-0.3px',
          margin: '0 0 18px',
          maxWidth: 520,
          color: '#ffffff',
        }}>
          Живая лаборатория<br />полёта водной ракеты
        </h2>

        <p style={{
          fontFamily: 'var(--font-body)',
          fontSize: 'clamp(14px, 1.05vw, 16px)',
          color: 'rgba(255,255,255,0.52)',
          lineHeight: 1.55,
          margin: '0 0 40px',
          fontWeight: 400,
          maxWidth: 460,
        }}>
          Точная физика 5 фаз. 3D-симуляция в реальном времени. Для лабораторий СПбПУ Политех.
        </p>

        <button
          onClick={() => setScreen('params')}
          className="hero-btn"
          style={{
            position: 'relative',
            background: '#4a9e2f',
            color: '#fff',
            border: 'none',
            padding: '16px 44px',
            borderRadius: 100,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            letterSpacing: 1.4,
            textTransform: 'uppercase',
            fontFamily: 'var(--font-body)',
            transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), background 0.25s, box-shadow 0.25s',
            boxShadow: '0 10px 30px rgba(74,158,47,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
            overflow: 'hidden',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#4caf50'; e.currentTarget.style.boxShadow = '0 14px 38px rgba(76,175,80,0.5), inset 0 1px 0 rgba(255,255,255,0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#4a9e2f'; e.currentTarget.style.boxShadow = '0 10px 30px rgba(74,158,47,0.4), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
        >
          <span style={{ position: 'relative', zIndex: 2 }}>Начать симуляцию</span>
          <span aria-hidden style={{
            position: 'absolute',
            top: 0, left: '-100%',
            width: '100%', height: '100%',
            background: 'linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent)',
            animation: 'btnSheen 4s ease-in-out infinite',
            zIndex: 1,
          }} />
        </button>
      </div>

      <style>{`
        @keyframes arrowSlide {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(5px); }
        }
        @keyframes shimmer {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes btnSheen {
          0% { left: -100%; }
          60% { left: 100%; }
          100% { left: 100%; }
        }
        @keyframes shootingStar {
          0% { transform: translate(0, 0); opacity: 0; }
          12% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translate(-700px, 250px); opacity: 0; }
        }
        .hero-btn { animation: btnPulse 2.6s ease-in-out infinite; }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 10px 30px rgba(74,158,47,0.4), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 0 rgba(76,175,80,0.5); }
          50% { box-shadow: 0 13px 36px rgba(74,158,47,0.52), inset 0 1px 0 rgba(255,255,255,0.18), 0 0 0 12px rgba(76,175,80,0); }
        }
        .hero-title { animation: heroTitleIn 1.1s cubic-bezier(0.16,1,0.3,1) backwards; }
        @keyframes heroTitleIn {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function HighlightWord({ children }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', padding: '0 4px', whiteSpace: 'nowrap' }}>
      <span style={{
        position: 'absolute',
        left: 0, right: 0, bottom: 2,
        height: '60%',
        background: 'rgba(76,175,80,0.28)',
        borderRadius: 4,
        zIndex: -1,
        transformOrigin: 'left',
        animation: 'highlightSweep 6s ease-in-out infinite',
        animationDelay: '1s',
      }} />
      <span style={{ position: 'relative' }}>{children}</span>
    </span>
  );
}

function FancyButton({ onClick }) {
  const [hover, setHover] = React.useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: 'relative',
        background: 'transparent',
        color: '#fff',
        border: 'none',
        padding: '17px 28px 17px 28px',
        borderRadius: 100,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        fontFamily: 'var(--font-mono)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 14,
        overflow: 'hidden',
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        transform: hover ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      <span style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 100,
        padding: 1.5,
        background: hover
          ? 'linear-gradient(135deg, #4caf50, #76c442, #ffd54f, #4caf50)'
          : 'linear-gradient(135deg, rgba(255,255,255,0.55), rgba(255,255,255,0.15))',
        WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
        WebkitMaskComposite: 'xor',
        maskComposite: 'exclude',
        transition: 'background 0.4s',
        backgroundSize: '200% 200%',
        animation: hover ? 'borderShift 3s linear infinite' : 'none',
      }} />
      <span style={{
        position: 'absolute',
        inset: 0,
        borderRadius: 100,
        background: hover
          ? 'radial-gradient(circle at 30% 50%, rgba(76,175,80,0.35), transparent 60%)'
          : 'rgba(255,255,255,0.03)',
        transition: 'background 0.3s',
      }} />
      <span style={{ position: 'relative', zIndex: 1 }}>начать симуляцию</span>
      <span style={{
        position: 'relative',
        zIndex: 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28, height: 28,
        borderRadius: '50%',
        background: hover ? '#4caf50' : 'rgba(76,175,80,0.18)',
        border: '1px solid rgba(76,175,80,0.5)',
        transition: 'background 0.25s, transform 0.25s',
        transform: hover ? 'rotate(-45deg)' : 'rotate(0)',
      }}>
        <svg width="11" height="14" viewBox="0 0 11 14" fill="none">
          <path d="M5.5 0L8 4.5h-5L5.5 0z" fill="currentColor" />
          <rect x="3" y="4.5" width="5" height="6" rx="0.5" fill="currentColor" />
          <path d="M3 10.5L1 13v-2.5H3zM8 10.5L10 13v-2.5H8z" fill="currentColor" />
        </svg>
      </span>
      <style>{`
        @keyframes borderShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </button>
  );
}

function Stars() {
  // Real spectrum: blue O/B, white A, yellow F/G (Sun-like), orange K, red M
  const PALETTE = [
    { color: '#ffffff', glow: 'rgba(255,255,255,0.7)' },
    { color: '#cfe7ff', glow: 'rgba(207,231,255,0.7)' }, // blue-white
    { color: '#9fc4ff', glow: 'rgba(159,196,255,0.7)' }, // blue
    { color: '#fff3b0', glow: 'rgba(255,243,176,0.7)' }, // yellow
    { color: '#ffd699', glow: 'rgba(255,214,153,0.7)' }, // orange
    { color: '#ffaa88', glow: 'rgba(255,170,136,0.7)' }, // red-orange
    { color: '#e0fbff', glow: 'rgba(224,251,255,0.7)' }, // cyan tint
    { color: '#f3d0ff', glow: 'rgba(243,208,255,0.6)' }, // violet
  ];
  const BRIGHT = [
    { ratio: 0.04, color: '#ffffff', glow: 'rgba(255,255,255,0.95)' },
    { ratio: 0.03, color: '#fff3b0', glow: 'rgba(255,243,176,0.95)' },
    { ratio: 0.025, color: '#cfe7ff', glow: 'rgba(207,231,255,0.95)' },
  ];

  // Pre-seed deterministic positions so React doesn't reshuffle
  const stars = React.useMemo(() => {
    const arr = [];
    const rng = (n) => ((n * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 260; i++) {
      const p = PALETTE[i % PALETTE.length];
      const size = rng(i * 7) * 1.6 + 0.4;
      arr.push({
        ...p,
        top: rng(i * 11 + 3) * 100,
        left: rng(i * 13 + 7) * 100,
        size,
        opacity: 0.25 + rng(i * 17) * 0.55,
        twinkleDur: 2 + rng(i * 19) * 4,
        delay: rng(i * 23) * 6,
        kind: 'dim',
      });
    }
    // BRIGHT key stars with cross-flare
    for (let i = 0; i < 12; i++) {
      arr.push({
        color: i % 3 === 0 ? '#fff3b0' : (i % 3 === 1 ? '#cfe7ff' : '#ffffff'),
        glow: i % 3 === 0 ? 'rgba(255,243,176,0.95)' : (i % 3 === 1 ? 'rgba(207,231,255,0.95)' : 'rgba(255,255,255,0.95)'),
        top: rng(i * 41 + 100) * 90 + 5,
        left: rng(i * 53 + 200) * 90 + 5,
        size: 2.2 + rng(i * 31) * 1.6,
        opacity: 0.9,
        twinkleDur: 3 + rng(i * 61) * 3,
        delay: rng(i * 71) * 4,
        kind: 'bright',
      });
    }
    return arr;
  }, []);

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {stars.map((s, i) => s.kind === 'bright' ? (
        <span key={i} style={{
          position: 'absolute',
          top: s.top + '%',
          left: s.left + '%',
          width: 2, height: 2,
          animation: `starTwinkle ${s.twinkleDur}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }}>
          <span style={{
            position: 'absolute', inset: 0,
            background: s.color, borderRadius: '50%',
            width: s.size, height: s.size,
            boxShadow: `0 0 ${s.size * 3.5}px ${s.glow}, 0 0 ${s.size * 1.6}px ${s.color}`,
            transform: 'translate(-50%, -50%)', left: '50%', top: '50%',
          }} />
        </span>
      ) : (
        <span key={i} style={{
          position: 'absolute',
          top: s.top + '%',
          left: s.left + '%',
          width: s.size, height: s.size,
          background: s.color,
          borderRadius: '50%',
          opacity: s.opacity,
          boxShadow: s.size > 1.4 ? `0 0 ${s.size * 2.5}px ${s.glow}` : 'none',
          animation: `starTwinkle ${s.twinkleDur}s ease-in-out infinite`,
          animationDelay: `${s.delay}s`,
        }} />
      ))}
      <style>{`
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.95; transform: scale(1.55); }
        }
      `}</style>
    </div>
  );
}

function ShootingStars() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0, pointerEvents: 'none' }}>
      {[...Array(5)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${8 + i * 18}%`,
          right: `-220px`,
          width: 140,
          height: 1.5,
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
          animation: `shootingStar ${5 + i * 1.5}s linear infinite`,
          animationDelay: `${i * 2.8}s`,
          borderRadius: 2,
          boxShadow: '0 0 4px rgba(255,255,255,0.5)',
          transform: 'rotate(-15deg)',
        }} />
      ))}
    </div>
  );
}
