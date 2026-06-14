// Flattened tilted ellipse — edge-concentrated rim (left/right), sparse center for 3D feel
export class Particle {
  constructor(homeX, homeY, color, size, alpha = null) {
    this.homeX = homeX;
    this.homeY = homeY;
    this.x = homeX + (Math.random() - 0.5) * 600;
    this.y = homeY + (Math.random() - 0.5) * 600;
    this.vx = 0;
    this.vy = 0;
    this.color = color;
    this.baseSize = size;
    this.size = size;
    this.phase = Math.random() * Math.PI * 2;
    this.speed = Math.random() * 0.03 + 0.01;
    this.baseAlpha = alpha !== null ? alpha : Math.random() * 0.3 + 0.7;
    this.alpha = this.baseAlpha;
  }

  update(time, mouseX, mouseY, floatX, floatY) {
    const tx = this.homeX + floatX, ty = this.homeY + floatY;
    if (mouseX > 0) {
      const dx = this.x - mouseX, dy = this.y - mouseY;
      const d2 = dx * dx + dy * dy, R = 60;
      if (d2 < R * R && d2 > 0) {
        const d = Math.sqrt(d2), f = (R - d) / R * 2.6;
        this.vx += dx / d * f;
        this.vy += dy / d * f;
      }
    }
    this.vx += (tx - this.x) * 0.11;
    this.vy += (ty - this.y) * 0.11;
    this.vx *= 0.78; this.vy *= 0.78;
    this.x += this.vx; this.y += this.vy;
    this.phase += this.speed;
    this.size = this.baseSize * (0.85 + Math.sin(this.phase) * 0.15);
    this.alpha = this.baseAlpha * (0.62 + Math.sin(this.phase * 0.7) * 0.32);
  }

  draw(ctx) {
    ctx.globalAlpha = Math.max(0, Math.min(1, this.alpha));
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(0.3, this.size), 0, Math.PI * 2);
    ctx.fill();
  }
}

