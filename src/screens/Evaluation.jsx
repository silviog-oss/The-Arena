import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import {
  PUSHUP_TEST_VARIATIONS, REACH_OPTIONS, EVAL_XP, gradeFor, EXPERIENCE_LABEL, recommendedExperience,
} from '../lib/evaluation.js';
import { STAT_KEYS, STAT_INFO } from '../lib/progression.js';
import { sounds, unlockAudio, vibrate } from '../lib/feedback.js';
import { useWakeLock } from '../hooks/useSystem.js';
import { ScreenHeader, Button, Panel, Disclaimer, ProgressBar, CountUp } from '../components/UI.jsx';
import { Icon } from '../components/Icons.jsx';
import { LogoMark } from '../components/Logo.jsx';
import ExerciseFigure from '../components/ExerciseFigure.jsx';

/* ───────── Small building blocks ───────── */

function Stepper({ value, onChange, min = 0, max = 300, step = 1, unit }) {
  const set = (v) => onChange(Math.max(min, Math.min(max, v)));
  return (
    <div className="stepper">
      <button onClick={() => set(value - 5 * step)} aria-label="Minus 5">−5</button>
      <button onClick={() => set(value - step)} aria-label="Minus 1"><Icon name="minus" /></button>
      <div className="stepper-val">
        <b className="mono">{value}</b>
        {unit && <small>{unit}</small>}
      </div>
      <button onClick={() => set(value + step)} aria-label="Plus 1"><Icon name="plus" /></button>
      <button onClick={() => set(value + 5 * step)} aria-label="Plus 5">+5</button>
    </div>
  );
}

/**
 * Countdown (mode 'down', from `seconds`) or stopwatch (mode 'up', capped at `seconds`).
 * Calls onDone(elapsedSeconds) when finished or stopped.
 */
function TestTimer({ seconds, mode = 'down', onDone, label = 'Start' }) {
  const [state, setState] = useState('idle'); // idle | prep | run | done
  const [t, setT] = useState(mode === 'down' ? seconds : 0);
  const [prep, setPrep] = useState(3);
  const ref = useRef({});
  useWakeLock(state === 'run' || state === 'prep');

  useEffect(() => {
    if (state === 'prep') {
      if (prep === 0) {
        setState('run');
        sounds.go();
        vibrate([80, 60, 80]);
        ref.current.start = performance.now();
        return undefined;
      }
      sounds.tick();
      const id = setTimeout(() => setPrep((p) => p - 1), 1000);
      return () => clearTimeout(id);
    }
    if (state !== 'run') return undefined;
    const id = setInterval(() => {
      const el = (performance.now() - ref.current.start) / 1000;
      if (mode === 'down') {
        const left = seconds - el;
        if (Math.ceil(left) !== Math.ceil(ref.current.lastLeft ?? seconds) && left <= 3.05 && left > 0) sounds.tick();
        ref.current.lastLeft = left;
        if (left <= 0) {
          setT(0);
          setState('done');
          sounds.complete();
          vibrate([100, 50, 200]);
          onDone(seconds);
        } else setT(left);
      } else {
        if (el >= seconds) {
          setT(seconds);
          setState('done');
          sounds.complete();
          onDone(seconds);
        } else setT(el);
      }
    }, 100);
    return () => clearInterval(id);
  }, [state, prep, mode, seconds, onDone]);

  const start = () => {
    unlockAudio();
    setPrep(3);
    setT(mode === 'down' ? seconds : 0);
    setState('prep');
  };
  const stop = () => {
    const el = Math.round((performance.now() - ref.current.start) / 1000);
    setState('done');
    sounds.rest();
    onDone(mode === 'down' ? seconds : el);
  };

  return (
    <div className="test-timer">
      <div className={`tt-dial ${state}`}>
        {state === 'prep' ? (
          <b className="mono">{prep}</b>
        ) : (
          <b className="mono">{mode === 'down' ? Math.ceil(t) : Math.floor(t)}</b>
        )}
        <small>{state === 'prep' ? 'get ready' : mode === 'down' ? 'seconds left' : `seconds (max ${seconds})`}</small>
      </div>
      {state === 'idle' && <Button size="lg" className="w-full" icon="play" onClick={start}>{label}</Button>}
      {state === 'run' && mode === 'up' && (
        <Button size="xl" variant="danger" className="w-full" onClick={stop}>Stop</Button>
      )}
      {state === 'run' && mode === 'down' && <p className="muted small center">Count every rep. Keep going!</p>}
      {state === 'done' && (
        <button className="link-btn" onClick={start}>Redo this test</button>
      )}
    </div>
  );
}

/* ───────── Screen ───────── */

const STEPS = ['intro', 'warmup', 'pushups', 'squats', 'plank', 'balance', 'results'];

