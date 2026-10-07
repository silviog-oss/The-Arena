import { useGame } from '../state/GameContext.jsx';
import { recordLabel } from '../lib/records.js';

const GROUPS = [
  { id: 'eval', title: 'Hunter Evaluation' },
  { id: 'amrap', title: 'Max-reps tests' },
  { id: 'reps', title: 'Most reps in a set' },
  { id: 'hold', title: 'Longest timed sets' },
  { id: 'weight', title: 'Heaviest dumbbell' },
];

const fmt = (r) => (r.unit === 'sec' ? `${r.value}s` : r.unit === 'kg' ? `${r.value} kg` : `${r.value}`);

/** Personal records list, grouped. `highlight` = keys to mark as NEW. */
export default function Records({ highlight = [], limit }) {
  const { state } = useGame();
  const recs = state.records || {};
  const keys = Object.keys(recs);
  if (!keys.length) {
    return <p className="muted small">No records yet. Finish Mission 0 and your first workouts — every best set is tracked automatically.</p>;
  }
  return (
    <div className="records">
      {GROUPS.map((g) => {
        const list = keys
          .filter((k) => k.startsWith(g.id + ':'))
          .sort((a, b) => recs[b].at - recs[a].at)
          .slice(0, limit || 99);
        if (!list.length) return null;
        return (
          <section key={g.id}>
            <h4 className="sub-h">{g.title}</h4>
            <ul className="rec-list">
              {list.map((k) => {
                const r = recs[k];
                return (
                  <li key={k} className={highlight.includes(k) ? 'new' : ''}>
                    <div>
                      <b>{recordLabel(k)}</b>
                      <small className="muted">
                        {r.date}
                        {r.detail ? ` · ${r.detail}` : ''}
                        {r.prev != null ? ` · prev ${r.unit === 'sec' ? r.prev + 's' : r.prev}` : ''}
                      </small>
                    </div>
                    <span className="rec-val mono">{fmt(r)}</span>
                    {highlight.includes(k) && <i className="rec-new">NEW</i>}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Compact "NEW RECORD" list for completion screens. */
export function NewRecords({ keys, records }) {
  if (!keys?.length) return null;
  return (
    <ul className="rec-list">
      {keys.map((k) => (
        <li key={k} className="new">
          <div>
            <b>{recordLabel(k)}</b>
            {records[k]?.prev != null && <small className="muted">previous best {records[k].prev}</small>}
          </div>
          <span className="rec-val mono">{fmt(records[k])}</span>
          <i className="rec-new">NEW</i>
        </li>
      ))}
    </ul>
  );
}
