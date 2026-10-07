import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { DAY_MAP, WARMUP, phaseForDay } from '../data/program.js';
import { variationNeedsDb, hasDumbbells } from '../lib/modifiers.js';
import { estimateMinutes, variationMultiplier } from '../lib/progression.js';
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
import ExerciseHelp from '../components/ExerciseHelp.jsx';
import ExerciseFigure from '../components/ExerciseFigure.jsx';
import { ReplaceExercise } from '../components/Training.jsx';

const fmt = (s) => {
  const v = Math.max(0, Math.ceil(s));
  return `${Math.floor(v / 60)}:${String(v % 60).padStart(2, '0')}`;
};

export default function Workout({ day, resume, nav }) {
  const { state, actions, variationFor, profile, dayFor } = useGame();
  const def = useMemo(() => dayFor(day), [dayFor, day]);
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
  const [helpOpen, setHelpOpen] = useState(false);
  const [wasRunning, setWasRunning] = useState(false);
  // stepIndex → variation level actually used ('beginner' | 'standard' | 'advanced')
  const levelsRef = useRef(saved?.levels || {});
  // stepIndex → logged set { exId, variation, level, reps, time, kg, amrap, warmup, skipped }
  const logRef = useRef(saved?.log || {});
  const [repsDone, setRepsDone] = useState(null); // reps adjust for the current rep set
  const [, force] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const [gateOpen, setGateOpen] = useState(true);

  const s = state.settings;
  const step = steps[index];
  const ex = step.exId ? EXERCISE_MAP[step.exId] : null;
  const nextEx = step.nextExId ? EXERCISE_MAP[step.nextExId] : null;
  const variation = ex ? ex.variations[variationFor(ex.id)] : null;
  const workDone = steps.slice(0, index).filter((x) => x.kind === 'work').length;

  useWakeLock(running && s.keepAwake);

  // Refs so the interval always sees fresh values.
  const r = useRef({});
  r.current = { index, remaining, running, steps, elapsed, skipped, s, variationFor, repsDone };

  const feedback = useCallback((kind) => {
    const st = r.current.s;
    if (st.sound) sounds[kind]?.();
    if (st.vibration) vibrate(kind === 'go' ? [80, 60, 80] : kind === 'tick' ? 30 : kind === 'complete' ? [100, 50, 100, 50, 200] : 120);
  }, []);

  const persist = useCallback(
    (i, secs, sk) =>
      actions.setActive({ day, step: i, seconds: Math.round(secs), skipped: sk, levels: levelsRef.current, log: logRef.current, updatedAt: Date.now() }),
    [actions, day],
  );

  const finish = useCallback(() => {
    if (finishing) return;
    setFinishing(true);
    setRunning(false);
    feedback('complete');
    const result = actions.completeDay({
      day,
      seconds: Math.round(r.current.elapsed),
      skipped: r.current.skipped,
      levels: Object.values(levelsRef.current),
      log: Object.keys(logRef.current).sort((a, b) => a - b).map((k) => logRef.current[k]),
    });
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
    (i, { auto = false, skipped: wasSkipped = false } = {}) => {
      const list = r.current.steps;
      // Moving forward off a completed work set → remember which variation was used.
      const cur = list[r.current.index];
      if (i > r.current.index && cur?.kind === 'work') {
        const ex = EXERCISE_MAP[cur.exId];
        const v = ex.variations[r.current.variationFor(cur.exId)];
        if (!cur.warmup) {
          if (wasSkipped) delete levelsRef.current[r.current.index];
          else levelsRef.current[r.current.index] = v.level;
        }
        // Log the set for history + personal records.
        const kg = variationNeedsDb(v) && hasDumbbells(r.current.s) ? r.current.s.dbWeights?.[cur.exId] || null : null;
        const amrap = !!(cur.note && /max reps/i.test(cur.note));
        logRef.current[r.current.index] = {
          exId: cur.exId,
          variation: v.name,
          level: v.level,
          reps: cur.reps ? (r.current.repsDone ?? cur.reps) : amrap ? logRef.current[r.current.index]?.reps || 0 : null,
          time: cur.time || null,
          kg,
          amrap,
          warmup: !!cur.warmup,
          skipped: wasSkipped,
        };
      }
      if (i >= list.length) {
        finish();
        return;
      }
      const target = Math.max(0, i);
      setIndex(target);
      setRemaining(list[target].time || 0);
      setStopwatch(0);
      setRepsDone(null);
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
    goTo(index + 1, { auto: running, skipped: step.kind === 'work' });
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
  const warmCount = def.type === 'mobility' ? 0 : WARMUP.length;
  const dungeonNo = step.itemIndex - warmCount + 1;
  const pad2 = (n) => String(n).padStart(2, '0');
  const isRepSet = step.kind === 'work' && !timed;
  const shownReps = repsDone ?? step.reps;
  const needsDb = ex && variation && variationNeedsDb(variation) && hasDumbbells(s);
  const eq = s.equipment || {};
  const kg = needsDb ? s.dbWeights?.[ex.id] ?? 0 : 0;
  const kgStep = eq.dumbbells === 'adjustable' ? 0.5 : 1;
  const setKg = (v) => actions.setDbWeight(ex.id, Math.max(0, Math.min(eq.maxKg || 100, Math.round(v * 2) / 2)));
  const prevStep = steps[index - 1];
  const amrapPrev = isRest && prevStep?.kind === 'work' && prevStep.note && /max reps/i.test(prevStep.note) ? index - 1 : null;
  const amrapVal = amrapPrev != null ? logRef.current[amrapPrev]?.reps || 0 : 0;
  const setAmrap = (v) => {
    if (amrapPrev == null || !logRef.current[amrapPrev]) return;
    logRef.current[amrapPrev] = { ...logRef.current[amrapPrev], reps: Math.max(0, v) };
    force((x) => x + 1);
  };
  const [gate, setGate] = [gateOpen, setGateOpen];
  const phase = phaseForDay(day);

  if (gate) {
    const mods = def.mods || {};
    const gateLevels = def.items.flatMap((it) => Array(it.sets).fill(EXERCISE_MAP[it.ex].variations[variationFor(it.ex)].level));
    const gateXp = Math.max(5, Math.round((def.xp * variationMultiplier(gateLevels)) / 5) * 5);
    return (
      <div className="workout gate">
        <header className="wo-top">
          <button className="icon-btn" onClick={nav.pop} aria-label="Back"><Icon name="close" /></button>
          <span className="hdr-spacer" />
        </header>
        <div className="gate-body">
          <span className="eyebrow">Today’s mission</span>
          <div className={`gate-bar grade-${def.difficulty}`} aria-hidden="true"><span /></div>
          <div className={`gate-rank grade-${def.difficulty}`}>{def.difficulty}-RANK</div>
          <div className="gate-phase">{phase?.name}</div>
          <h1 className="gate-title">Day {day} · {def.title}</h1>
          <div className="gate-facts">
            <div><small>Estimated time</small><b>{estimateMinutes(def)} min</b></div>
            <div><small>Reward</small><b>{profile.completedDays.has(day) ? 'Replay' : `+${gateXp} XP`}</b></div>
            <div><small>Dungeons</small><b>{def.items.length}</b></div>
          </div>
          <div className="gate-mods">
            {mods.recovery && <span className="pill">🛡 Recovery Mode</span>}
            {mods.exhausted && !mods.recovery && <span className="pill">😴 Lightened (status: exhausted)</span>}
            {mods.overdrive && <span className="pill pill-od">🔥 Overdrive</span>}
            {def.cycle > 1 && <span className="pill">Cycle {def.cycle}</span>}
          </div>
        </div>
        <footer className="wo-controls">
          <Button
            size="xl"
            className="w-full gate-btn"
            onClick={() => {
              unlockAudio();
              setGateOpen(false);
              if (!started) toggleRun();
              else setRunning(true);
            }}
          >
            {saved ? 'Resume dungeon' : 'Enter dungeon'}
          </Button>
          <p className="safety-line">Pain or dizziness? Stop. Your progress is always saved.</p>
        </footer>
      </div>
    );
  }

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
        <button
          className="icon-btn help-btn"
          aria-label="How to do this exercise"
          onClick={() => {
            setWasRunning(running);
            setRunning(false); // pause while reading
            setHelpOpen(true);
          }}
        >
          ?
        </button>
      </header>

      <div className="wo-progress">
        <ProgressBar value={workDone} max={totalWork} height={6} label="Workout progress" />
        <span className="mono small muted">{workDone}/{totalWork} sets · {fmt(elapsed)}</span>
      </div>

      <div className="wo-body">
        <span className="wo-phase">
          {isPrep ? 'Get ready' : isRest ? 'Rest' : step.warmup ? 'Warm-up' : `Dungeon ${pad2(dungeonNo)} / ${pad2(def.items.length)}`}
        </span>

        {!isRest && !isPrep && ex && (
          <>
            <h1 className="wo-ex">{variation?.name || ex.name}</h1>
            <p className="wo-base muted">{ex.name}</p>
            <div className="set-pips" aria-label={`Set ${step.set} of ${step.sets}`}>
              {Array.from({ length: step.sets }, (_, i) => (
                <span key={i} className={i + 1 < step.set ? 'done' : i + 1 === step.set ? 'cur' : ''} />
              ))}
            </div>
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

        {(isRest || isPrep) && nextEx && (
          <button className="next-fig" onClick={() => { setWasRunning(running); setRunning(false); setHelpOpen(true); }} aria-label="How to do the next exercise">
            <ExerciseFigure id={nextEx.id} size={150} />
          </button>
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
                <span className="dial-big mono">{shownReps}</span>
                <span className="dial-unit">{step.perSide ? 'reps each side' : 'reps'}{shownReps !== step.reps ? ` · target ${step.reps}` : ''}</span>
                <span className="dial-sw mono">{fmt(stopwatch)}</span>
              </>
            )}
          </div>
        </div>

        {isRepSet && !step.warmup && (
          <div className="reps-adjust" aria-label="Reps you actually did">
            <button className="chip-btn" onClick={() => setRepsDone(Math.max(0, shownReps - 1))} aria-label="One rep less">−1</button>
            <span className="muted small">Did more or fewer? Adjust before tapping complete.</span>
            <button className="chip-btn" onClick={() => setRepsDone(shownReps + 1)} aria-label="One rep more">+1</button>
          </div>
        )}
        {needsDb && step.kind === 'work' && !step.warmup && (
          <div className="kg-adjust">
            <span className="muted small">Dumbbell</span>
            <button className="chip-btn" onClick={() => setKg(kg - kgStep)} aria-label="Lighter">−</button>
            <b className="mono">{kg ? `${kg} kg` : '— kg'}</b>
            <button className="chip-btn" onClick={() => setKg(kg + kgStep)} aria-label="Heavier" disabled={eq.maxKg != null && kg >= eq.maxKg}>+</button>
            {eq.maxKg != null && kg >= eq.maxKg && <small className="muted">your max</small>}
          </div>
        )}
        {amrapPrev != null && (
          <div className="amrap-log">
            <b>How many reps did you get?</b>
            <div className="reps-adjust">
              <button className="chip-btn" onClick={() => setAmrap(amrapVal - 5)}>−5</button>
              <button className="chip-btn" onClick={() => setAmrap(amrapVal - 1)}>−1</button>
              <b className="mono amrap-val">{amrapVal}</b>
              <button className="chip-btn" onClick={() => setAmrap(amrapVal + 1)}>+1</button>
              <button className="chip-btn" onClick={() => setAmrap(amrapVal + 5)}>+5</button>
            </div>
          </div>
        )}
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

      <Sheet
        open={helpOpen}
        onClose={() => {
          setHelpOpen(false);
          if (wasRunning) setRunning(true);
        }}
        title={(ex || nextEx)?.name || 'How to'}
      >
        <ExerciseHelp exId={(ex || nextEx)?.id} />
        {(() => {
          const st = ex ? step : step.nextStep;
          const item = st ? def.items[st.itemIndex - warmCount] : null;
          if (!item || st?.warmup) return null;
          return (
            <details className="help-replace">
              <summary>Can’t do this exercise? Replace it</summary>
              <ReplaceExercise original={item.subFrom || item.ex} onDone={() => setHelpOpen(false)} />
            </details>
          );
        })()}
        <p className="muted small center">{wasRunning ? 'Timer paused — closing resumes it.' : 'Timer is paused.'}</p>
      </Sheet>

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
