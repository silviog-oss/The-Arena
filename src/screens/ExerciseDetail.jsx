import { useGame } from '../state/GameContext.jsx';
import { EXERCISE_MAP, LEVEL_LABEL } from '../data/exercises.js';
import { STAT_INFO } from '../lib/progression.js';
import { PROGRAM } from '../data/program.js';
import { ScreenHeader, Panel, Pill } from '../components/UI.jsx';
import { Icon } from '../components/Icons.jsx';
import ExerciseFigure from '../components/ExerciseFigure.jsx';

export default function ExerciseDetail({ id, nav }) {
  const { variationFor, actions } = useGame();
  const ex = EXERCISE_MAP[id];
  const chosen = variationFor(id);
  const usedOn = PROGRAM.filter((d) => d.items.some((i) => i.ex === id)).map((d) => d.day);

  return (
    <div className="screen">
      <ScreenHeader title={ex.name} sub={ex.category} onBack={nav.pop} />

      <div className="fig-wrap panel">
        <ExerciseFigure id={id} size={300} />
      </div>

      <Panel>
        <div className="tag-row">
          <Pill>{ex.equipment}</Pill>
          <Pill>Difficulty {ex.difficulty}/5</Pill>
          <Pill>{ex.type === 'time' ? 'Timed' : 'Reps'}{ex.perSide ? ' · each side' : ''}</Pill>
        </div>
        <h3 className="sub-h">Muscles</h3>
        <p>{ex.muscles.join(', ')}</p>
        <h3 className="sub-h">Trains</h3>
        <div className="gain-row">
          {Object.entries(ex.stats).map(([k, v]) => (
            <span key={k} className="gain" style={{ color: STAT_INFO[k].color }}>
              {k} {'▮'.repeat(Math.max(1, Math.round(v)))}
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="How to">
        <ol className="howto">
          {ex.instructions.map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ol>
        <div className="safety">
          <Icon name="warning" size={16} />
          <span>{ex.safety}</span>
        </div>
      </Panel>

      <Panel title="Variations" action={<small className="muted">Tap to set as yours</small>}>
        <ul className="var-list">
          {ex.variations.map((v, i) => (
            <li key={v.name}>
              <button className={`var-item ${i === chosen ? 'chosen' : ''}`} onClick={() => actions.setVariation(id, i)} aria-pressed={i === chosen}>
                <span className={`lvl lvl-${v.level}`}>{LEVEL_LABEL[v.level]}</span>
                <b>{v.name}</b>
                <small className="muted">{v.cue}</small>
                {i === chosen && <Icon name="check" size={18} className="var-check" />}
              </button>
            </li>
          ))}
        </ul>
      </Panel>

      {usedOn.length > 0 && (
        <Panel title="Appears in">
          <div className="tag-row">
            {usedOn.map((d) => (
              <button key={d} className="chip" onClick={() => nav.push({ name: 'mission', day: d })}>
                Day {d}
              </button>
            ))}
          </div>
        </Panel>
      )}
    </div>
  );
}
