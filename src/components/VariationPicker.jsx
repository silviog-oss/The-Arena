import { useGame } from '../state/GameContext.jsx';
import { EXERCISE_MAP, LEVEL_LABEL } from '../data/exercises.js';
import { Icon } from './Icons.jsx';

/** Easier ◂ variation ▸ Harder. The choice is saved per exercise. */
export default function VariationPicker({ exId, compact = false }) {
  const { variationFor, actions } = useGame();
  const ex = EXERCISE_MAP[exId];
  const idx = variationFor(exId);
  const v = ex.variations[idx];
  const set = (i) => actions.setVariation(exId, Math.max(0, Math.min(ex.variations.length - 1, i)));

  return (
    <div className={`variation ${compact ? 'compact' : ''}`}>
      <button className="var-btn" onClick={() => set(idx - 1)} disabled={idx === 0} aria-label="Easier variation">
        <Icon name="minus" size={16} />
        {!compact && <span>Easier</span>}
      </button>
      <div className="var-current">
        <b>{v.name}</b>
        <small className={`lvl lvl-${v.level}`}>{LEVEL_LABEL[v.level]}</small>
      </div>
      <button
        className="var-btn"
        onClick={() => set(idx + 1)}
        disabled={idx === ex.variations.length - 1}
        aria-label="Harder variation"
      >
        {!compact && <span>Harder</span>}
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
