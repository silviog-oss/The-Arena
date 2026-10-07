import { useMemo, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { EXERCISE_MAP } from '../data/exercises.js';
import { TYPE_LABEL } from '../data/program.js';
import { toDateKey, STAT_KEYS, STAT_INFO } from '../lib/progression.js';
import { Sheet } from './UI.jsx';
import { Icon } from './Icons.jsx';

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const fmtDur = (s) => `${Math.max(1, Math.round((s || 0) / 60))} min`;

/** Group a workout's logged sets by exercise for display. */
function summarizeSets(sets = []) {
  const map = new Map();
  for (const s of sets) {
    const k = `${s.exId}|${s.variation}`;
    if (!map.has(k)) map.set(k, { exId: s.exId, variation: s.variation, sets: [] });
    map.get(k).sets.push(s);
  }
  return [...map.values()];
}

/** Month calendar of workouts. Tap a day to see what you did. */
export default function Calendar() {
  const { state } = useGame();
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [open, setOpen] = useState(null);

  // Index history by date (fallback to `completed` for workouts finished before history existed).
  const byDate = useMemo(() => {
    const m = {};
    const add = (e) => (m[e.date] = m[e.date] || []).push(e);
    (state.history || []).forEach(add);
    const covered = new Set((state.history || []).filter((h) => (h.cycle || 1) === (state.cycle || 1)).map((h) => h.day));
    Object.entries(state.completed || {}).forEach(([day, c]) => {
      if (!covered.has(Number(day))) add({ ...c, day: Number(day), title: `Day ${day}`, legacy: true });
    });
    return m;
  }, [state.history, state.completed, state.cycle]);
  const rest = new Set(state.restDays || []);
  const evals = new Set((state.evaluations || []).map((e) => e.date));

  const today = toDateKey();
  const first = (month.getDay() + 6) % 7; // Monday-first
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = [...Array(first).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];
  const monthWorkouts = Object.keys(byDate).filter((d) => d.startsWith(toDateKey(month).slice(0, 7))).length;

  const entries = open ? byDate[open] || [] : [];

  return (
    <div className="cal">
      <div className="cal-head">
        <button className="icon-btn" aria-label="Previous month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>
          <Icon name="back" />
        </button>
        <div className="cal-title">
          <b>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</b>
          <small className="muted">{monthWorkouts} training day{monthWorkouts === 1 ? '' : 's'}</small>
        </div>
        <button className="icon-btn" aria-label="Next month" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>
          <Icon name="chevron" />
        </button>
      </div>
      <div className="cal-grid">
        {DOW.map((d, i) => <span key={i} className="cal-dow">{d}</span>)}
        {cells.map((d, i) => {
          if (!d) return <span key={i} />;
          const key = toDateKey(new Date(month.getFullYear(), month.getMonth(), d));
          const list = byDate[key];
          const cls = [
            'cal-day',
            list ? 'trained' : '',
            rest.has(key) ? 'rest' : '',
            evals.has(key) ? 'eval' : '',
            key === today ? 'today' : '',
          ].join(' ');
          return (
            <button key={i} className={cls} onClick={() => (list || rest.has(key) || evals.has(key)) && setOpen(key)} aria-label={`${key}${list ? `, ${list.length} workout` : ''}`}>
              {d}
              {list && list.length > 1 && <i className="cal-count">{list.length}</i>}
            </button>
          );
        })}
      </div>
      <div className="board-legend small muted">
        <span><i className="lg done" /> Workout</span>
        <span><i className="lg restday" /> Recovery day</span>
        <span><i className="lg evalday" /> Evaluation</span>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} title={open ? new Date(open + 'T12:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}>
        {rest.has(open) && <p className="note">🛡 Recovery day logged.</p>}
        {evals.has(open) && <p className="note">◎ Hunter Evaluation taken.</p>}
        {entries.map((e, i) => (
          <div key={i} className="hist-entry">
            <div className="hist-top">
              <div>
                <span className="eyebrow">{e.cycle > 1 ? `Cycle ${e.cycle} · ` : ''}Day {e.day}{e.type ? ` · ${TYPE_LABEL[e.type]}` : ''}</span>
                <b>{e.legacy ? `Day ${e.day} mission` : e.title}</b>
              </div>
              <span className="mono">{e.replay ? 'replay' : `+${e.xp} XP`}</span>
            </div>
            <div className="hist-meta small muted">
              <span>⏱ {fmtDur(e.seconds)}</span>
              {e.stats && STAT_KEYS.filter((k) => e.stats[k] > 0).map((k) => (
                <span key={k} style={{ color: STAT_INFO[k].color }}>{k} +{e.stats[k]}</span>
              ))}
              {e.mods?.recovery && <span>Recovery Mode</span>}
              {e.mods?.overdrive && <span>Overdrive</span>}
              {e.skipped > 0 && <span>{e.skipped} skipped</span>}
            </div>
            {e.sets?.length > 0 && (
              <ul className="hist-sets">
                {summarizeSets(e.sets).map((g) => (
                  <li key={g.exId + g.variation}>
                    <span>{g.variation || EXERCISE_MAP[g.exId]?.name}</span>
                    <span className="mono muted">
                      {g.sets.map((s) => (s.skipped ? '—' : s.reps ? `${s.reps}` : `${s.time}s`) + (s.kg ? `@${s.kg}kg` : '')).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {e.legacy && <p className="muted small">Detailed set logging started after this workout.</p>}
          </div>
        ))}
      </Sheet>
    </div>
  );
}
