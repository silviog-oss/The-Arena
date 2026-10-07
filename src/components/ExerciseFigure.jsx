import { useEffect, useId, useRef, useState } from 'react';
import { POSES } from '../data/poses.js';

const JOINTS = ['head', 'sh', 'mid', 'hip', 'el', 'ha', 'kn', 'ft', 'el2', 'ha2', 'kn2', 'ft2'];
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function lerpPose(a, b, t) {
  const out = { ...a };
  for (const j of JOINTS) {
    if (a[j] && b[j]) out[j] = [a[j][0] + (b[j][0] - a[j][0]) * t, a[j][1] + (b[j][1] - a[j][1]) * t];
    else out[j] = a[j] || b[j];
  }
  return out;
}

const line = (p, q) => (p && q ? `M${p[0]},${p[1]} L${q[0]},${q[1]}` : '');
const path = (...pts) => pts.filter(Boolean).map((p, i) => `${i ? 'L' : 'M'}${p[0]},${p[1]}`).join(' ');

/**
 * Animated stick figure for an exercise: loops start → end → start.
 * Respects prefers-reduced-motion (shows the end position statically).
 */
export default function ExerciseFigure({ id, size = 220, speed = 1, className = '' }) {
  const pose = POSES[id];
  const [t, setT] = useState(0);
  const gid = `fig-g-${useId().replace(/:/g, '')}`;
  const raf = useRef();

  useEffect(() => {
    if (!pose) return undefined;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setT(1);
      return undefined;
    }
    const period = 2600 / speed;
    const start = performance.now();
    const tick = (now) => {
      const phase = ((now - start) % period) / period; // 0..1
      // hold briefly at each end
      const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
      const held = Math.min(1, Math.max(0, (tri - 0.12) / 0.76));
      setT(ease(held));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [pose, speed]);

  if (!pose) return null;
  const p = lerpPose(pose.a, pose.b, t);
  const neck = p.head && p.sh ? [p.sh[0] + (p.head[0] - p.sh[0]) * 0.45, p.sh[1] + (p.head[1] - p.sh[1]) * 0.45] : null;

  return (
    <svg viewBox="0 -6 100 66" width={size} height={(size * 66) / 100} className={`ex-figure ${className}`} role="img" aria-label="Exercise demonstration">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6ea8ff" />
          <stop offset="1" stopColor="#a66bff" />
        </linearGradient>
      </defs>
      <line x1="4" y1="58.6" x2="96" y2="58.6" className="fig-floor" />
      {p.wall && <line x1={p.wall} y1="-4" x2={p.wall} y2="58.6" className="fig-wall" />}

      {/* far-side limbs (fainter) */}
      <g className="fig-far" stroke={`url(#${gid})`}>
        <path d={path(p.sh, p.el2, p.ha2)} />
        <path d={path(p.hip, p.kn2, p.ft2)} />
      </g>

      <g className="fig-body" stroke={`url(#${gid})`}>
        <path d={path(p.hip, p.kn, p.ft)} />
        <path d={p.mid ? path(p.hip, p.mid, p.sh) : line(p.hip, p.sh)} />
        <path d={line(p.sh, neck)} />
        <path d={path(p.sh, p.el, p.ha)} />
      </g>
      <circle cx={p.head[0]} cy={p.head[1]} r="4.2" className="fig-head" stroke={`url(#${gid})`} />

      {p.db && (
        <g className="fig-db">
          {[p.ha, p.ha2].filter(Boolean).slice(0, p.ha2 && pose.a.view === 'front' ? 2 : 1).map((h, i) => (
            <g key={i} transform={`translate(${h[0]},${h[1]})`}>
              <rect x="-4" y="-1" width="8" height="2" rx="1" />
              <rect x="-5" y="-2.6" width="2.4" height="5.2" rx="0.8" />
              <rect x="2.6" y="-2.6" width="2.4" height="5.2" rx="0.8" />
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

export const hasFigure = (id) => !!POSES[id];
