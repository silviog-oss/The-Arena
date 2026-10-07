import { useState } from 'react';
import {
  bmi, bmiCategory, BMI_NOTE, SEX_OPTIONS, kgToLb, lbToKg, cmToFtIn, ftInToCm,
  waterTargetMl, formatWater, formatWeight, formatHeight, bodyComplete,
  weightForBmi, healthyRangeKg, goalError, goalProgress, MIN_GOAL_BMI,
} from '../lib/body.js';
import { Button, ProgressBar } from './UI.jsx';
import { pacesFor, maxSafeRate, goalTimeline, INTENSITY, intensityFor } from '../lib/intensity.js';

const num = (v) => (v === '' || v == null ? '' : String(v));

/**
 * Body profile form: age, sex, weight, height (metric or imperial) with a live BMI preview.
 * Calls onSave({ age, sex, weightKg, heightCm, units }).
 */
export function BodyForm({ initial, onSave, onSkip, saveLabel = 'Save' }) {
  const [units, setUnits] = useState(initial?.units || 'metric');
  const [age, setAge] = useState(num(initial?.age));
  const [sex, setSex] = useState(initial?.sex || '');
  const [kg, setKg] = useState(num(initial?.weightKg && Math.round(initial.weightKg * 10) / 10));
  const [lb, setLb] = useState(num(initial?.weightKg && Math.round(kgToLb(initial.weightKg))));
  const [cm, setCm] = useState(num(initial?.heightCm && Math.round(initial.heightCm)));
  const fi = initial?.heightCm ? cmToFtIn(initial.heightCm) : { ft: '', inch: '' };
  const [ft, setFt] = useState(num(fi.ft));
  const [inch, setInch] = useState(num(fi.inch));

  const weightKg = units === 'metric' ? Number(kg) || null : lb ? lbToKg(Number(lb)) : null;
  const heightCm = units === 'metric' ? Number(cm) || null : ft || inch ? ftInToCm(ft, inch) : null;
  const ageN = Number(age) || null;
  const value = bmi(weightKg, heightCm);
  const cat = bmiCategory(value, ageN);
  const valid = ageN && ageN >= 10 && ageN <= 100 && sex && value != null;

  const switchUnits = (u) => {
    if (u === units) return;
    // Carry values across so nothing has to be retyped.
    if (u === 'imperial') {
      if (kg) setLb(String(Math.round(kgToLb(Number(kg)))));
      if (cm) {
        const c = cmToFtIn(Number(cm));
        setFt(String(c.ft));
        setInch(String(c.inch));
      }
    } else {
      if (lb) setKg(String(Math.round(lbToKg(Number(lb)) * 10) / 10));
      if (ft || inch) setCm(String(Math.round(ftInToCm(ft, inch))));
    }
    setUnits(u);
  };

  return (
    <div className="body-form">
      <div className="seg" role="tablist" aria-label="Units">
        <button role="tab" aria-selected={units === 'metric'} className={units === 'metric' ? 'on' : ''} onClick={() => switchUnits('metric')}>
          kg · cm
        </button>
        <button role="tab" aria-selected={units === 'imperial'} className={units === 'imperial' ? 'on' : ''} onClick={() => switchUnits('imperial')}>
          lb · ft/in
        </button>
      </div>

      <div className="field-grid">
        <label className="field">
          <span>Age</span>
          <input className="input" inputMode="numeric" type="number" min="10" max="100" placeholder="e.g. 28" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        {units === 'metric' ? (
          <>
            <label className="field">
              <span>Weight (kg)</span>
              <input className="input" inputMode="decimal" type="number" step="0.1" placeholder="e.g. 72" value={kg} onChange={(e) => setKg(e.target.value)} />
            </label>
            <label className="field">
              <span>Height (cm)</span>
              <input className="input" inputMode="numeric" type="number" placeholder="e.g. 175" value={cm} onChange={(e) => setCm(e.target.value)} />
            </label>
          </>
        ) : (
          <>
            <label className="field">
              <span>Weight (lb)</span>
              <input className="input" inputMode="decimal" type="number" placeholder="e.g. 160" value={lb} onChange={(e) => setLb(e.target.value)} />
            </label>
            <label className="field">
              <span>Height</span>
              <span className="ftin">
                <input className="input" inputMode="numeric" type="number" placeholder="ft" aria-label="Feet" value={ft} onChange={(e) => setFt(e.target.value)} />
                <input className="input" inputMode="numeric" type="number" placeholder="in" aria-label="Inches" value={inch} onChange={(e) => setInch(e.target.value)} />
              </span>
            </label>
          </>
        )}
      </div>

      <div className="field">
        <span>Gender</span>
        <div className="chip-row">
          {SEX_OPTIONS.map((o) => (
            <button key={o.id} className={`chip ${sex === o.id ? 'on' : ''}`} onClick={() => setSex(o.id)} aria-pressed={sex === o.id}>
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className={`bmi-preview ${value ? '' : 'empty'}`}>
        <span className="eyebrow">BMI</span>
        <b className="mono">{value ?? '—'}</b>
        {cat && <span className={`bmi-tag tone-${cat.tone}`}>{cat.label}</span>}
      </div>

      <Button
        size="lg"
        className="w-full"
        disabled={!valid}
        onClick={() => onSave({ age: ageN, sex, weightKg: Math.round(weightKg * 10) / 10, heightCm: Math.round(heightCm * 10) / 10, units })}
      >
        {saveLabel}
      </Button>
      {onSkip && (
        <button className="link-btn" onClick={onSkip}>
          Skip for now
        </button>
      )}
      <p className="muted small center">Stored only on this device. Used for BMI and your daily water target.</p>
    </div>
  );
}

/** BMI gauge: 15 → 40 scale with healthy band highlighted. */
function BmiGauge({ value }) {
  const min = 15;
  const max = 40;
  const pos = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const at = (v) => `${((v - min) / (max - min)) * 100}%`;
  return (
    <div className="bmi-gauge" aria-hidden="true">
      <div className="bmi-track">
        <span className="seg-under" style={{ left: 0, width: at(18.5) }} />
        <span className="seg-ok" style={{ left: at(18.5), width: `calc(${at(25)} - ${at(18.5)})` }} />
        <span className="seg-over" style={{ left: at(25), width: `calc(${at(30)} - ${at(25)})` }} />
        <span className="seg-ob" style={{ left: at(30), right: 0 }} />
        <span className="bmi-pin" style={{ left: `${pos}%` }} />
      </div>
      <div className="bmi-scale mono">
        <span style={{ left: at(18.5) }}>18.5</span>
        <span style={{ left: at(25) }}>25</span>
        <span style={{ left: at(30) }}>30</span>
      </div>
    </div>
  );
}

/** Summary card used on the Profile screen. */
export function BodyCard({ body, onEdit }) {
  if (!bodyComplete(body)) {
    return (
      <div className="body-empty">
        <p className="muted small">Add your age, gender, weight and height to see your BMI and a personal daily water target.</p>
        <Button className="w-full" onClick={onEdit}>Add body profile</Button>
      </div>
    );
  }
  const value = bmi(body.weightKg, body.heightCm);
  const cat = bmiCategory(value, body.age);
  const sexLabel = SEX_OPTIONS.find((o) => o.id === body.sex)?.label || '—';
  return (
    <div className="body-card">
      <div className="bmi-head">
        <div>
          <span className="eyebrow">Body Mass Index</span>
          <div className="bmi-value mono">{value}</div>
        </div>
        {cat && <span className={`bmi-tag tone-${cat.tone}`}>{cat.label}</span>}
      </div>
      {value && body.age >= 18 && <BmiGauge value={value} />}
      {cat && <p className="small muted">{cat.note}</p>}
      <div className="kpi-grid tight">
        <div className="kpi"><small>Age</small><b>{body.age}</b></div>
        <div className="kpi"><small>Gender</small><b className="kpi-text">{sexLabel}</b></div>
        <div className="kpi"><small>Water / day</small><b>{(waterTargetMl(body.weightKg) / 1000).toFixed(2).replace(/\.?0+$/, '')} L</b></div>
        <div className="kpi"><small>Weight</small><b>{formatWeight(body.weightKg, body.units)}</b></div>
        <div className="kpi"><small>Height</small><b>{formatHeight(body.heightCm, body.units)}</b></div>
        <div className="kpi"><small>Target</small><b className="kpi-text">{formatWater(waterTargetMl(body.weightKg)).split(' (')[1].replace(')', '')}</b></div>
      </div>
      <p className="bmi-note">{BMI_NOTE}</p>
      <Button variant="ghost" className="w-full" onClick={onEdit}>Update weight / height</Button>
    </div>
  );
}

/* ───────── Goal ───────── */

/** Set a goal by weight or BMI, then choose a pace. The pace adapts workout difficulty. */
export function GoalForm({ body, onSave, onClear }) {
  const imperial = body.units === 'imperial';
  const [mode, setMode] = useState(body.goal?.type || 'weight');
  const initialW = body.goal?.weightKg ? (imperial ? Math.round(kgToLb(body.goal.weightKg)) : body.goal.weightKg) : '';
  const [w, setW] = useState(num(initialW));
  const [b, setB] = useState(num(body.goal?.weightKg ? bmi(body.goal.weightKg, body.heightCm) : ''));
  const [paceId, setPaceId] = useState(body.goal?.pace || 'steady');
  const goalKg = mode === 'weight' ? (w ? (imperial ? lbToKg(Number(w)) : Number(w)) : null) : b ? weightForBmi(Number(b), body.heightCm) : null;
  const err = goalKg ? goalError(goalKg, body.heightCm) : null;
  const [lo, hi] = healthyRangeKg(body.heightCm);
  const fmtW = (kg) => formatWeight(kg, body.units);
  const fmtRate = (kg) => (imperial ? `${Math.round(kgToLb(kg) * 10) / 10} lb` : `${kg} kg`);

  const direction = goalKg && !err ? (goalKg < body.weightKg - 0.05 ? 'lose' : goalKg > body.weightKg + 0.05 ? 'gain' : 'maintain') : null;
  const paces = direction && direction !== 'maintain' ? pacesFor(direction, body.weightKg, body.age) : [];
  const pace = paces.find((p) => p.id === paceId && !p.disabled) || paces.find((p) => p.recommended);
  const timeline = pace ? goalTimeline(body.weightKg, goalKg, pace.kgPerWeek) : null;
  const intensity = pace ? INTENSITY[pace.intensity] : INTENSITY.normal;
  const preview = pace ? intensityFor({ goal: { pace: pace.id, direction, weightKg: goalKg, startKg: body.weightKg } }) : intensity;
  const fmtDate = (d) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="body-form">
      <div className="seg" role="tablist" aria-label="Goal type">
        <button role="tab" aria-selected={mode === 'weight'} className={mode === 'weight' ? 'on' : ''} onClick={() => setMode('weight')}>Goal weight</button>
        <button role="tab" aria-selected={mode === 'bmi'} className={mode === 'bmi' ? 'on' : ''} onClick={() => setMode('bmi')}>Goal BMI</button>
      </div>
      {mode === 'weight' ? (
        <label className="field">
          <span>Goal weight ({imperial ? 'lb' : 'kg'})</span>
          <input className="input big" inputMode="decimal" type="number" step="0.1" value={w} onChange={(e) => setW(e.target.value)} placeholder={imperial ? 'e.g. 165' : 'e.g. 75'} />
        </label>
      ) : (
        <label className="field">
          <span>Goal BMI</span>
          <input className="input big" inputMode="decimal" type="number" step="0.1" min={MIN_GOAL_BMI} value={b} onChange={(e) => setB(e.target.value)} placeholder="e.g. 23" />
        </label>
      )}
      <div className="goal-preview">
        <div><small>Now</small><b className="mono">{fmtW(body.weightKg)}</b><span className="muted small">BMI {bmi(body.weightKg, body.heightCm)}</span></div>
        <div className="arrow">→</div>
        <div><small>Goal</small><b className="mono">{goalKg ? fmtW(goalKg) : '—'}</b><span className="muted small">BMI {goalKg ? bmi(goalKg, body.heightCm) ?? '—' : '—'}</span></div>
      </div>
      <p className="muted small">Healthy range for your height: <b>{fmtW(lo)} – {fmtW(hi)}</b> (BMI 18.5–24.9).</p>
      {err && <p className="form-error">{err}</p>}

      {paces.length > 0 && (
        <div className="field">
          <span>How fast do you want to {direction}?</span>
          <div className="pace-grid">
            {paces.map((p) => (
              <button
                key={p.id}
                className={`pace ${pace?.id === p.id ? 'on' : ''}`}
                disabled={p.disabled}
                onClick={() => setPaceId(p.id)}
                aria-pressed={pace?.id === p.id}
              >
                <b>{p.label}</b>
                <small className="mono">{fmtRate(p.kgPerWeek)}/wk</small>
                {p.recommended && <i>Recommended</i>}
              </button>
            ))}
          </div>
          {paces.some((p) => p.capped) && (
            <p className="muted small">Max pace is capped at 1% of your body weight per week ({fmtRate(maxSafeRate(direction, body.weightKg))}) for safety.</p>
          )}
          {paces.some((p) => p.disabled) && <p className="muted small">Faster paces aren’t available under 18.</p>}
        </div>
      )}

      {timeline && (
        <div className={`pace-card tone-border-${preview.tone}`}>
          <div className="pace-row">
            <span>Realistic time</span>
            <b>~{timeline.weeks} week{timeline.weeks === 1 ? '' : 's'} · {fmtDate(timeline.date)}</b>
          </div>
          <div className="pace-row">
            <span>During the 31-day program</span>
            <b>≈ {fmtRate(timeline.in31)} {direction === 'lose' ? 'lost' : 'gained'}</b>
          </div>
          <div className="pace-row">
            <span>Workout difficulty</span>
            <b className={`tone-${preview.tone}`}>{preview.label}</b>
          </div>
          {timeline.weeks * 7 > 31 && (
            <p className="small cycle-note">
              That’s longer than one 31-day program (~{Math.ceil((timeline.weeks * 7) / 31)} cycles). After Day 31 you continue
              with Cycle 2+ — same structure, harder missions, more XP.
            </p>
          )}
          <p className="small muted">{preview.summary}</p>
          <p className={`pace-warning tone-${preview.tone}`}>⚠ {preview.warning}</p>
          {direction === 'lose' && pace.kgPerWeek >= 0.75 && (
            <p className="small muted">Faster loss also depends on diet. Don’t go below about 1,200 kcal/day (women) or 1,500 kcal/day (men) without medical supervision.</p>
          )}
        </div>
      )}
      {direction === 'maintain' && <p className="note">Goal matches your current weight — workouts stay at standard difficulty.</p>}

      <Button
        size="lg"
        className="w-full"
        disabled={!goalKg || !!err}
        onClick={() =>
          onSave({
            type: mode,
            weightKg: Math.round(goalKg * 10) / 10,
            startKg: body.weightKg,
            setAt: Date.now(),
            direction: direction || 'maintain',
            pace: pace?.id || null,
            kgPerWeek: pace?.kgPerWeek || null,
          })
        }
      >
        Save goal
      </Button>
      {onClear && body.goal && <button className="link-btn" onClick={onClear}>Remove goal</button>}
    </div>
  );
}

/** Quick weight log: one number, saves and updates goal progress. */
export function WeighIn({ body, onSave }) {
  const imperial = body.units === 'imperial';
  const [v, setV] = useState('');
  const kg = v ? (imperial ? lbToKg(Number(v)) : Number(v)) : null;
  const ok = kg && bmi(kg, body.heightCm) != null;
  return (
    <div className="weigh-in">
      <input className="input" inputMode="decimal" type="number" step="0.1" placeholder={`Today's weight (${imperial ? 'lb' : 'kg'})`} value={v} onChange={(e) => setV(e.target.value)} aria-label="Today's weight" />
      <Button disabled={!ok} onClick={() => { onSave(Math.round(kg * 10) / 10); setV(''); }}>Log</Button>
    </div>
  );
}

const PACE_LABEL = (g) => (g.direction === 'gain' ? { relaxed: 'Lean', steady: 'Steady', fast: 'Fast' } : { relaxed: 'Relaxed', steady: 'Steady', fast: 'Fast', max: 'Max safe' })[g.pace] || g.pace;

export function GoalCard({ body, onSetGoal, onLog }) {
  const p = goalProgress(body);
  if (!p) {
    return (
      <div className="goal-card empty">
        <p className="muted small">Set a goal weight or goal BMI and track your progress as you log your weight.</p>
        <Button variant="ghost" className="w-full" onClick={onSetGoal}>Set a goal</Button>
      </div>
    );
  }
  const fmtW = (kg) => formatWeight(kg, body.units);
  const unit = body.units === 'imperial' ? 'lb' : 'kg';
  const rem = body.units === 'imperial' ? Math.round(kgToLb(p.remaining)) : p.remaining;
  const log = (body.weightLog || []).slice(-6);
  return (
    <div className="goal-card">
      <div className="goal-head">
        <div>
          <span className="eyebrow">{body.goal.type === 'bmi' ? `Goal · BMI ${p.targetBmi}` : 'Goal weight'}</span>
          <b className="goal-target mono">{fmtW(p.target)}</b>
        </div>
        <span className={`bmi-tag ${p.reached ? 'tone-ok' : 'tone-muted'}`}>
          {p.reached ? 'Goal reached ✓' : `${rem} ${unit} to ${p.direction}`}
        </span>
      </div>
      <ProgressBar value={p.pct} max={100} height={10} label="Goal progress" />
      <div className="goal-scale small muted mono">
        <span>Start {fmtW(p.start)}</span>
        <span>Now {fmtW(p.current)}</span>
      </div>
      {!p.reached && p.weeks > 0 && (
        <p className="small muted">
          At {body.goal.kgPerWeek || 0.5} kg/week: about {p.weeks} week{p.weeks === 1 ? '' : 's'} to go.
        </p>
      )}
      {body.goal.pace && (
        <div className="pace-chip">
          <span>Pace: <b>{PACE_LABEL(body.goal)}</b></span>
          <span>Workouts: <b className={`tone-${intensityFor(body).tone}`}>{intensityFor(body).label}</b></span>
        </div>
      )}
      {log.length > 1 && (
        <ul className="weight-log">
          {log.slice().reverse().map((e) => (
            <li key={e.date}><span className="muted mono">{e.date}</span><b className="mono">{fmtW(e.kg)}</b></li>
          ))}
        </ul>
      )}
      <WeighIn body={body} onSave={onLog} />
      <button className="link-btn" onClick={onSetGoal}>Change goal</button>
    </div>
  );
}
