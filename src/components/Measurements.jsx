import { useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { CM_PER_IN } from '../lib/body.js';
import { LineChart } from './Charts.jsx';
import { Button } from './UI.jsx';

export const MEASURES = [
  { id: 'waist', label: 'Waist' },
  { id: 'chest', label: 'Chest' },
  { id: 'arm', label: 'Arms' },
  { id: 'thigh', label: 'Thighs' },
  { id: 'hip', label: 'Hips' },
];

const short = (d) => {
  const [, m, day] = d.split('-');
  return `${Number(day)}/${Number(m)}`;
};

/** Optional body measurements: log any subset, see each one over time. */
export default function Measurements() {
  const { state, actions } = useGame();
  const body = state.profile.body;
  const imperial = body.units === 'imperial';
  const unit = imperial ? 'in' : 'cm';
  const toShow = (cm) => (imperial ? Math.round((cm / CM_PER_IN) * 10) / 10 : cm);
  const list = body.measurements || [];
  const last = list[list.length - 1] || {};
  const [open, setOpen] = useState(false);
  const [vals, setVals] = useState({});
  const [view, setView] = useState('waist');

  const save = () => {
    const entry = {};
    for (const m of MEASURES) {
      const v = Number(vals[m.id]);
      if (v > 0) entry[m.id] = Math.round((imperial ? v * CM_PER_IN : v) * 10) / 10;
    }
    if (!Object.keys(entry).length) return;
    actions.addMeasurement(entry);
    setVals({});
    setOpen(false);
  };

  const series = list.filter((e) => e[view] > 0).map((e) => ({ x: short(e.date), y: toShow(e[view]) }));

  return (
    <div className="measure">
      <p className="muted small">Optional. Strength changes your shape before it changes the scale — track whichever you like.</p>
      {list.length > 0 && (
        <>
          <div className="measure-latest">
            {MEASURES.filter((m) => last[m.id]).map((m) => (
              <div key={m.id} className="kpi">
                <small>{m.label}</small>
                <b>{toShow(last[m.id])} {unit}</b>
              </div>
            ))}
          </div>
          <div className="chip-scroll">
            {MEASURES.map((m) => (
              <button key={m.id} className={`chip ${view === m.id ? 'on' : ''}`} onClick={() => setView(m.id)}>{m.label}</button>
            ))}
          </div>
          <LineChart data={series} unit={unit} label={MEASURES.find((m) => m.id === view).label} />
        </>
      )}
      {open ? (
        <div className="measure-form">
          <div className="field-grid">
            {MEASURES.map((m) => (
              <label key={m.id} className="field">
                <span>{m.label} ({unit})</span>
                <input
                  className="input"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  placeholder={last[m.id] ? String(toShow(last[m.id])) : '—'}
                  value={vals[m.id] ?? ''}
                  onChange={(e) => setVals({ ...vals, [m.id]: e.target.value })}
                />
              </label>
            ))}
          </div>
          <div className="btn-row">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={save}>Save</Button>
          </div>
        </div>
      ) : (
        <Button variant="ghost" className="w-full" onClick={() => setOpen(true)}>+ Log measurements</Button>
      )}
    </div>
  );
}
