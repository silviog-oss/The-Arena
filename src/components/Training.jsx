/**
 * Training-support components:
 *  - ReplaceExercise  ("Can't do this exercise?")
 *  - HunterStatus     (daily readiness check-in)
 *  - RecoveryBanner   (Recovery Mode / rest-day protection)
 *  - EquipmentForm    (dumbbell setup)
 */
import { useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { EXERCISE_MAP } from '../data/exercises.js';
import { STAT_INFO } from '../lib/progression.js';
import { substitutesFor, READINESS, DB_SETUPS, recoveryAdvice } from '../lib/modifiers.js';
import { toDateKey } from '../lib/progression.js';
import { Button } from './UI.jsx';
import ExerciseFigure from './ExerciseFigure.jsx';

const mainStat = (ex) => Object.entries(ex.stats).sort((a, b) => b[1] - a[1])[0][0];

/** List of replacement options for an exercise. `original` = the program's exercise id. */
export function ReplaceExercise({ original, onDone }) {
  const { state, actions } = useGame();
  const current = state.settings.subs?.[original] || original;
  const orig = EXERCISE_MAP[original];
  const options = substitutesFor(original);
  const pick = (id) => {
    actions.setSub(original, id === original ? null : id);
    onDone?.(id);
  };
  return (
    <div className="replace">
      <p className="muted small">
        Pick an alternative that trains similar muscles ({orig.muscles.slice(0, 3).join(', ')}). It replaces
        <b> {orig.name}</b> in every mission until you switch it back. Sets stay the same.
      </p>
      <ul className="replace-list">
        {[original, ...options].map((id) => {
          const ex = EXERCISE_MAP[id];
          const st = mainStat(ex);
          return (
            <li key={id}>
              <button className={`replace-item ${current === id ? 'on' : ''}`} onClick={() => pick(id)} aria-pressed={current === id}>
                <span className="ex-thumb"><ExerciseFigure id={id} size={64} /></span>
                <span className="replace-info">
                  <b>{ex.name}{id === original ? ' (original)' : ''}</b>
                  <small className="muted">{ex.muscles.slice(0, 3).join(' · ')} · {ex.equipment === 'Bodyweight' ? 'Bodyweight' : 'DB or BW'}</small>
                </span>
                <span className="lib-stat" style={{ color: STAT_INFO[st].color, borderColor: STAT_INFO[st].color }}>{st}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** ⚔️ Hunter Status — how do you feel today? Adjusts today's workout. */
export function HunterStatus({ compact = false }) {
  const { state, actions } = useGame();
  const today = toDateKey();
  const cur = state.readiness?.[today];
  const [editing, setEditing] = useState(!cur);

  if (cur && !editing) {
    const r = READINESS.find((x) => x.id === cur.level);
    return (
      <div className={`status-set ${compact ? 'compact' : ''}`}>
        <span className="status-emoji">{r.emoji}</span>
        <div>
          <b>{r.label}</b>
          <small className="muted">
            {cur.level === 'excellent' ? (cur.overdrive ? 'Overdrive ON: +1 set on the first two exercises · +15% XP' : 'Overdrive available') : r.effect}
          </small>
        </div>
        {cur.level === 'excellent' && (
          <button className={`chip ${cur.overdrive ? 'on' : ''}`} onClick={() => actions.setReadiness('excellent', { overdrive: !cur.overdrive })}>
            🔥 Overdrive
          </button>
        )}
        <button className="link-btn small" onClick={() => setEditing(true)}>Change</button>
      </div>
    );
  }
  return (
    <div className="status-pick">
      <div className="status-grid">
        {READINESS.map((r) => (
          <button
            key={r.id}
            className={`status-btn ${cur?.level === r.id ? 'on' : ''}`}
            onClick={() => {
              actions.setReadiness(r.id, { overdrive: false });
              setEditing(false);
            }}
          >
            <span className="status-emoji">{r.emoji}</span>
            <b>{r.label}</b>
          </button>
        ))}
      </div>
      <p className="muted small">Exhausted lightens today’s workout. Excellent unlocks an optional Overdrive challenge.</p>
    </div>
  );
}

/** Recovery Mode indicator + rest-day protection prompts (Home). */
export function RecoveryBanner({ nav }) {
  const { state, profile, actions } = useGame();
  const advice = recoveryAdvice(state, profile);
  const rm = state.recoveryMode;

  if (rm?.remaining > 0) {
    return (
      <div className="recovery-banner on">
        <span className="rb-icon">🛡</span>
        <div>
          <b>Recovery Mode</b>
          <small>Next {rm.remaining} workout{rm.remaining > 1 ? 's' : ''}: −1 set, +15s rest. Ease back in.</small>
        </div>
        <button className="link-btn small" onClick={actions.endRecoveryMode}>End</button>
      </div>
    );
  }
  if (advice.restToday) {
    return (
      <div className="recovery-banner rest">
        <span className="rb-icon">🛡</span>
        <div>
          <b>Recovery day logged</b>
          <small>Your streak is safe. Light walking and stretching are perfect today.</small>
        </div>
      </div>
    );
  }
  if (advice.recommendRest) {
    return (
      <div className="recovery-banner warn">
        <span className="rb-icon">⚠</span>
        <div>
          <b>Recovery recommended</b>
          <small>{advice.consecutive} training days in a row. Muscles grow during rest — a recovery day keeps your streak.</small>
          <div className="rb-actions">
            {advice.canLogRest && (
              <Button size="sm" onClick={() => { actions.logRestDay(); nav?.showToast({ icon: '🛡', title: 'Recovery day logged', body: 'Streak protected.' }); }}>
                Log recovery day
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => actions.startRecoveryMode({ workouts: 1, reason: 'fatigue' })}>
              Lighter workout today
            </Button>
          </div>
        </div>
      </div>
    );
  }
  return null;
}

/** Dumbbell setup. */
export function EquipmentForm({ compact = false }) {
  const { state, actions } = useGame();
  const eq = state.settings.equipment || { dumbbells: 'fixed', maxKg: null };
  return (
    <div className="equip">
      <div className="chip-row">
        {DB_SETUPS.map((o) => (
          <button key={o.id} className={`chip ${eq.dumbbells === o.id ? 'on' : ''}`} onClick={() => actions.setEquipment({ dumbbells: o.id })} aria-pressed={eq.dumbbells === o.id}>
            {o.label}
          </button>
        ))}
      </div>
      {eq.dumbbells !== 'none' && (
        <label className="time-row">
          <span>
            {eq.dumbbells === 'fixed' ? 'Heaviest dumbbell you have' : 'Max weight per dumbbell'}
            {!compact && <small className="muted block">Weight suggestions never go above this.</small>}
          </span>
          <span className="kg-input">
            <input
              className="input time"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.5"
              placeholder="kg"
              value={eq.maxKg ?? ''}
              onChange={(e) => actions.setEquipment({ maxKg: e.target.value === '' ? null : Math.max(0, Number(e.target.value)) })}
            />
            <small>kg</small>
          </span>
        </label>
      )}
      {eq.dumbbells === 'none' && (
        <p className="muted small">Every dumbbell exercise switches to its bodyweight version automatically.</p>
      )}
    </div>
  );
}
