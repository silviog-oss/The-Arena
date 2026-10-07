import { useGame } from '../state/GameContext.jsx';
import { DAY_MAP, TYPE_LABEL, WARMUP, phaseForDay } from '../data/program.js';
import { EXERCISE_MAP } from '../data/exercises.js';
import { estimateMinutes, statGainsForDay, STAT_KEYS, STAT_INFO } from '../lib/progression.js';
import { describeItem } from '../lib/workout.js';
import { ScreenHeader, Panel, Button, DifficultyTag, Disclaimer } from '../components/UI.jsx';
import { Icon } from '../components/Icons.jsx';
import VariationPicker from '../components/VariationPicker.jsx';
import QuestList from '../components/QuestList.jsx';

export default function MissionDetail({ day, nav }) {
  const { state, profile } = useGame();
  const def = DAY_MAP[day];
  const phase = phaseForDay(day);
  const done = profile.completedDays.has(day);
  const isNext = day === profile.nextDay;
  const locked = !done && !isNext;
  const gains = statGainsForDay(def);
  const activeHere = state.activeWorkout?.day === day;
  const otherActive = state.activeWorkout && !activeHere;

  return (
    <div className="screen with-cta">
      <ScreenHeader title={`Day ${day}`} sub={phase.name} onBack={nav.pop} />

      <Panel glow={isNext} className="mission-hero">
        <div className="today-meta">
          <DifficultyTag grade={def.difficulty} />
          <span className="muted small">{TYPE_LABEL[def.type]}</span>
          {done && <span className="pill pill-ok">Cleared</span>}
          {locked && <span className="pill pill-muted">Locked</span>}
        </div>
        <h2 className="mission-title">“{def.title}”</h2>
        <p className="muted">{def.brief}</p>
        <div className="today-facts">
          <span><Icon name="clock" size={16} /> ~{estimateMinutes(def)} min</span>
          <span><Icon name="bolt" size={16} /> +{def.xp} XP</span>
        </div>
        <div className="gain-row">
          {STAT_KEYS.filter((k) => gains[k] > 0).map((k) => (
            <span key={k} className="gain" style={{ color: STAT_INFO[k].color }}>
              {k} +{gains[k]}
            </span>
          ))}
        </div>
      </Panel>

      {def.type !== 'mobility' && (
        <Panel title="Warm-up (auto)">
          <ul className="warmup-list muted small">
            {WARMUP.map((w) => (
              <li key={w.ex}>
                {EXERCISE_MAP[w.ex].name} — {w.time ? `${w.time} sec` : `${w.reps} reps`}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <Panel title="Mission">
        <ol className="ex-list">
          {def.items.map((item, i) => {
            const ex = EXERCISE_MAP[item.ex];
            return (
              <li key={i} className="ex-row">
                <div className="ex-row-top">
                  <button className="ex-name" onClick={() => nav.push({ name: 'exercise', id: ex.id })}>
                    {ex.name} <Icon name="info" size={15} />
                  </button>
                  <span className="ex-target mono">{describeItem(item, ex)}</span>
                </div>
                <div className="ex-row-sub muted small">
                  Rest {item.rest}s{item.note ? ` · ${item.note}` : ''} · {ex.equipment}
                </div>
                <VariationPicker exId={ex.id} />
              </li>
            );
          })}
        </ol>
      </Panel>

      <Panel title="Quests">
        {locked ? (
          <p className="muted small">Quests unlock when this mission becomes available.</p>
        ) : (
          <QuestList day={day} nav={nav} />
        )}
      </Panel>

      <Disclaimer compact />

      <div className="cta-bar">
        {locked ? (
          <Button size="lg" className="w-full" disabled icon="lock">
            Clear Day {profile.nextDay} first
          </Button>
        ) : otherActive ? (
          <Button size="lg" className="w-full" onClick={() => nav.replace({ name: 'workout', day: state.activeWorkout.day, resume: true })}>
            Resume Day {state.activeWorkout.day} first
          </Button>
        ) : (
          <Button size="lg" className="w-full" icon="play" onClick={() => nav.replace({ name: 'workout', day, resume: activeHere })}>
            {activeHere ? 'Resume mission' : done ? 'Replay mission (no XP)' : 'Start mission'}
          </Button>
        )}
      </div>
    </div>
  );
}
