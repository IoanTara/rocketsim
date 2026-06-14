import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

function createEarthTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Deep ocean base
  ctx.fillStyle = '#0d2545';
  ctx.fillRect(0, 0, 1024, 512);

  // Ocean depth gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, 512);
  oceanGrad.addColorStop(0, 'rgba(20,60,120,0.5)');
  oceanGrad.addColorStop(0.5, 'rgba(15,45,100,0.3)');
  oceanGrad.addColorStop(1, 'rgba(8,20,60,0.6)');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, 1024, 512);

  // Noise dots for ocean texture
  ctx.fillStyle = 'rgba(60,120,200,0.08)';
  for (let i = 0; i < 1500; i++) {
    const x = Math.random() * 1024, y = Math.random() * 512;
    ctx.beginPath(); ctx.arc(x, y, Math.random() * 1.5, 0, Math.PI * 2); ctx.fill();
  }

  // Continents — irregular shapes via overlapping ellipses
  function continent(x, y, baseColor, lights, ellipses) {
    ctx.fillStyle = baseColor;
    ellipses.forEach(e => {
      ctx.beginPath();
      ctx.ellipse(x + e.dx, y + e.dy, e.rx, e.ry, e.rot || 0, 0, Math.PI * 2);
      ctx.fill();
    });
    // Highlights
    ctx.fillStyle = lights;
    ellipses.forEach(e => {
      if (Math.random() < 0.6) {
        ctx.beginPath();
        ctx.ellipse(x + e.dx - 4, y + e.dy - 6, e.rx * 0.4, e.ry * 0.4, e.rot || 0, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  // Eurasia
  continent(620, 170, '#1e4d1a', 'rgba(60,120,40,0.4)', [
    { dx: 0, dy: 0, rx: 160, ry: 60, rot: 0.15 },
    { dx: -100, dy: 20, rx: 80, ry: 50, rot: 0.1 },
    { dx: 120, dy: -10, rx: 70, ry: 40 },
    { dx: 200, dy: 30, rx: 60, ry: 35, rot: -0.1 },
  ]);

  // Africa
  continent(550, 290, '#2d6020', 'rgba(80,140,50,0.35)', [
    { dx: 0, dy: 0, rx: 55, ry: 90, rot: 0.1 },
    { dx: -25, dy: -30, rx: 35, ry: 50 },
    { dx: 10, dy: 60, rx: 30, ry: 45 },
  ]);

  // North America
  continent(220, 170, '#1e4d1a', 'rgba(60,120,40,0.4)', [
    { dx: 0, dy: 0, rx: 110, ry: 75, rot: -0.2 },
    { dx: -50, dy: 50, rx: 50, ry: 35 },
    { dx: 70, dy: -20, rx: 40, ry: 30 },
  ]);

  // South America
  continent(290, 340, '#2d6020', 'rgba(80,140,50,0.35)', [
    { dx: 0, dy: 0, rx: 45, ry: 90, rot: 0.15 },
    { dx: -15, dy: -50, rx: 35, ry: 40 },
  ]);

  // Australia
  continent(820, 350, '#3d6b25', 'rgba(90,140,50,0.3)', [
    { dx: 0, dy: 0, rx: 55, ry: 35 },
    { dx: -15, dy: -8, rx: 30, ry: 22 },
  ]);

  // Polar caps — bright white
  ctx.fillStyle = 'rgba(240,250,255,0.85)';
  ctx.beginPath(); ctx.ellipse(512, 490, 240, 28, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(512, 22, 200, 26, 0, 0, Math.PI * 2); ctx.fill();
  // Polar feathers
  ctx.fillStyle = 'rgba(240,250,255,0.5)';
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    ctx.ellipse(Math.random() * 1024, 480 + Math.random() * 30, Math.random() * 60 + 20, Math.random() * 8 + 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(Math.random() * 1024, 5 + Math.random() * 30, Math.random() * 60 + 20, Math.random() * 8 + 3, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Clouds — multiple layers
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  for (let i = 0; i < 35; i++) {
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * 1024,
      Math.random() * 512,
      Math.random() * 80 + 25,
      Math.random() * 18 + 6,
      Math.random() * Math.PI,
      0, Math.PI * 2
    );
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  for (let i = 0; i < 60; i++) {
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * 1024,
      Math.random() * 512,
      Math.random() * 40 + 10,
      Math.random() * 10 + 3,
      Math.random() * Math.PI,
      0, Math.PI * 2
    );
    ctx.fill();
  }

  return new THREE.CanvasTexture(canvas);
}

function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 1024, 512);
  ctx.fillStyle = 'rgba(255,255,255,0.22)';
  for (let i = 0; i < 70; i++) {
    ctx.beginPath();
    ctx.ellipse(
      Math.random() * 1024,
      Math.random() * 512,
      Math.random() * 80 + 30,
      Math.random() * 20 + 6,
      Math.random() * Math.PI,
      0, Math.PI * 2
    );
    ctx.fill();
  }
  return new THREE.CanvasTexture(canvas);
}

export default function EarthBg() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    const W = window.innerWidth, H = window.innerHeight;
    renderer.setSize(W, H);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    Object.assign(renderer.domElement.style, {
      position: 'absolute', inset: 0, width: '100%', height: '100%',
      opacity: 0.52,
    });

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, W / H, 0.1, 100);
    camera.position.set(0, 0, 5);

    scene.add(new THREE.AmbientLight(0x223344, 0.5));
    const sun = new THREE.DirectionalLight(0xfff2dd, 1.6);
    sun.position.set(5, 3, 4);
    scene.add(sun);
    const rim = new THREE.DirectionalLight(0x4488ff, 0.5);
    rim.position.set(-4, 1, -3);
    scene.add(rim);
    const fill = new THREE.PointLight(0x88ccff, 0.4);
    fill.position.set(-2, -1, 2);
    scene.add(fill);

    const earthRadius = 2.8;
    const earthTex = createEarthTexture();
    const earthGeo = new THREE.SphereGeometry(earthRadius, 96, 96);
    const earthMat = new THREE.MeshPhongMaterial({
      map: earthTex,
      shininess: 22,
      specular: new THREE.Color(0x335577),
      bumpScale: 0.04,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    earth.position.set(4, -3, -5);
    earth.rotation.z = Math.PI * 0.13; // axial tilt
    scene.add(earth);

    // Cloud layer
    const cloudTex = createCloudTexture();
    const cloudGeo = new THREE.SphereGeometry(earthRadius + 0.04, 64, 64);
    const cloudMat = new THREE.MeshPhongMaterial({
      map: cloudTex,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    clouds.position.copy(earth.position);
    clouds.rotation.z = earth.rotation.z;
    scene.add(clouds);

    // Inner atmosphere
    const atmosGeo = new THREE.SphereGeometry(earthRadius + 0.08, 64, 64);
    const atmosMat = new THREE.MeshPhongMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.12,
      side: THREE.FrontSide,
      depthWrite: false,
    });
    const atmos = new THREE.Mesh(atmosGeo, atmosMat);
    atmos.position.copy(earth.position);
    scene.add(atmos);

    // Outer atmosphere glow
    const glowGeo = new THREE.SphereGeometry(earthRadius + 0.18, 64, 64);
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0x4477cc,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    glow.position.copy(earth.position);
    scene.add(glow);

    function resize() {
      const w = window.innerWidth, h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    }
    window.addEventListener('resize', resize);

    let raf;
    function loop() {
      raf = requestAnimationFrame(loop);
      earth.rotation.y += 0.00045;
      clouds.rotation.y += 0.00065;
      atmos.rotation.y += 0.0003;
      renderer.render(scene, camera);
    }
    loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
      earthGeo.dispose(); earthMat.dispose(); earthTex.dispose();
      cloudGeo.dispose(); cloudMat.dispose(); cloudTex.dispose();
      atmosGeo.dispose(); atmosMat.dispose();
      glowGeo.dispose(); glowMat.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }} />;
}
