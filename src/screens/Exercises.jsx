import { useMemo, useState } from 'react';
import { EXERCISES, CATEGORIES } from '../data/exercises.js';
import { STAT_INFO } from '../lib/progression.js';
import { ScreenHeader } from '../components/UI.jsx';
import { Icon } from '../components/Icons.jsx';

export default function Exercises({ nav }) {
  const [cat, setCat] = useState('All');
  const [q, setQ] = useState('');
  const [noDb, setNoDb] = useState(false);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return EXERCISES.filter(
      (e) =>
        (cat === 'All' || e.category === cat) &&
        (!noDb || e.equipment === 'Bodyweight') &&
        (!term || e.name.toLowerCase().includes(term) || e.muscles.some((m) => m.toLowerCase().includes(term))),
    );
  }, [cat, q, noDb]);

  return (
    <div className="screen">
      <ScreenHeader title="Exercises" sub={`${EXERCISES.length} movements · bodyweight + dumbbells`} />
      <input className="input search" type="search" placeholder="Search exercise or muscle" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="chip-scroll" role="tablist">
        {CATEGORIES.map((c) => (
          <button key={c} role="tab" aria-selected={cat === c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>
            {c}
          </button>
        ))}
        <button className={`chip ${noDb ? 'on' : ''}`} onClick={() => setNoDb((v) => !v)} aria-pressed={noDb}>
          No equipment
        </button>
      </div>
      <ul className="lib-list">
        {list.map((e) => {
          const main = Object.entries(e.stats).sort((a, b) => b[1] - a[1])[0][0];
          return (
            <li key={e.id}>
              <button className="lib-item" onClick={() => nav.push({ name: 'exercise', id: e.id })}>
                <span className="lib-stat" style={{ color: STAT_INFO[main].color, borderColor: STAT_INFO[main].color }}>
                  {main}
                </span>
                <span className="lib-info">
                  <b>{e.name}</b>
                  <small className="muted">
                    {e.muscles.slice(0, 3).join(' · ')} · {e.equipment === 'Bodyweight' ? 'BW' : 'DB / BW alt'}
                  </small>
                </span>
                <span className="lib-diff" aria-label={`Difficulty ${e.difficulty} of 5`}>
                  {'●'.repeat(e.difficulty)}
                  <span className="dim">{'●'.repeat(5 - e.difficulty)}</span>
                </span>
                <Icon name="chevron" size={18} className="muted" />
              </button>
            </li>
          );
        })}
        {list.length === 0 && <li className="muted small center pad">No exercises match.</li>}
      </ul>
    </div>
  );
}
