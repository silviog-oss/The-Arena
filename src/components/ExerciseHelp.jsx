import { useGame } from '../state/GameContext.jsx';
import { EXERCISE_MAP, LEVEL_LABEL } from '../data/exercises.js';
import { Icon } from './Icons.jsx';
import ExerciseFigure from './ExerciseFigure.jsx';

/** "How to" content for one exercise: animated figure, your variation, steps, safety. */
export default function ExerciseHelp({ exId }) {
  const { variationFor } = useGame();
  const ex = EXERCISE_MAP[exId];
  if (!ex) return null;
  const v = ex.variations[variationFor(exId)];
  return (
    <div className="ex-help">
      <div className="fig-wrap">
        <ExerciseFigure id={exId} size={300} />
      </div>
      <div className="help-variation">
        <span className={`lvl lvl-${v.level}`}>{LEVEL_LABEL[v.level]} · your variation</span>
        <b>{v.name}</b>
        <p className="muted small">{v.cue}</p>
      </div>
      <h4 className="sub-h">How to do it</h4>
      <ol className="howto">
        {ex.instructions.map((t, i) => <li key={i}>{t}</li>)}
      </ol>
      <div className="safety">
        <Icon name="warning" size={16} />
        <span>{ex.safety}</span>
      </div>
      <p className="muted small help-muscles">Works: {ex.muscles.join(', ')}</p>
    </div>
  );
}
