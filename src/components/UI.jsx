import { useEffect, useState } from 'react';
import { Icon } from './Icons.jsx';
import { STAT_INFO } from '../lib/progression.js';

export function Panel({ title, action, children, className = '', glow = false }) {
  return (
    <section className={`panel ${glow ? 'panel-glow' : ''} ${className}`}>
      {(title || action) && (
        <header className="panel-head">
          {title && <h2 className="panel-title">{title}</h2>}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

export function ProgressBar({ value, max = 100, color, height = 10, label }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="bar" style={{ height }} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="bar-fill" style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

export function XPBar({ profile }) {
  return (
    <div className="xpbar">
      <div className="xpbar-labels">
        <span>XP</span>
        <span className="mono">
          {profile.current.toLocaleString()} / {profile.needed.toLocaleString()}
        </span>
      </div>
      <ProgressBar value={profile.current} max={profile.needed} height={12} label="Experience to next level" />
      <div className="xpbar-sub">{profile.toNext.toLocaleString()} XP to Level {profile.level + 1}</div>
    </div>
  );
}

export function RankBadge({ rank, size = 'md' }) {
  return (
    <span className={`rank-badge rank-${size}`} style={{ '--rank': rank.color }}>
      {rank.id}
    </span>
  );
}

export function StatBar({ k, value, max }) {
  const info = STAT_INFO[k];
  return (
    <div className="statbar">
      <div className="statbar-top">
        <span className="stat-key" style={{ color: info.color }}>{k}</span>
        <span className="stat-name">{info.name}</span>
        <span className="stat-val mono">{value}</span>
      </div>
      <ProgressBar value={value} max={max} color={info.color} height={8} label={info.name} />
    </div>
  );
}

export function StreakChip({ n, big = false }) {
  return (
    <div className={`streak-chip ${n > 0 ? 'on' : ''} ${big ? 'big' : ''}`}>
      <Icon name="flame" size={big ? 22 : 16} />
      <span>
        <b>{n}</b> day streak
      </span>
    </div>
  );
}

export function Button({ children, variant = 'primary', size = 'md', icon, className = '', ...rest }) {
  return (
    <button className={`btn btn-${variant} btn-${size} ${className}`} {...rest}>
      {icon && <Icon name={icon} size={size === 'lg' ? 22 : 18} />}
      {children}
    </button>
  );
}

export function Toggle({ checked, onChange, label, sub, disabled }) {
  return (
    <label className={`toggle-row ${disabled ? 'disabled' : ''}`}>
      <span className="toggle-text">
        <span>{label}</span>
        {sub && <small>{sub}</small>}
      </span>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className="toggle-ui" aria-hidden="true" />
    </label>
  );
}

export function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <header className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <Icon name="close" />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  );
}

export function Pill({ children, tone = 'default' }) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

export function DifficultyTag({ grade }) {
  return <span className={`diff diff-${grade}`}>{grade}</span>;
}

/** Counts up from 0 to `to` — used on the completion screen. */
export function CountUp({ to, duration = 900, prefix = '', suffix = '' }) {
  const [v, setV] = useState(0);
  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce || to === 0) {
      setV(to);
      return;
    }
    const start = performance.now();
    let raf;
    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      setV(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, duration]);
  return (
    <span>
      {prefix}
      {v.toLocaleString()}
      {suffix}
    </span>
  );
}

export function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div className="toast" role="status" key={toast.id}>
      {toast.icon && <span className="toast-icon">{toast.icon}</span>}
      <div>
        <b>{toast.title}</b>
        {toast.body && <small>{toast.body}</small>}
      </div>
    </div>
  );
}

export function BottomNav({ tab, onChange }) {
  const items = [
    ['home', 'Home', 'home'],
    ['missions', 'Missions', 'missions'],
    ['stats', 'Stats', 'stats'],
    ['exercises', 'Exercises', 'library'],
    ['profile', 'Profile', 'profile'],
  ];
  return (
    <nav className="bottom-nav" aria-label="Main">
      {items.map(([id, label, icon]) => (
        <button key={id} className={`nav-item ${tab === id ? 'active' : ''}`} onClick={() => onChange(id)} aria-current={tab === id ? 'page' : undefined}>
          <Icon name={icon} size={23} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

export function ScreenHeader({ title, onBack, right, sub }) {
  return (
    <header className="screen-header">
      {onBack ? (
        <button className="icon-btn" onClick={onBack} aria-label="Back">
          <Icon name="back" />
        </button>
      ) : (
        <span className="hdr-spacer" />
      )}
      <div className="screen-header-title">
        <h1>{title}</h1>
        {sub && <small>{sub}</small>}
      </div>
      {right || <span className="hdr-spacer" />}
    </header>
  );
}

export function Disclaimer({ compact = false }) {
  return (
    <div className={`disclaimer ${compact ? 'compact' : ''}`}>
      <Icon name="warning" size={16} />
      <p>
        General fitness program, not medical advice. Stop immediately if you feel pain, dizziness, chest discomfort or
        shortness of breath, and talk to a doctor before starting if you have any health condition.
      </p>
    </div>
  );
}
