import { useGame } from '../state/GameContext.jsx';
import { DAY_MAP, TOTAL_DAYS } from '../data/program.js';
import { STAT_KEYS, STAT_INFO, RANKS } from '../lib/progression.js';
import { ScreenHeader, Panel, StatBar, RankBadge } from '../components/UI.jsx';

function Radar({ stats }) {
  const max = Math.max(40, ...STAT_KEYS.map((k) => stats[k])) * 1.1;
  const cx = 110;
  const cy = 110;
  const R = 82;
  // STR top, END right, VIT bottom, AGI left
  const order = ['STR', 'END', 'VIT', 'AGI'];
  const pt = (i, v) => {
    const a = -Math.PI / 2 + (i * Math.PI) / 2;
    const r = (v / max) * R;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const poly = order.map((k, i) => pt(i, stats[k]).join(',')).join(' ');
  return (
    <svg viewBox="0 0 220 220" className="radar" role="img" aria-label="Stat radar chart">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={order.map((_, i) => pt(i, max * f).join(',')).join(' ')} className="radar-grid" />
      ))}
      {order.map((_, i) => {
        const [x, y] = pt(i, max);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} className="radar-grid" />;
      })}
      <polygon points={poly} className="radar-shape" />
      {order.map((k, i) => {
        const [x, y] = pt(i, max * 1.18);
        return (
          <text key={k} x={x} y={y} className="radar-label" fill={STAT_INFO[k].color} textAnchor="middle" dominantBaseline="middle">
            {k}
          </text>
        );
      })}
    </svg>
  );
}

export default function Stats({ nav }) {
  const { state, profile } = useGame();
  const max = Math.max(60, ...STAT_KEYS.map((k) => state.stats[k]));
  const history = Object.entries(state.completed)
    .map(([d, c]) => ({ day: Number(d), ...c }))
    .sort((a, b) => b.at - a.at);

  return (
    <div className="screen">
      <ScreenHeader title="Stats" sub={`Level ${profile.level} · ${profile.rank.name}`} />

      <Panel title="Attributes">
        <Radar stats={state.stats} />
        <div className="stat-list">
          {STAT_KEYS.map((k) => (
            <StatBar key={k} k={k} value={state.stats[k]} max={max} />
          ))}
        </div>
        <ul className="stat-legend muted small">
          {STAT_KEYS.map((k) => (
            <li key={k}>
              <b style={{ color: STAT_INFO[k].color }}>{k}</b> {STAT_INFO[k].desc}
            </li>
          ))}
        </ul>
      </Panel>

      <div className="kpi-grid">
        <div className="kpi"><small>Current streak</small><b>🔥 {profile.streak.current}</b></div>
        <div className="kpi"><small>Longest streak</small><b>{profile.streak.longest}</b></div>
        <div className="kpi"><small>Workouts</small><b>{profile.totalWorkouts}</b></div>
        <div className="kpi"><small>Total XP</small><b>{state.xp.toLocaleString()}</b></div>
        <div className="kpi"><small>Training time</small><b>{profile.totalMinutes} min</b></div>
        <div className="kpi"><small>Quests done</small><b>{profile.questCount}</b></div>
      </div>

      <Panel title={profile.cycle > 1 ? `Cycle ${profile.cycle} board` : '31-day board'} action={<span className="mono muted">{profile.daysDone}/{TOTAL_DAYS}</span>}>
        <div className="board">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => {
            const done = profile.completedDays.has(d);
            return (
              <button
                key={d}
                className={`board-cell ${done ? 'done' : ''} ${d === profile.nextDay ? 'next' : ''} ${DAY_MAP[d].type === 'mobility' ? 'rest' : ''} ${DAY_MAP[d].type === 'trial' ? 'trial' : ''}`}
                onClick={() => nav.push({ name: 'mission', day: d })}
                aria-label={`Day ${d}${done ? ', complete' : ''}`}
              >
                {d}
              </button>
            );
          })}
        </div>
        <div className="board-legend small muted">
          <span><i className="lg done" /> Cleared</span>
          <span><i className="lg next" /> Next</span>
          <span><i className="lg trial" /> Trial</span>
          <span><i className="lg rest" /> Recovery</span>
        </div>
      </Panel>

      <Panel title="Rank ladder">
        <ol className="rank-ladder">
          {RANKS.map((r) => {
            const reached = RANKS.findIndex((x) => x.id === profile.rank.id) >= RANKS.findIndex((x) => x.id === r.id);
            return (
              <li key={r.id} className={reached ? 'reached' : ''}>
                <RankBadge rank={r} size="sm" />
                <div>
                  <b>{r.name} — {r.title}</b>
                  <small className="muted">
                    {r.special === 'goal'
                      ? `Lv ${r.minLevel}+ · clear Day 31 · within 10% of your goal`
                      : `Lv ${r.minLevel}+ · ${r.minWorkouts} missions${r.trial ? ` · clear Day ${r.trial}` : ''}`}
                  </small>
                </div>
              </li>
            );
          })}
        </ol>
      </Panel>

      <Panel title="Mission log">
        {history.length === 0 ? (
          <p className="muted small">No missions cleared yet. Your log will appear here.</p>
        ) : (
          <ul className="log">
            {history.map((h) => (
              <li key={h.day}>
                <span className="mono muted">{h.date}</span>
                <span>Day {h.day} · {DAY_MAP[h.day].title}</span>
                <span className="mono">+{h.xp}</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