export function generateRocketPoints(W, H) {
  const pts = [];
  const cx = W * 0.70;
  const cy = H * 0.44;
  // 2× bigger
  const scale = Math.min(H * 1.1, 1060);
  const ang = Math.PI / 5; // tilt other direction
  const cosA = Math.cos(ang), sinA = Math.sin(ang);

  // Flattened — width >> height
  const RWID = scale * 0.42;
  const RLEN = scale * 0.21; // slightly thicker

  function rot(lx, ly) {
    return { x: cx + lx * cosA - ly * sinA, y: cy + lx * sinA + ly * cosA };
  }
  function rnd(a, b) { return a + Math.random() * (b - a); }

  const PALETTE = ['#ffffff', '#fffde7', '#ffd54f', '#ffab40', '#ffa030', '#ff8c00', '#e87020', '#c45a00'];
  function pick() { return PALETTE[Math.floor(Math.random() * PALETTE.length)]; }

  // FULL PERIMETER RIM — dense thin outline around entire ellipse for crisp contour
  for (let i = 0; i < 900; i++) {
    const theta = Math.random() * Math.PI * 2;
    const r = 0.93 + Math.random() * 0.07;
    const lx = Math.cos(theta) * r * RWID;
    const ly = Math.sin(theta) * r * RLEN;
    // apply left-tip sharpening when lx < 0 (will tighten near nose)
    let okLy = ly;
    if (lx < 0) {
      const txAbs = -lx / RWID;
      const u = 1 - txAbs;
      const sharpMax = RLEN * Math.sqrt(u * (2 - u)) * Math.pow(u, 0.18);
      if (Math.abs(ly) > sharpMax) okLy = Math.sign(ly) * sharpMax;
    }
    const p = rot(lx, okLy);
    pts.push({
      x: p.x, y: p.y,
      color: pick(),
      size: rnd(2, 3.6),
      alpha: rnd(0.78, 0.96),
    });
  }

  // Left-tip sharpening profile — pointier than ellipse
  function leftBoundFrac(txAbs) {
    const u = 1 - txAbs; // 0 at tip, 1 at center
    return Math.sqrt(u * (2 - u)) * Math.pow(u, 0.18);
  }
  // LEFT EDGE (sign=-1) — sharp pointed tip rim
  for (let i = 0; i < 900; i++) {
    const txAbs = 0.70 + Math.random() * 0.30;
    const lx = -RWID * txAbs;
    const maxLy = RLEN * leftBoundFrac(txAbs);
    const ly = (Math.random() * 2 - 1) * maxLy;
    const p = rot(lx, ly);
    pts.push({
      x: p.x, y: p.y,
      color: pick(),
      size: rnd(2.2, 4),
      alpha: rnd(0.75, 0.95),
    });
  }

  // RIGHT EDGE — main rim
  for (let i = 0; i < 480; i++) {
    const txAbs = 0.70 + Math.random() * 0.30;
    const lx = RWID * txAbs;
    const maxLy = RLEN * Math.sqrt(Math.max(0, 1 - txAbs * txAbs));
    const ly = (Math.random() * 2 - 1) * maxLy;
    const p = rot(lx, ly);
    pts.push({
      x: p.x, y: p.y,
      color: pick(),
      size: rnd(2.2, 4),
      alpha: rnd(0.7, 0.9),
    });
  }

  // RIGHT-BOTTOM SOFT HAZE — fuzzy spillover beyond rim in lower-right quadrant
  for (let i = 0; i < 200; i++) {
    // sample direction inside lower-right quadrant of ellipse expanding
    const txAbs = 0.85 + Math.pow(Math.random(), 0.5) * 0.55; // 0.85 → 1.40
    const tyAbs = Math.pow(Math.random(), 0.5);              // bias toward edge of ellipse vertically
    const lx = RWID * txAbs;
    const ly = RLEN * tyAbs * 1.15; // slightly beyond rim
    // overflow = how far past unit circle in elliptic coords
    const r2 = txAbs * txAbs + tyAbs * tyAbs;
    const overflow = Math.max(0, r2 - 1) * 1.3;
    const fade = Math.max(0.05, 1 - overflow * 1.2);
    const p = rot(lx, ly);
    pts.push({
      x: p.x, y: p.y,
      color: pick(),
      size: rnd(1.4, 3),
      alpha: rnd(0.25, 0.7) * fade,
    });
  }

  // STABILIZERS — 3 narrow blue blades from body BOTTOM edge, sticking down (local +Y)
  const FIN_COLORS = ['#4fc3f7', '#64b5f6', '#80deea', '#90caf9', '#ffffff', '#29b6f6'];
  function pickFin() { return FIN_COLORS[Math.floor(Math.random() * FIN_COLORS.length)]; }

  // Swept-back fin triangle: A = forward root, B = rear root, C = tip (perpendicular + back)
  function addFin(Ax, Ay, Bx, By, Cx, Cy, count) {
    for (let i = 0; i < count; i++) {
      let u = Math.random(), v = Math.random();
      if (u + v > 1) { u = 1 - u; v = 1 - v; }
      const w = 1 - u - v;
      const lx = u * Ax + v * Bx + w * Cx;
      const ly = u * Ay + v * By + w * Cy;
      const p = rot(lx, ly);
      pts.push({
        x: p.x, y: p.y,
        color: pickFin(),
        size: rnd(1.6, 3.3),
        alpha: rnd(0.68, 0.92),
      });
    }
  }

  // ILLUMINATOR — centered on body, highlight positioned per screen-light direction
  const WIN_LX = 0;
  const WIN_LY = 0;
  const WIN_R = Math.min(RWID * 0.21, RLEN * 0.73);
  // Highlight in local — corresponds to screen upper-left (inverse rotation applied)
  const HL_OFF_X = -WIN_R * 0.38;
  const HL_OFF_Y = -WIN_R * 0.10;
  for (let i = 0; i < 620; i++) {
    // sample inside window disc (slightly elliptic vertically)
    const r = Math.sqrt(Math.random()) * WIN_R;
    const a = Math.random() * Math.PI * 2;
    const lx = WIN_LX + Math.cos(a) * r;
    const ly = WIN_LY + Math.sin(a) * r * 0.85;
    // skip if outside body ellipse
    if ((lx / RWID) ** 2 + (ly / RLEN) ** 2 > 0.97) continue;
    // distance from highlight (for convex bulge shading)
    const hdx = lx - (WIN_LX + HL_OFF_X);
    const hdy = ly - (WIN_LY + HL_OFF_Y);
    const hDist = Math.sqrt(hdx * hdx + hdy * hdy) / WIN_R;
    // distance from window center (radial)
    const cDist = r / WIN_R;
    let color, size, alpha;
    if (hDist < 0.10) {
      // small bright highlight
      color = Math.random() < 0.4 ? '#ffffff' : '#fffde7';
      size = rnd(3.5, 5.5); alpha = rnd(0.92, 1.0);
    } else if (hDist < 0.4) {
      color = Math.random() < 0.75 ? '#90caf9' : '#b3e5fc';
      size = rnd(2.5, 4.2); alpha = rnd(0.78, 0.92);
    } else if (cDist < 0.55) {
      color = Math.random() < 0.55 ? '#4fc3f7' : '#64b5f6';
      size = rnd(2.5, 4.2); alpha = rnd(0.7, 0.88);
    } else if (cDist < 0.85) {
      color = Math.random() < 0.55 ? '#29b6f6' : '#1e88e5';
      size = rnd(2, 3.5); alpha = rnd(0.55, 0.78);
    } else {
      color = Math.random() < 0.55 ? '#1565c0' : '#0d47a1';
      size = rnd(1.5, 3); alpha = rnd(0.42, 0.68);
    }
    const p = rot(lx, ly);
    pts.push({ x: p.x, y: p.y, color, size, alpha });
  }

  // 4 fins total, 3 visible. Roots ON body surface (ellipse boundary).
  function onSurface(lxFrac, sign) {
    // returns ly for point on ellipse boundary at lxFrac of RWID, on specified side (sign)
    const lx = RWID * lxFrac;
    const ly = sign * RLEN * Math.sqrt(Math.max(0, 1 - lxFrac * lxFrac));
    return { lx, ly };
  }
  // UPPER fin — attached on upper body surface
  {
    const a = onSurface(0.50, -1);
    const b = onSurface(0.92, -1);
    addFin(a.lx, a.ly, b.lx, b.ly, RWID * 1.10, -RLEN * 0.95, 360);
  }
  // LOWER fin — attached on lower body surface
  {
    const a = onSurface(0.50, +1);
    const b = onSurface(0.92, +1);
    addFin(a.lx, a.ly, b.lx, b.ly, RWID * 1.10, RLEN * 0.95, 360);
  }
  // FRONT fin — foreshortened, root straddles axis on rear
  addFin(
    RWID * 0.55,  RLEN * 0.05,
    RWID * 0.92, -RLEN * 0.03,
    RWID * 1.30,  RLEN * 0.02,
    220
  );

  // VOLUME LIGHTING — 800 particles inside ellipse with screen-Y based depth shading
  // Upper screen side: brighter+bigger (lit). Lower: dimmer+smaller (shadow).
  for (let i = 0; i < 800; i++) {
    // sample uniformly inside ellipse (rejection)
    let lx, ly;
    do {
      lx = (Math.random() * 2 - 1) * RWID;
      ly = (Math.random() * 2 - 1) * RLEN;
    } while ((lx / RWID) ** 2 + (ly / RLEN) ** 2 > 0.92);
    // compute screen-y relative to body center
    const screenY = lx * sinA + ly * cosA; // negative = upper, positive = lower
    const upperness = -screenY / (RWID * Math.abs(sinA) + RLEN * Math.abs(cosA)); // -1..+1, +1 upper
    // Lit factor: 0 dark, 1 bright
    const lit = (upperness + 1) * 0.5;
    let color, size, alpha;
    if (lit > 0.72) {
      color = Math.random() < 0.5 ? '#fffde7' : pick();
      size = rnd(2.5, 4);
      alpha = rnd(0.6, 0.85);
    } else if (lit > 0.4) {
      color = pick();
      size = rnd(1.8, 3.2);
      alpha = rnd(0.4, 0.7);
    } else {
      color = Math.random() < 0.4 ? '#c45a00' : pick();
      size = rnd(1.2, 2.4);
      alpha = rnd(0.2, 0.5);
    }
    const p = rot(lx, ly);
    pts.push({ x: p.x, y: p.y, color, size, alpha });
  }

  // INTERIOR chaos — scattered random color, very sparse
  for (let i = 0; i < 400; i++) {
    const sign = Math.random() < 0.5 ? -1 : 1;
    const txAbs = Math.random() * 0.7;
    const lx = sign * RWID * txAbs;
    const maxLy = RLEN * Math.sqrt(Math.max(0, 1 - txAbs * txAbs));
    const ly = (Math.random() * 2 - 1) * maxLy;
    const p = rot(lx, ly);
    pts.push({
      x: p.x, y: p.y,
      color: pick(),
      size: rnd(1.5, 3),
      alpha: rnd(0.4, 0.7),
    });
  }

  // REAR TRAIL HAZE — soften the back edge across full rear span (top fin → bottom fin),
  // light wisp like rocket in flight. Rear only (right side, lx>0).
  for (let i = 0; i < 200; i++) {
    const txAbs = 0.88 + Math.pow(Math.random(), 0.7) * 0.52; // 0.88 → 1.40, biased near rim
    const lx = RWID * txAbs;
    const ly = (Math.random() * 2 - 1) * RLEN * 0.95; // full vertical span between fins
    const overflow = Math.max(0, txAbs - 1);           // how far past rear rim
    const fade = Math.max(0.04, 1 - overflow * 1.6);
    const p = rot(lx, ly);
    pts.push({
      x: p.x, y: p.y,
      color: pick(),
      size: rnd(1.2, 2.6),
      alpha: rnd(0.12, 0.4) * fade,
    });
  }

  return pts;
}
