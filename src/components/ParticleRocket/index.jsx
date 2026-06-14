import React, { useEffect, useRef } from 'react';
import { Particle, generateRocketPoints } from './particles.js';

export default function ParticleRocket({ exploding: extExplode = false }) {
  const canvasRef = useRef(null);
  const stateRef = useRef({
    particles: [], mouseX: -1, mouseY: -1, animId: 0,
  });

  // Re-init on explode trigger
  useEffect(() => {
    if (!extExplode) return;
    setTimeout(() => {
      const c = canvasRef.current;
      if (!c) return;
      const dpr = window.devicePixelRatio || 1;
      const W = c.width / dpr, H = c.height / dpr;
      const pts = generateRocketPoints(W, H);
      const mob = window.innerWidth < 768;
      const ratio = mob ? 0.5 : 1.0;
      const sel = pts.filter(() => Math.random() < ratio);
      stateRef.current.particles = sel.map(p => new Particle(p.x, p.y, p.color, p.size, p.alpha));
    }, 1500);
  }, [extExplode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const state = stateRef.current;

    function init() {
      const dpr = window.devicePixelRatio || 1;
      const W = canvas.offsetWidth || window.innerWidth;
      const H = canvas.offsetHeight || window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      const pts = generateRocketPoints(W, H);
      const mob = window.innerWidth < 768;
      const ratio = mob ? 0.5 : 1.0;
      const sel = pts.filter(() => Math.random() < ratio);
      state.particles = sel.map(p => new Particle(p.x, p.y, p.color, p.size, p.alpha));
    }

    function animate() {
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      ctx.globalCompositeOperation = 'lighter';
      const time = Date.now();
      const floatY = Math.sin(time * 0.0007) * 16;
      const floatX = Math.cos(time * 0.0005) * 5;
      for (const p of state.particles) {
        p.update(time, state.mouseX, state.mouseY, floatX, floatY);
        p.draw(ctx);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      state.animId = requestAnimationFrame(animate);
    }

    function onMove(e) {
      const r = canvas.getBoundingClientRect();
      const touch = e.touches ? e.touches[0] : e;
      state.mouseX = touch.clientX - r.left;
      state.mouseY = touch.clientY - r.top;
    }
    function onLeave() { state.mouseX = -1; state.mouseY = -1; }

    function onResize() {
      cancelAnimationFrame(state.animId);
      init();
      animate();
    }

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onLeave);
    window.addEventListener('resize', onResize, { passive: true });

    init();
    animate();

    return () => {
      cancelAnimationFrame(state.animId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onLeave);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    />
  );
}
