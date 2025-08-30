import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * ---- Persistent ECG engine (module-scope) ----
 * Survives React remounts. Keeps buffers/timebase.
 */
type Sample = { v: number; risk: boolean };
type EngineState = {
  ctx: CanvasRenderingContext2D | null;
  canvas: HTMLCanvasElement | null;
  raf: number | null;
  points: Sample[];
  prevY: number;
  x: number;
  isRisk: boolean;
  riskSince: number | null;
  maxPoints: number;
};

const ECG_ENGINE: EngineState = {
  ctx: null,
  canvas: null,
  raf: null,
  points: [],
  prevY: 0.5,
  x: 0,
  isRisk: false,
  riskSince: null,
  maxPoints: 600,
};

// ---------- helpers ----------
// Smooth step for eased edges
const smoothStep = (t: number) => t * t * (3 - 2 * t);

// Flat-top pulse: quick rise, hold, slow fall
const flatTop = (
  t: number,
  start: number,
  riseDur: number,
  holdDur: number,
  fallDur: number,
  amp: number
) => {
  const r1 = start;
  const r2 = r1 + riseDur;
  const h2 = r2 + holdDur;
  const f2 = h2 + fallDur;

  if (t < r1 || t > f2) return 0;
  if (t < r2) return amp * smoothStep((t - r1) / riseDur);               // rise
  if (t < h2) return amp;                                               // hold (flat top)
  return amp * (1 - smoothStep((t - h2) / fallDur));                    // fall
};

// Cosine dome to add convex “tombstone” curvature on top of the flat-top
const cosDome = (t: number, start: number, end: number, amp: number) => {
  if (t < start || t > end) return 0;
  const s = (t - start) / (end - start);
  return amp * (1 - Math.cos(Math.PI * s)) * 0.5;
};

// Asymmetric bump for P/T shaping
const skewBump = (tt: number, center: number, width: number, amp: number, skew: number) => {
  const z = (tt - center) / width;
  const g = Math.exp(-0.5 * z * z);
  const s = 1 / (1 + Math.exp(-skew * z));
  return amp * g * s;
};

// ---------- morphology (V2-style STEMI with wider top) ----------
function generateECGValue(x: number, abnormal: boolean): number {
  const baseline = 0.4;

  const samplesPerBeat = abnormal ? 180 : 150;
  const t = ((x % samplesPerBeat) as number) / samplesPerBeat;

  let v = 0;

  // P wave
  v += skewBump(t, 0.115, 0.022, 0.09, 2.0);

  if (!abnormal) {
    // -------- NORMAL --------
    v += Math.exp(-0.5 * Math.pow((t - 0.200) / 0.008, 2)) * -0.12; // Q
    v += Math.exp(-0.5 * Math.pow((t - 0.220) / 0.006, 2)) * 1.22; // R
    v += Math.exp(-0.5 * Math.pow((t - 0.238) / 0.010, 2)) * -0.19; // S
    v += skewBump(t, 0.40, 0.050, 0.30, -2.0);                       // T
  } else {
    // -------- V2 STEMI --------
    // rS: tiny r, deep/wide S
    v += Math.exp(-0.5 * Math.pow((t - 0.218) / 0.004, 2)) * 0.34; // small r
    v += Math.exp(-0.5 * Math.pow((t - 0.240) / 0.013, 2)) * -1.15; // deep S

    // ST elevation with a WIDER TOP (the part you asked for)
    const j = 0.255;                 // J-point
    const riseDur = 0.020;           // quick upstroke
    const holdDur = 0.30;           // << stay high longer (wider top)
    const fallDur = 0.080;           // slower descent
    const stAmp = 0.64;            // overall ST lift before ampScale

    v += flatTop(t, j, riseDur, holdDur, fallDur, stAmp);             // flat top
    v += cosDome(t, j + 0.010, j + 0.070, stAmp * 0.18);              // convex “tombstone” on top

    // Hyperacute T — make it broader so the apex isn’t pointy
    v += skewBump(t, 0.420, 0.075, 0.40, -0.9);

    // tiny lift near ST/T junction to keep it smooth
    v += Math.exp(-0.5 * Math.pow((t - 0.375) / 0.020, 2)) * 0.04;
  }

  // scale + light noise/wander
  const ampScale = 0.21;
  let value = baseline + v * ampScale;
  value += (Math.random() - 0.5) * 0.0012;
  value += 0.0025 * Math.sin(2 * Math.PI * t * 0.45);

  // clamp
  value = Math.min(0.95, Math.max(0.05, value));
  return value;
}


function layoutCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const cssW = canvas.offsetWidth || 0;
  const cssH = canvas.offsetHeight || 0;
  const pxW = Math.floor(cssW * dpr);
  const pxH = Math.floor(cssH * dpr);
  if (canvas.width !== pxW || canvas.height !== pxH) {
    canvas.width = pxW;
    canvas.height = pxH;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

// draw contiguous segments with different colors (green normal, red STEMI)
function drawTraceMultiColor(
  ctx: CanvasRenderingContext2D,
  pts: Sample[],
  w: number,
  h: number,
  green: string,
  red: string,
  glowGreen: string,
  glowRed: string
) {
  if (pts.length < 2) return;

  // find contiguous regions of equal risk flag
  let start = 0;
  while (start < pts.length - 1) {
    let end = start + 1;
    const risk = pts[start].risk;
    while (end < pts.length && pts[end].risk === risk) end++;

    // draw [start, end)
    const color = risk ? red : green;
    const glow = risk ? glowRed : glowGreen;

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.shadowBlur = risk ? 6 : 4;
    ctx.shadowColor = glow;

    ctx.beginPath();
    // first point
    let px = (start / (ECG_ENGINE.maxPoints - 1)) * w;
    let py = (1 - pts[start].v) * h;
    ctx.moveTo(px, py);

    for (let i = start + 1; i < end; i++) {
      const x = (i / (ECG_ENGINE.maxPoints - 1)) * w;
      const y = (1 - pts[i].v) * h;
      // quadratic midpoint smoothing within the segment
      const xc = (px + x) / 2;
      const yc = (py + y) / 2;
      ctx.quadraticCurveTo(px, py, xc, yc);
      px = x; py = y;
    }
    ctx.lineTo(px, py);
    ctx.stroke();

    start = end;
  }
}

// ---------- main loop ----------
function tick() {
  const { canvas, ctx } = ECG_ENGINE;
  if (!canvas || !ctx) {
    ECG_ENGINE.raf = requestAnimationFrame(tick);
    return;
  }

  layoutCanvas(canvas);

  const root = getComputedStyle(document.documentElement);
  // colors
  const greenHsl =
    root.getPropertyValue('--success').trim() ||
    root.getPropertyValue('--primary').trim() ||
    '142.1 76.2% 36.3%'; // fallback green
  const redHsl =
    root.getPropertyValue('--destructive').trim() ||
    '0 84.2% 60.2%';

  // grid uses a neutral tone so only the trace switches colors
  const gridHue =
    root.getPropertyValue('--muted-foreground').trim() ||
    root.getPropertyValue('--foreground').trim() ||
    '0 0% 50%';

  const gridMinor = `hsl(${gridHue} / 0.08)`;
  const gridMajor = `hsl(${gridHue} / 0.18)`;
  const sweepCol = `hsl(${gridHue} / 0.25)`;
  const traceGreen = `hsl(${greenHsl})`;
  const traceRed = `hsl(${redHsl})`;
  const glowGreen = `hsl(${greenHsl} / 0.35)`;
  const glowRed = `hsl(${redHsl} / 0.40)`;

  const w = canvas.clientWidth;
  const h = canvas.clientHeight;

  // clear
  ctx.clearRect(0, 0, w, h);

  // grid
  const minor = 10;
  const majorEvery = 5;
  for (let i = 0, x = 0; x <= w; i++, x = i * minor) {
    ctx.beginPath();
    ctx.strokeStyle = i % majorEvery === 0 ? gridMajor : gridMinor;
    ctx.lineWidth = i % majorEvery === 0 ? 1 : 0.5;
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let j = 0, y = 0; y <= h; j++, y = j * minor) {
    ctx.beginPath();
    ctx.strokeStyle = j % majorEvery === 0 ? gridMajor : gridMinor;
    ctx.lineWidth = j % majorEvery === 0 ? 1 : 0.5;
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // sample new point
  const raw = generateECGValue(ECG_ENGINE.x, ECG_ENGINE.isRisk);
  const smoothed = ECG_ENGINE.prevY * 0.65 + raw * 0.35;
  ECG_ENGINE.prevY = smoothed;

  const pts = ECG_ENGINE.points;
  pts.push({ v: smoothed, risk: ECG_ENGINE.isRisk });
  if (pts.length > ECG_ENGINE.maxPoints) pts.shift();

  // trace: draw red/green by contiguous chunks
  drawTraceMultiColor(ctx, pts, w, h, traceGreen, traceRed, glowGreen, glowRed);

  // sweep (neutral)
  const sweepX = (pts.length / ECG_ENGINE.maxPoints) * w;
  ctx.strokeStyle = sweepCol;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sweepX, 0);
  ctx.lineTo(sweepX, h);
  ctx.stroke();

  // delayed label after 3s in STEMI
  if (ECG_ENGINE.isRisk && ECG_ENGINE.riskSince !== null) {
    const elapsed = performance.now() - ECG_ENGINE.riskSince;
    if (elapsed >= 3000) {
      ctx.font =
        '600 24px ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial';
      ctx.fillStyle = traceRed;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('ST Elevation MI', w / 2, h / 4);
    }
  }

  // advance timebase
  ECG_ENGINE.x += 1.15;

  ECG_ENGINE.raf = requestAnimationFrame(tick);
}

// attach/detach canvas without stopping engine
function attachCanvas(canvas: HTMLCanvasElement | null) {
  if (canvas === ECG_ENGINE.canvas) return;
  ECG_ENGINE.canvas = canvas;
  ECG_ENGINE.ctx = canvas ? canvas.getContext('2d') : null;
  if (canvas) layoutCanvas(canvas);
  if (ECG_ENGINE.raf == null) ECG_ENGINE.raf = requestAnimationFrame(tick);
}
function setRisk(on: boolean) {
  if (!ECG_ENGINE.isRisk && on) ECG_ENGINE.riskSince = performance.now();
  if (!on) ECG_ENGINE.riskSince = null;
  ECG_ENGINE.isRisk = on;
}

// ---------- React wrapper ----------
interface ECGGraphProps {
  isRisk?: boolean;
  className?: string;
}

const ECGGraph: React.FC<ECGGraphProps> = ({ isRisk = false, className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    attachCanvas(c);
    const onResize = () => c && layoutCanvas(c);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (canvasRef.current === c) attachCanvas(null);
    };
  }, []);

  useEffect(() => {
    setRisk(!!isRisk);
  }, [isRisk]);

  return (
    <canvas
      ref={canvasRef}
      className={cn('w-full h-full', className)}
      style={{ display: 'block' }}
    />
  );
};

export default React.memo(ECGGraph);
