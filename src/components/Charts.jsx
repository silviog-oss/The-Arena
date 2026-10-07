import { useRef, useState } from 'react';

/**
 * Lightweight single-series SVG charts (no library → offline, tiny).
 * One series per chart; multiple measures use small multiples, never dual axes.
 * Hover / tap shows a tooltip with the nearest value.
 */

const W = 320;
const H = 150;
const PAD = { l: 34, r: 10, t: 12, b: 22 };

function niceRange(min, max) {
  if (min === max) {
    const d = Math.abs(min) * 0.1 || 1;
    return [min - d, max + d];
  }
  const pad = (max - min) * 0.12;
  // Never invent negative values for data that can't be negative.
  return [min >= 0 ? Math.max(0, min - pad) : min - pad, max + pad];
}

const fmtNum = (v) => (Math.abs(v) >= 1000 ? `${Math.round(v / 100) / 10}k` : Math.abs(v) >= 20 ? Math.round(v) : Math.round(v * 10) / 10);

export function LineChart({ data, color = 'var(--blue-2)', unit = '', label, zeroBase = false, height = H }) {
  const [hover, setHover] = useState(null);
  const ref = useRef();
  if (!data || data.length < 2) {
    return <p className="muted small chart-empty">Not enough data yet — {label ? `${label.toLowerCase()} appears` : 'this chart appears'} after a few entries.</p>;
  }
  const ys = data.map((d) => d.y);
  let [min, max] = niceRange(Math.min(...ys), Math.max(...ys));
  if (zeroBase) min = 0;
  const iw = W - PAD.l - PAD.r;
  const ih = height - PAD.t - PAD.b;
  const x = (i) => PAD.l + (i / (data.length - 1)) * iw;
  const y = (v) => PAD.t + ih - ((v - min) / (max - min)) * ih;
  const path = data.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.y).toFixed(1)}`).join(' ');
  const ticks = [min, (min + max) / 2, max];

  const onMove = (e) => {
    const rect = ref.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const i = Math.round(((px - PAD.l) / iw) * (data.length - 1));
    setHover(Math.max(0, Math.min(data.length - 1, i)));
  };
  const h = hover != null ? data[hover] : null;

  return (
    <div className="chart">
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${height}`}
        className="chart-svg"
        role="img"
        aria-label={`${label || 'Chart'}: from ${fmtNum(data[0].y)} to ${fmtNum(data[data.length - 1].y)} ${unit}`}
        onPointerMove={onMove}
        onPointerDown={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={PAD.l - 6} y={y(t) + 3} className="chart-tick" textAnchor="end">{fmtNum(t)}</text>
          </g>
        ))}
        <text x={PAD.l} y={height - 6} className="chart-tick">{data[0].x}</text>
        <text x={W - PAD.r} y={height - 6} className="chart-tick" textAnchor="end">{data[data.length - 1].x}</text>
        <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {/* direct label on the latest point only */}
        <circle cx={x(data.length - 1)} cy={y(data[data.length - 1].y)} r="4" fill={color} stroke="var(--panel)" strokeWidth="2" />
        {h && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} className="chart-cross" />
            <circle cx={x(hover)} cy={y(h.y)} r="5" fill={color} stroke="var(--panel)" strokeWidth="2" />
          </g>
        )}
      </svg>
      <div className="chart-readout small">
        {h ? (
          <span><b className="mono">{fmtNum(h.y)} {unit}</b> <span className="muted">· {h.x}</span></span>
        ) : (
          <span><span className="muted">Latest</span> <b className="mono">{fmtNum(data[data.length - 1].y)} {unit}</b></span>
        )}
      </div>
    </div>
  );
}

export function BarChart({ data, color = 'var(--blue-2)', unit = '', label, height = H }) {
  const [hover, setHover] = useState(null);
  if (!data || !data.length) return <p className="muted small chart-empty">No data yet.</p>;
  const max = Math.max(1, ...data.map((d) => d.y));
  const iw = W - PAD.l - PAD.r;
  const ih = height - PAD.t - PAD.b;
  const bw = iw / data.length;
  const y = (v) => PAD.t + ih - (v / max) * ih;
  const h = hover != null ? data[hover] : null;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${height}`} className="chart-svg" role="img" aria-label={label} onPointerLeave={() => setHover(null)}>
        {[0, max / 2, max].map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={PAD.l - 6} y={y(t) + 3} className="chart-tick" textAnchor="end">{fmtNum(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const bh = Math.max(d.y > 0 ? 2 : 0, (d.y / max) * ih);
          const bx = PAD.l + i * bw + 2; // 2px gap between bars
          return (
            <g key={i} onPointerEnter={() => setHover(i)} onPointerDown={() => setHover(i)}>
              <rect x={PAD.l + i * bw} y={PAD.t} width={bw} height={ih} fill="transparent" />
              <path
                d={`M${bx},${PAD.t + ih} V${PAD.t + ih - bh + Math.min(4, bh)} q0,-${Math.min(4, bh)} ${Math.min(4, bh)},-${Math.min(4, bh)} H${bx + bw - 4 - Math.min(4, bh)} q${Math.min(4, bh)},0 ${Math.min(4, bh)},${Math.min(4, bh)} V${PAD.t + ih} Z`}
                fill={color}
                opacity={hover == null || hover === i ? 1 : 0.45}
              />
            </g>
          );
        })}
        <text x={PAD.l} y={height - 6} className="chart-tick">{data[0].x}</text>
        <text x={W - PAD.r} y={height - 6} className="chart-tick" textAnchor="end">{data[data.length - 1].x}</text>
      </svg>
      <div className="chart-readout small">
        {h ? (
          <span><b className="mono">{fmtNum(h.y)} {unit}</b> <span className="muted">· {h.x}</span></span>
        ) : (
          <span className="muted">Tap a bar for details</span>
        )}
      </div>
    </div>
  );
}
