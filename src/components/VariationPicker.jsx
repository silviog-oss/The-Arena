import { useGame } from '../state/GameContext.jsx';
import { EXERCISE_MAP, LEVEL_LABEL } from '../data/exercises.js';
import { variationNeedsDb, hasDumbbells } from '../lib/modifiers.js';
import { Icon } from './Icons.jsx';

/**
 * Easier ◂ variation ▸ Harder. The choice is saved per exercise.
 * Respects the equipment profile: without dumbbells, DB variations are skipped.
 */
export default function VariationPicker({ exId, compact = false }) {
  const { state, variationFor, actions } = useGame();
  const ex = EXERCISE_MAP[exId];
  const idx = variationFor(exId);
  const v = ex.variations[idx];
  const noDb = !hasDumbbells(state.settings);
  const allowed = ex.variations.map((x, i) => i).filter((i) => !(noDb && variationNeedsDb(ex.variations[i])));
  const pos = allowed.indexOf(idx);
  const prevIdx = allowed[pos - 1];
  const nextIdx = allowed[pos + 1];

  return (
    <div className={`variation ${compact ? 'compact' : ''}`}>
      <button className="var-btn" onClick={() => actions.setVariation(exId, prevIdx)} disabled={prevIdx == null} aria-label="Easier variation">
        <Icon name="minus" size={16} />
        {!compact && <span>Easier</span>}
      </button>
      <div className="var-current">
        <b>{v.name}</b>
        <small className={`lvl lvl-${v.level}`}>{LEVEL_LABEL[v.level]}</small>
      </div>
      <button className="var-btn" onClick={() => actions.setVariation(exId, nextIdx)} disabled={nextIdx == null} aria-label="Harder variation">
        {!compact && <span>Harder</span>}
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
