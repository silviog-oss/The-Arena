import { useMemo, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { STAT_KEYS, STAT_INFO } from '../lib/progression.js';
import { kgToLb } from '../lib/body.js';
import { LineChart, BarChart } from './Charts.jsx';

const short = (d) => {
  const [, m, day] = d.split('-');
  return `${Number(day)}/${Number(m)}`;
};

/** Training graphs: mission XP, weekly training time, stat growth (small multiples), weight. */
export default function ProgressGraphs() {
  const { state } = useGame();
  const [tab, setTab] = useState('xp');
  const history = useMemo(() => [...(state.history || [])].sort((a, b) => a.at - b.at), [state.history]);

  const xpSeries = useMemo(() => {
    let sum = 0;
    const byDate = new Map();
    for (const h of history) {
      sum += h.xp || 0;
      byDate.set(h.date, sum);
    }
    return [...byDate].map(([d, y]) => ({ x: short(d), y }));
  }, [history]);

  const weekly = useMemo(() => {
    const weeks = [];
    const now = new Date();
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
    for (let i = 7; i >= 0; i--) {
      const start = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - i * 7);
      const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
      const mins = history.filter((h) => h.at >= start.getTime() && h.at < end.getTime()).reduce((n, h) => n + (h.seconds || 0) / 60, 0);
      weeks.push({ x: `${start.getDate()}/${start.getMonth() + 1}`, y: Math.round(mins) });
    }
    return weeks;
  }, [history]);

  // Stat growth: start from the first evaluation (or 0), add each workout's gains.
  const statSeries = useMemo(() => {
    const first = state.evaluations?.[0];
    const base = first ? { ...first.scores } : { STR: 0, END: 0, AGI: 0, VIT: 0 };
    const events = [
      ...(first ? [{ at: first.at, date: first.date, stats: {} }] : []),
      ...history.filter((h) => !h.replay).map((h) => ({ at: h.at, date: h.date, stats: h.stats || {} })),
      ...(state.evaluations || []).slice(1).map((e, i) => {
        const prev = state.evaluations[i].scores;
        const gain = {};
        for (const k of STAT_KEYS) gain[k] = Math.max(0, e.scores[k] - prev[k]);
        return { at: e.at, date: e.date, stats: gain };
      }),
    ].sort((a, b) => a.at - b.at);
    const out = Object.fromEntries(STAT_KEYS.map((k) => [k, []]));
    const cur = { ...base };
    const lastIdx = {};
    for (const e of events) {
      for (const k of STAT_KEYS) {
        cur[k] += e.stats[k] || 0;
        const label = short(e.date);
        if (lastIdx[k] != null && out[k][lastIdx[k]].x === label) out[k][lastIdx[k]].y = cur[k];
        else {
          out[k].push({ x: label, y: cur[k] });
          lastIdx[k] = out[k].length - 1;
        }
      }
    }
    return out;
  }, [history, state.evaluations]);

  const body = state.profile.body;
  const imperial = body?.units === 'imperial';
  const weightSeries = (body?.weightLog || []).map((e) => ({ x: short(e.date), y: imperial ? Math.round(kgToLb(e.kg)) : e.kg }));

  return (
    <div className="graphs">
      <div className="chip-scroll" role="tablist">
        {[
          ['xp', 'XP'],
          ['time', 'Training time'],
          ['stats', 'Stats'],
          ['weight', 'Weight'],
        ].map(([id, label]) => (
          <button key={id} role="tab" aria-selected={tab === id} className={`chip ${tab === id ? 'on' : ''}`} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'xp' && (
        <>
          <h4 className="chart-title">Mission XP earned (cumulative)</h4>
          <LineChart data={xpSeries} unit="XP" label="Mission XP" zeroBase />
        </>
      )}
      {tab === 'time' && (
        <>
          <h4 className="chart-title">Minutes trained per week (last 8 weeks)</h4>
          <BarChart data={weekly} unit="min" label="Minutes per week" />
        </>
      )}
      {tab === 'stats' && (
        <div className="small-multiples">
          {STAT_KEYS.map((k) => (
            <div key={k}>
              <h4 className="chart-title"><b style={{ color: STAT_INFO[k].color }}>{k}</b> {STAT_INFO[k].name}</h4>
              <LineChart data={statSeries[k]} color={STAT_INFO[k].color} label={STAT_INFO[k].name} height={110} />
            </div>
          ))}
        </div>
      )}
      {tab === 'weight' && (
        <>
          <h4 className="chart-title">Body weight</h4>
          <LineChart data={weightSeries} unit={imperial ? 'lb' : 'kg'} label="Body weight" />
          <p className="muted small">Log your weight from Profile → Goal.</p>
        </>
      )}
    </div>
  );
}
