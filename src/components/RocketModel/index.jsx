import React from 'react';

// 3D rocket = pre-rendered PNG (Politech green). Restored from reference index.html.
export default function RocketModel({ animate = true, exhaust = false, style = {} }) {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center',
      ...style,
    }}>
      {exhaust && (
        <div className="rocket-flame" style={{
          position: 'absolute',
          bottom: '2%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '34%',
          height: '40%',
          background: 'radial-gradient(ellipse 50% 60% at 50% 0%, #fff 0%, #ffe08a 22%, #ff9a3c 50%, #ff5e3a 75%, rgba(255,94,58,0) 100%)',
          borderRadius: '50% 50% 50% 50% / 20% 20% 80% 80%',
          filter: 'blur(2px)',
          zIndex: 1,
          pointerEvents: 'none',
        }} />
      )}
      <img
        src="/images/rocket3d.png"
        alt="3D модель ракеты"
        className={animate ? 'rocket-float' : ''}
        style={{
          position: 'relative',
          zIndex: 2,
          maxHeight: '100%',
          maxWidth: '100%',
          height: 'auto',
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.35))',
        }}
      />
      <style>{`
        .rocket-float { animation: rocketFloat 3.5s ease-in-out infinite; }
        @keyframes rocketFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .rocket-flame { animation: rocketFlame 0.12s steps(2) infinite; transform-origin: 50% 0%; }
        @keyframes rocketFlame {
          0% { transform: translateX(-50%) scaleY(1) scaleX(1); opacity: 0.95; }
          100% { transform: translateX(-50%) scaleY(1.18) scaleX(0.9); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
