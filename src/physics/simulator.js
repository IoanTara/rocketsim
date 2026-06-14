// Physics simulator — copied verbatim from index.html / js/physics.js
// DO NOT MODIFY — produces ~34m for default params (5.5 bar, 0.4L water, 1.5L tank, 350g, 92mm, 10mm, Cd=0.5)

const G = 9.81;
const RHO_W = 1000;
const RHO_AIR = 1.225;
const P_ATM = 101325;
const GAMMA = 1.4;
const R_AIR = 287;
const T_K = 293;
const CD_NOZ = 0.98;
const DT = 0.001;

export function simulate(p) {
  const p_gauge = p.pressure * 100000;
  const V_total = p.tankVol * 0.001;
  const V_water0 = p.waterVol * 0.001;
  const d_rocket = p.diameter * 0.001;
  const d_nozzle = p.nozzle * 0.001;
  const m_dry = p.dryMass * 0.001;
  const Cd = p.cd;
  const L_tube = 0.02;

  const V_air0 = V_total - V_water0;
  const p_air0 = P_ATM + p_gauge;
  const A_nozzle = Math.PI * (d_nozzle / 2) ** 2;
  const A_rocket = Math.PI * (d_rocket / 2) ** 2;
  const m_water0 = RHO_W * V_water0;
  const m_total0 = m_dry + m_water0;

  // Phase 1: Launch tube
  const u_e1 = CD_NOZ * Math.sqrt(2 * p_gauge / RHO_W);
  const F_thrust1 = RHO_W * A_nozzle * u_e1 * u_e1;
  const a1 = (F_thrust1 - m_total0 * G) / m_total0;
  const v_tube = a1 > 0 ? Math.sqrt(2 * a1 * L_tube) : 0;
  const t1_end = a1 > 0 && v_tube > 0 ? v_tube / a1 : 0;

  // Phase 2: Water thrust
  let v = v_tube, y = L_tube, t = t1_end;
  let V_air = V_air0, p_air = p_air0;
  let m_water = m_water0, m_total = m_dry + m_water;
  const pts = [{ t: 0, y: 0, vel: 0, phase: 1 }];
  if (L_tube > 0) pts.push({ t: t1_end, y: L_tube, vel: v_tube, phase: 1 });
  const phase2_start = { t, y, vel: v };
  let safety = 0;
  while (m_water > 0 && p_air > P_ATM && safety++ < 200000) {
    const u_e = CD_NOZ * Math.sqrt(2 * Math.max(0, p_air - P_ATM) / RHO_W);
    const m_dot = RHO_W * A_nozzle * u_e;
    const F_thrust = m_dot * u_e;
    const F_drag = 0.5 * Cd * A_rocket * RHO_AIR * v * v;
    const a = (F_thrust - F_drag - m_total * G) / m_total;
    v += a * DT; y += v * DT; t += DT;
    const dV = m_dot * DT / RHO_W;
    V_air += dV; m_water -= m_dot * DT;
    if (m_water < 0) m_water = 0;
    p_air = p_air0 * Math.pow(V_air0 / V_air, GAMMA);
    m_total = m_dry + m_water;
    pts.push({ t, y: Math.max(0, y), vel: v, phase: 2 });
  }
  const phase2_end = { t, y, vel: v };
  const burnEndIdx = pts.length - 1;
  const burnTime = t;

  // Phase 3: Air impulse/blowdown
  let m_air_tank = p_air * V_total / (R_AIR * T_K);
  safety = 0;
  while (p_air > P_ATM && safety++ < 50000) {
    const rho_tank = p_air / (R_AIR * T_K);
    if (rho_tank <= 0) break;
    const u_e = CD_NOZ * Math.sqrt(2 * Math.max(0, p_air - P_ATM) / rho_tank);
    const m_dot_air = rho_tank * A_nozzle * u_e;
    const F_thrust = m_dot_air * u_e;
    const F_drag = 0.5 * Cd * A_rocket * RHO_AIR * v * v;
    const a = (F_thrust - F_drag - m_dry * G) / m_dry;
    v += a * DT; y += v * DT; t += DT;
    m_air_tank -= m_dot_air * DT;
    if (m_air_tank <= 0) break;
    p_air = m_air_tank * R_AIR * T_K / V_total;
    pts.push({ t, y: Math.max(0, y), vel: v, phase: 3 });
  }
  const phase3_end = { t, y, vel: v };
  const airEndIdx = pts.length - 1;

  // Phase 4: Coast up
  safety = 0;
  while (v > 0 && safety++ < 200000) {
    const spd = Math.abs(v);
    const F_drag = 0.5 * Cd * A_rocket * RHO_AIR * spd * spd;
    const a = (-F_drag - m_dry * G) / m_dry;
    v += a * DT; y += v * DT; t += DT;
    pts.push({ t, y: Math.max(0, y), vel: v, phase: 4 });
  }
  const apogeeH = y, apogeeT = t;
  const apogeeIdx = pts.length - 1;

  // Phase 5: Descent
  safety = 0;
  while (y > 0 && safety++ < 500000) {
    const spd = Math.abs(v);
    const F_drag = 0.5 * Cd * A_rocket * RHO_AIR * spd * spd;
    const a = (F_drag - m_dry * G) / m_dry;
    v += a * DT; y += v * DT; t += DT;
    pts.push({ t, y: Math.max(0, y), vel: v, phase: 5 });
    if (y <= 0) break;
  }

  const maxH = pts.reduce((m, p2) => p2.y > m ? p2.y : m, 0);
  const vmax = pts.reduce((m, p2) => Math.abs(p2.vel) > m ? Math.abs(p2.vel) : m, 0);
  const totalTime = t;

  return {
    maxHeight: maxH,
    dryMass: m_dry,
    burnTime,
    burnEndIdx,
    airEndIdx,
    apogeeIdx,
    vmax,
    totalTime,
    points: pts,
    phases: [
      { name: '1. На трубе', h: L_tube.toFixed(2), v: v_tube.toFixed(1), t: t1_end.toFixed(3) },
      { name: '2. Водная тяга', h: phase2_end.y.toFixed(1), v: Math.max(0, phase2_end.vel).toFixed(1), t: phase2_end.t.toFixed(3) },
      { name: '3. Воздух', h: phase3_end.y.toFixed(1), v: Math.max(0, phase3_end.vel).toFixed(1), t: phase3_end.t.toFixed(3) },
      { name: '4. Полёт вверх', h: apogeeH.toFixed(1), v: '0', t: apogeeT.toFixed(2) },
      { name: '5. Падение', h: '0', v: Math.abs(pts[pts.length - 1]?.vel || 0).toFixed(1), t: totalTime.toFixed(1) }
    ]
  };
}

export function checkInputs(p) {
  if (p.nozzle >= p.diameter)
    return { ok: false, hard: 'Ошибка: диаметр сопла должен быть меньше диаметра ракеты', warnings: [] };
  if (p.pressure <= 0 || p.tankVol <= 0 || p.waterVol <= 0 || p.dryMass <= 0)
    return { ok: false, hard: 'Ошибка: давление, объёмы и масса должны быть больше нуля', warnings: [] };
  if (p.waterVol >= p.tankVol)
    return { ok: false, hard: 'Ошибка: объём воды должен быть меньше объёма бака', warnings: [] };
  const w = [];
  const nr = p.nozzle / p.diameter;
  if (nr > 0.7) w.push('⚠ Сопло >70% диаметра — нереалистичный сценарий');
  if (p.tankVol > 10) w.push('⚠ Объём бака >10л — нереалистично для водяной ракеты');
  if (p.pressure > 15) w.push('⚠ Давление >15 бар — опасно для ПЭТ-бутылок (макс. ~8 бар)');
  if (p.dryMass < 50) w.push('⚠ Сухая масса <50г — нереалистично');
  return { ok: true, hard: null, warnings: w };
}
