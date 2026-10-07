import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { DAY_MAP } from '../data/program.js';
import { EXERCISE_MAP } from '../data/exercises.js';
import { buildSteps, describeTarget, workCount } from '../lib/workout.js';
import { sounds, unlockAudio, vibrate } from '../lib/feedback.js';
import { notify, MESSAGES } from '../lib/notifications.js';
import { reportActivity } from '../lib/push.js';
import { toDateKey } from '../lib/progression.js';
import { useWakeLock } from '../hooks/useSystem.js';
import { Icon } from '../components/Icons.jsx';
import { Button, ProgressBar, Sheet } from '../components/UI.jsx';
import VariationPicker from '../components/VariationPicker.jsx';

const fmt = (s) => {
  const v = Math.max(0, Math.ceil(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
};

export default function Workout({ day, resume, nav }) {
  const { state, actions, variationFor, profile } = useGame();
  const def = DAY_MAP[day];
  const steps = useMemo(() => buildSteps(def), [def]);
  const totalWork = useMemo(() => workCount(steps), [steps]);
  const saved = resume && state.activeWorkout?.day === day ? state.activeWorkout : null;

  const [index, setIndex] = useState(saved ? Math.min(saved.step, steps.length - 1) : 0);
  const [remaining, setRemaining] = useState(() => steps[saved ? Math.min(saved.step, steps.length - 1) : 0].time || 0);
  const [stopwatch, setStopwatch] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(!!saved);
  const [elapsed, setElapsed] = useState(saved?.seconds || 0);
  const [skipped, setSkipped] = useState(saved?.skipped || 0);
  const [exitOpen, setExitOpen] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const s = state.settings;
  const step = steps[index];
  const ex = step.exId ? EXERCISE_MAP[step.exId] : null;
  const nextEx = step.nextExId ? EXERCISE_MAP[step.nextExId] : null;
  const variation = ex ? ex.variations[variationFor(ex.id)] : null;
  const workDone = steps.slice(0, index).filter((x) => x.kind === 'work').length;

  useWakeLock(running && s.keepAwake);

  // Refs so the interval always sees fresh values.
  const r = useRef({});
  r.current = { index, remaining, running, steps, elapsed, skipped, s };

  const feedback = useCallback((kind) => {
    const st = r.current.s;
    if (st.sound) sounds[kind]?.();
    if (st.vibration) vibrate(kind === 'go' ? [80, 60, 80] : kind === 'tick' ? 30 : kind === 'complete' ? [100, 50, 100, 50, 200] : 120);
  }, []);

  const persist = useCallback(
    (i, secs, sk) => actions.setActive({ day, step: i, seconds: Math.round(secs), skipped: sk, updatedAt: Date.now() }),
    [actions, day],
  );

  const finish = useCallback(() => {
    if (finishing) return;
    setFinishing(true);
    setRunning(false);
    feedback('complete');
    const result = actions.completeDay({ day, seconds: Math.round(r.current.elapsed), skipped: r.current.skipped });
    const n = s.notifications;
    if (n.enabled) {
      if (n.missionComplete) {
        const m = MESSAGES.complete(day);
        notify(m.title, m.body, { tag: 'arena-complete' });
      }
      if (n.levelUp && result.levelAfter > result.levelBefore) {
        const m = MESSAGES.levelUp(result.levelAfter);
        notify(m.title, m.body, { tag: 'arena-level' });
      }
    }
    reportActivity(toDateKey());
    nav.replace({ name: 'complete', result });
  }, [actions, day, feedback, finishing, nav, s.notifications]);

  const goTo = useCallback(
    (i, { auto = false } = {}) => {
      const list = r.current.steps;
      if (i >= list.length) {
        finish();
        return;
      }
      const target = Math.max(0, i);
      setIndex(target);
      setRemaining(list[target].time || 0);
      setStopwatch(0);
      persist(target, r.current.elapsed, r.current.skipped);
      if (r.current.running || auto) {
        const k = list[target].kind;
        feedback(k === 'rest' ? 'rest' : 'go');
      }
    },
    [feedback, finish, persist],
  );

  // Main clock — timestamp based so it stays accurate if the tab throttles.
  useEffect(() => {
    if (!running) return undefined;
    let last = performance.now();
    const id = setInterval(() => {
      const now = performance.now();
      const dt = (now - last) / 1000;
      last = now;
      setElapsed((e) => e + dt);
      const cur = r.current.steps[r.current.index];
      if (cur.time) {
        const prev = r.current.remaining;
        const nextVal = prev - dt;
        if (Math.ceil(nextVal) < Math.ceil(prev) && Math.ceil(nextVal) <= 3 && Math.ceil(nextVal) > 0) feedback('tick');
        if (nextVal <= 0) {
          goTo(r.current.index + 1, { auto: true });
        } else {
          setRemaining(nextVal);
        }
      } else {
        setStopwatch((w) => w + dt);
      }
    }, 200);
    return () => clearInterval(id);
  }, [running, feedback, goTo]);

  // Save elapsed time periodically so a closed app resumes accurately.
  useEffect(() => {
    if (!started) return undefined;
    const id = setInterval(() => persist(r.current.index, r.current.elapsed, r.current.skipped), 10000);
    return () => clearInterval(id);
  }, [started, persist]);

  const toggleRun = () => {
    unlockAudio();
    if (!started) {
      setStarted(true);
      persist(index, elapsed, skipped);
      feedback(step.kind === 'work' ? 'go' : 'rest');
    }
    setRunning((v) => !v);
  };

  const doneSet = () => {
    unlockAudio();
    if (!started) setStarted(true);
    if (!running) setRunning(true);
    goTo(index + 1, { auto: true });
  };

  const skip = () => {
    if (step.kind === 'work') {
      const sk = skipped + 1;
      setSkipped(sk);
      r.current.skipped = sk;
    }
    goTo(index + 1, { auto: running });
  };

  const prev = () => goTo(index - 1);
  const addRest = (n) => setRemaining((v) => v + n);

  const saveAndExit = () => {
    setRunning(false);
    persist(index, elapsed, skipped);
    setExitOpen(false);
    nav.pop();
  };
  const discard = () => {
    setRunning(false);
    actions.setActive(null);
    setExitOpen(false);
    nav.pop();
  };

  const isRest = step.kind === 'rest';
  const isPrep = step.kind === 'prep';
  const timed = !!step.time;
  const ringPct = timed ? Math.max(0, remaining / step.time) : 0;
  const R = 108;
  const C = 2 * Math.PI * R;
  const restAfter = step.kind === 'work' ? steps[index + 1]?.kind === 'rest' ? steps[index + 1].time : 0 : null;

  return (
    <div className={`workout ${isRest ? 'is-rest' : isPrep ? 'is-prep' : 'is-work'}`}>
      <header className="wo-top">
        <button className="icon-btn" onClick={() => { setRunning(false); setExitOpen(true); }} aria-label="Exit workout">
          <Icon name="close" />
        </button>
        <div className="wo-title">
          <small>DAY {day}</small>
          <b>{def.title}</b>
        </div>
        <span className="wo-clock mono">{fmt(elapsed)}</span>
      </header>

      <div className="wo-progress">
        <ProgressBar value={workDone} max={totalWork} height={6} label="Workout progress" />
        <span className="mono small muted">{workDone}/{totalWork} sets</span>
      </div>

      <div className="wo-body">
        <span className="wo-phase">
          {isPrep ? 'Get ready' : isRest ? 'Rest' : step.warmup ? 'Warm-up' : 'Current exercise'}
        </span>

        {!isRest && !isPrep && ex && (
          <>
            <h1 className="wo-ex">{variation?.name || ex.name}</h1>
            <p className="wo-base muted">{ex.name}</p>
          </>
        )}
        {(isRest || isPrep) && nextEx && (
          <>
            <h1 className="wo-ex">{isPrep ? 'Mission starts' : 'Recover'}</h1>
            <p className="wo-base muted">
              Up next: <b>{nextEx.variations[variationFor(nextEx.id)].name}</b> · {describeTarget(step.nextStep)}
            </p>
          </>
        )}

        <div className="wo-dial">
          {timed ? (
            <svg viewBox="0 0 240 240" className="ring" aria-hidden="true">
              <circle cx="120" cy="120" r={R} className="ring-bg" />
              <circle
                cx="120"
                cy="120"
                r={R}
                className="ring-fg"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - ringPct)}
                transform="rotate(-90 120 120)"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 240 240" className="ring" aria-hidden="true">
              <circle cx="120" cy="120" r={R} className="ring-bg" />
            </svg>
          )}
          <div className="dial-center">
            {timed ? (
              <>
                <span className="dial-big mono">{Math.max(0, Math.ceil(remaining))}</span>
                <span className="dial-unit">{isRest ? 'sec rest' : isPrep ? 'sec' : step.side ? `sec · ${step.side}` : 'seconds'}</span>
              </>
            ) : (
              <>
                <span className="dial-big mono">{step.reps}</span>
                <span className="dial-unit">{step.perSide ? 'reps each side' : 'reps'}</span>
                <span className="dial-sw mono">{fmt(stopwatch)}</span>
              </>
            )}
          </div>
        </div>

        {step.kind === 'work' && (
          <div className="wo-facts">
            <div><small>Set</small><b>{step.set} / {step.sets}</b></div>
            <div><small>{timed ? 'Time' : 'Reps'}</small><b>{describeTarget(step)}</b></div>
            <div><small>Rest after</small><b>{restAfter ? `${restAfter}s` : '—'}</b></div>
          </div>
        )}
        {step.note && <p className="wo-note">{step.note}</p>}

        {step.kind === 'work' && ex && <VariationPicker exId={ex.id} compact />}
        {step.kind === 'work' && variation && <p className="wo-cue muted small">{variation.cue}</p>}

        {isRest && (
          <div className="rest-adjust">
            <button className="chip-btn" onClick={() => addRest(-10)}>−10s</button>
            <button className="chip-btn" onClick={() => addRest(15)}>+15s</button>
          </div>
        )}
      </div>

      <footer className="wo-controls">
        {step.kind === 'work' && !timed && (
          <Button size="xl" className="w-full done-btn" icon="check" onClick={doneSet}>
            Set complete
          </Button>
        )}
        {!started && (timed || isPrep) && (
          <p className="muted small center">Tap play to start. The timer guides you from here.</p>
        )}
        <div className="ctrl-row">
          <button className="ctrl" onClick={prev} disabled={index === 0} aria-label="Previous step">
            <Icon name="prev" size={22} />
            <small>Prev</small>
          </button>
          <button className={`ctrl ctrl-main ${running ? 'running' : ''}`} onClick={toggleRun} aria-label={running ? 'Pause' : 'Start'}>
            <Icon name={running ? 'pause' : 'play'} size={34} />
          </button>
          <button className="ctrl" onClick={skip} aria-label={isRest ? 'Skip rest' : 'Next step'}>
            <Icon name="next" size={22} />
            <small>{isRest || isPrep ? 'Skip' : 'Next'}</small>
          </button>
        </div>
        <p className="safety-line">Pain or dizziness? Stop now. Your progress is saved.</p>
      </footer>

      <Sheet open={exitOpen} onClose={() => setExitOpen(false)} title="Leave mission?">
        <p className="muted">Your position is saved. You can resume this mission from the Home screen.</p>
        <div className="stack">
          <Button size="lg" className="w-full" onClick={saveAndExit}>Save & exit</Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={() => setExitOpen(false)}>Keep training</Button>
          <Button size="md" variant="danger" className="w-full" onClick={discard}>Abandon mission</Button>
          {index > steps.length * 0.6 && !profile.completedDays.has(day) && (
            <Button
              size="md"
              variant="ghost"
              className="w-full"
              onClick={() => {
                // Remaining work steps count as skipped.
                r.current.skipped += steps.slice(index).filter((x) => x.kind === 'work').length;
                setExitOpen(false);
                finish();
              }}
            >
              Finish early & claim mission
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
