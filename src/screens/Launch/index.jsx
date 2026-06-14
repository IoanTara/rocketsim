import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/useStore.js';
import { simulate } from '../../physics/simulator.js';

export default function Launch() {
  const { params, setResult, setScreen } = useStore();
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // run simulation, keep only the logic
    const r = simulate(params);
    setResult(r);
    // show overlay 800ms, then fade out 300ms, then go to Results
    const tFade = setTimeout(() => setClosing(true), 800);
    const tGo = setTimeout(() => setScreen('results'), 1100);
    return () => { clearTimeout(tFade); clearTimeout(tGo); };
  }, []);

  // 60 deterministic twinkling stars
  const stars = useMemo(() => {
    const rng = (n) => ((Math.sin(n * 99.13) * 43758.5453) % 1 + 1) % 1;
    return Array.from({ length: 60 }, (_, i) => ({
      top: rng(i * 3 + 1) * 100,
      left: rng(i * 7 + 2) * 100,
      size: 0.6 + rng(i * 11 + 3) * 1.8,
      opacity: 0.2 + rng(i * 13 + 4) * 0.5,
      dur: 2.5 + rng(i * 17 + 5) * 3.5,
      delay: rng(i * 19 + 6) * 4,
    }));
  }, []);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200, overflow: 'hidden',
      background: 'rgba(5,8,16,0.85)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22,
      opacity: closing ? 0 : 1, transition: 'opacity 0.3s ease',
    }}>
      {/* stars */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {stars.map((s, i) => (
          <span key={i} style={{
            position: 'absolute', top: s.top + '%', left: s.left + '%',
            width: s.size, height: s.size, borderRadius: '50%', background: '#fff', opacity: s.opacity,
            animation: `launchTwinkle ${s.dur}s ease-in-out infinite`, animationDelay: `${s.delay}s`,
          }} />
        ))}
      </div>

      {/* tiny Politech logo */}
      <img src="/images/logopol.png" height="22" alt="Политех"
        style={{ position: 'relative', objectFit: 'contain', opacity: 0.3, marginBottom: 4 }} />

      {/* loading dots */}
      <div style={{ position: 'relative', display: 'flex', gap: 11 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 8, height: 8, borderRadius: '50%', background: '#fff',
            animation: 'launchDot 1.1s ease-in-out infinite', animationDelay: `${i * 0.16}s`,
          }} />
        ))}
      </div>

      <div style={{
        position: 'relative', fontFamily: 'var(--font-body)', fontSize: 11, letterSpacing: 3,
        color: 'rgba(255,255,255,0.4)', textTransform: 'lowercase',
      }}>
        вычисление траектории
      </div>

      <style>{`
        @keyframes launchDot {
          0%, 100% { transform: scale(0.7); background: rgba(255,255,255,0.5); }
          50% { transform: scale(1.15); background: #4caf50; box-shadow: 0 0 10px rgba(76,175,80,0.6); }
        }
        @keyframes launchTwinkle {
          0%, 100% { opacity: 0.18; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