export default function Evaluation({ nav }) {
  const { state, actions } = useGame();
  // Capture at mount: after finishing, the new evaluation is in state and would flip these.
  const [previous] = useState(() => state.evaluations?.[state.evaluations.length - 1] || null);
  const isRetest = !!previous;
  const [step, setStep] = useState(0);
  const [raw, setRaw] = useState({ pushupVariation: previous?.raw.pushupVariation || 'knee', pushups: 0, squats: 0, plank: 0, balanceL: 0, balanceR: 0, reach: 1 });
  const [timed, setTimed] = useState({});
  const [apply, setApply] = useState(true);
  const [result, setResult] = useState(null);
  const set = (k, v) => setRaw((r) => ({ ...r, [k]: v }));
  const id = STEPS[step];
  const next = () => {
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const finish = () => {
    const r = actions.completeEvaluation({ raw, applyExperience: apply });
    setResult(r);
    sounds.complete();
    next();
  };

  const header = (
    <ScreenHeader
      title={isRetest ? 'Re-evaluation' : 'Mission 0'}
      sub={id === 'intro' ? 'Hunter Evaluation' : id === 'results' ? 'Results' : `Test ${Math.min(4, step - 1)} of 4`}
      onBack={id === 'results' ? undefined : nav.pop}
    />
  );

  return (
    <div className="screen eval">
      {header}
      {id !== 'intro' && id !== 'results' && <ProgressBar value={step} max={STEPS.length - 1} height={6} label="Evaluation progress" />}

      {id === 'intro' && (
        <>
          <Panel glow className="eval-hero">
            <LogoMark size={64} glow />
            <h2>{isRetest ? 'Measure your growth' : 'The System must assess you'}</h2>
            <p className="muted">
              {isRetest
                ? 'Repeat the four tests. Every improvement over your last evaluation becomes a stat breakthrough.'
                : 'Four short tests set your starting stats. Your stats begin at 0 — this is where they come from.'}
            </p>
          </Panel>
          <Panel title="The tests (~10 min)">
            <ul className="eval-list">
              <li><b style={{ color: STAT_INFO.STR.color }}>STR</b> Max push-ups with good form</li>
              <li><b style={{ color: STAT_INFO.END.color }}>END</b> Squats in 60 seconds</li>
              <li><b style={{ color: STAT_INFO.VIT.color }}>VIT</b> Plank hold (up to 3 min)</li>
              <li><b style={{ color: STAT_INFO.AGI.color }}>AGI</b> Single-leg balance + toe-touch reach</li>
            </ul>
            <p className="muted small">Rest 1–2 minutes between tests. Stop any test when your form breaks — not when it hurts. Pain means stop.</p>
          </Panel>
          <Disclaimer compact />
          <Button size="lg" className="w-full" icon="play" onClick={next}>Begin evaluation</Button>
          {!isRetest && (
            <button
              className="link-btn"
              onClick={() => {
                actions.skipEvaluation();
                nav.showToast({ icon: '↷', title: 'Evaluation skipped', body: 'Stats start at 5. You can take it later in Profile.' });
                nav.pop();
              }}
            >
              Skip for now (stats start at 5)
            </button>
          )}
        </>
      )}

      {id === 'warmup' && (
        <Panel title="Warm-up · 60 sec">
          <p className="muted">Arm circles, then march or jog in place. Warm muscles give a truer result.</p>
          <TestTimer seconds={60} mode="down" label="Start warm-up" onDone={() => setTimed((t) => ({ ...t, warm: true }))} />
          <Button className="w-full mt8" variant={timed.warm ? 'primary' : 'ghost'} onClick={next}>{timed.warm ? 'Next: Push-ups' : 'Skip warm-up'}</Button>
        </Panel>
      )}

      {id === 'pushups' && (
        <Panel title="STR · Push-up test">
          <div className="fig-wrap"><ExerciseFigure id="pushup" size={240} /></div>
          <p className="muted">Pick the hardest variation you can do with good form, then do as many reps as you can. Stop when your hips sag or you can’t reach full range.</p>
          <div className="chip-row">
            {PUSHUP_TEST_VARIATIONS.map((v) => (
              <button key={v.id} className={`chip ${raw.pushupVariation === v.id ? 'on' : ''}`} onClick={() => set('pushupVariation', v.id)}>{v.label}</button>
            ))}
          </div>
          <h3 className="sub-h">Reps completed</h3>
          <Stepper value={raw.pushups} onChange={(v) => set('pushups', v)} max={150} unit="reps" />
          {previous && <p className="muted small">Last time: {previous.raw.pushups} ({previous.raw.pushupVariation})</p>}
          <Button size="lg" className="w-full mt8" onClick={next}>Save · Next: Squats</Button>
        </Panel>
      )}

      {id === 'squats' && (
        <Panel title="END · 60-second squats">
          <div className="fig-wrap"><ExerciseFigure id="squat" size={240} speed={1.6} /></div>
          <p className="muted">Full squats as fast as you can with control. Count each rep while the timer runs.</p>
          <TestTimer seconds={60} mode="down" label="Start 60 s" onDone={() => setTimed((t) => ({ ...t, squats: true }))} />
          <h3 className="sub-h">Squats completed</h3>
          <Stepper value={raw.squats} onChange={(v) => set('squats', v)} max={120} unit="reps" />
          {previous && <p className="muted small">Last time: {previous.raw.squats}</p>}
          <Button size="lg" className="w-full mt8" onClick={next}>Save · Next: Plank</Button>
        </Panel>
      )}

      {id === 'plank' && (
        <Panel title="VIT · Plank hold">
          <div className="fig-wrap"><ExerciseFigure id="plank" size={240} /></div>
          <p className="muted">Forearm plank (or knee plank). Tap Stop when your hips sag or you need to rest. Max 3 minutes.</p>
          <TestTimer seconds={180} mode="up" label="Start plank" onDone={(s) => set('plank', s)} />
          <h3 className="sub-h">Seconds held</h3>
          <Stepper value={raw.plank} onChange={(v) => set('plank', v)} max={180} unit="sec" />
          {previous && <p className="muted small">Last time: {previous.raw.plank}s</p>}
          <Button size="lg" className="w-full mt8" onClick={next}>Save · Next: Balance</Button>
        </Panel>
      )}

      {id === 'balance' && (
        <Panel title="AGI · Balance + reach">
          <p className="muted">Stand on one leg, hands on hips, near a wall for safety. Stop when the other foot touches down. Max 60 s per side.</p>
          <h3 className="sub-h">Left leg</h3>
          <TestTimer key="L" seconds={60} mode="up" label="Start left leg" onDone={(s) => set('balanceL', s)} />
          <Stepper value={raw.balanceL} onChange={(v) => set('balanceL', v)} max={60} unit="sec" />
          <h3 className="sub-h">Right leg</h3>
          <TestTimer key="R" seconds={60} mode="up" label="Start right leg" onDone={(s) => set('balanceR', s)} />
          <Stepper value={raw.balanceR} onChange={(v) => set('balanceR', v)} max={60} unit="sec" />
          <h3 className="sub-h">Toe-touch reach</h3>
          <p className="muted small">Stand with straight legs and slowly reach down. How far do your fingertips get? Don’t bounce.</p>
          <div className="chip-row">
            {REACH_OPTIONS.map((o) => (
              <button key={o.id} className={`chip ${raw.reach === o.id ? 'on' : ''}`} onClick={() => set('reach', o.id)}>{o.label}</button>
            ))}
          </div>
          {!isRetest && (
            <label className="check-row">
              <input type="checkbox" checked={apply} onChange={(e) => setApply(e.target.checked)} />
              <span>Set my starting difficulty from these results (recommended: <b>{EXPERIENCE_LABEL[recommendedExperience(raw)]}</b>)</span>
            </label>
          )}
          <Button size="lg" className="w-full" onClick={finish}>Finish evaluation</Button>
        </Panel>
      )}

      {id === 'results' && result && (
        <>
          <div className="complete-hero">
            <div className="burst" aria-hidden="true" />
            <LogoMark size={72} glow className="pop" />
            <p className="eyebrow fade d1">{result.kind === 'retest' ? 'Re-evaluation complete' : 'Evaluation complete'}</p>
            <h1 className="complete-title fade d1">{result.kind === 'retest' ? 'GROWTH MEASURED' : 'STATS AWAKENED'}</h1>
          </div>
          <Panel className="fade d2">
            <div className="xp-reward"><CountUp to={result.xp} prefix="+" suffix=" XP" /></div>
            <ul className="eval-scores">
              {STAT_KEYS.map((k, i) => (
                <li key={k} className="fade" style={{ animationDelay: `${0.4 + i * 0.12}s` }}>
                  <span className="es-key" style={{ color: STAT_INFO[k].color }}>{k}</span>
                  <span className="es-name">{STAT_INFO[k].name}</span>
                  <span className={`diff diff-${gradeFor(result.scores[k])}`}>{gradeFor(result.scores[k])}</span>
                  <b className="mono">{result.scores[k]}<small>/30</small></b>
                  {result.kind === 'retest' && (
                    <span className={`es-delta ${result.scores[k] > result.prev[k] ? 'up' : ''}`}>
                      {result.scores[k] > result.prev[k] ? `+${result.scores[k] - result.prev[k]}` : '±0'}
                    </span>
                  )}
                </li>
              ))}
            </ul>
            <p className="muted small">
              {result.kind === 'retest'
                ? 'Improvements were added to your stats as breakthroughs.'
                : 'These are your starting stats. Every mission you clear raises them.'}
            </p>
          </Panel>
          {result.kind === 'initial' && apply && (
            <Panel className="fade d3">
              <span className="eyebrow">Starting difficulty</span>
              <h2>{EXPERIENCE_LABEL[result.recommended]}</h2>
              <p className="muted small">Exercise variations were set to match. Change any of them on the mission screen.</p>
            </Panel>
          )}
          <Button size="lg" className="w-full" onClick={() => nav.closeAll('home')}>
            {result.kind === 'initial' ? 'Begin Day 1' : 'Return to base'}
          </Button>
        </>
      )}
    </div>
  );
}

export { EVAL_XP };
