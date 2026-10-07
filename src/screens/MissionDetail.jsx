import { useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { recoveryAdvice } from '../lib/modifiers.js';
import { toDateKey } from '../lib/progression.js';
import { ReplaceExercise, HunterStatus } from '../components/Training.jsx';
import { DAY_MAP, TYPE_LABEL, WARMUP, phaseForDay } from '../data/program.js';
import { EXERCISE_MAP } from '../data/exercises.js';
import { estimateMinutes, statGainsForDay, STAT_KEYS, STAT_INFO, variationMultiplier, LEVEL_XP_MULT } from '../lib/progression.js';
import { describeItem } from '../lib/workout.js';
import { ScreenHeader, Panel, Button, DifficultyTag, Disclaimer, Sheet } from '../components/UI.jsx';
import { Icon } from '../components/Icons.jsx';
import VariationPicker from '../components/VariationPicker.jsx';
import ExerciseFigure from '../components/ExerciseFigure.jsx';
import QuestList from '../components/QuestList.jsx';

export default function MissionDetail({ day, nav }) {
  const { state, profile, dayFor, intensity, variationFor, actions } = useGame();
  const [replaceFor, setReplaceFor] = useState(null); // original exercise id
  const [prompt, setPrompt] = useState(null); // 'away' | 'again'
  const advice = recoveryAdvice(state, profile);
  const def = dayFor(day);
  // XP preview based on the variations currently selected (weighted by sets).
  const levels = def.items.flatMap((it) => {
    const ex = EXERCISE_MAP[it.ex];
    return Array(it.sets).fill(ex.variations[variationFor(it.ex)].level);
  });
  const varMult = variationMultiplier(levels);
  const xpNow = Math.max(5, Math.round((def.xp * varMult) / 5) * 5);
  const phase = phaseForDay(day);
  const done = profile.completedDays.has(day);
  const isNext = day === profile.nextDay;
  const needsEval = !profile.evaluated && !done;
  const locked = (!done && !isNext) || needsEval;
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
          <span><Icon name="bolt" size={16} /> +{xpNow} XP</span>
          {varMult !== 1 && (
            <span className={`xp-mult ${varMult > 1 ? 'up' : 'down'}`}>×{varMult} variations</span>
          )}
          {def.cycle > 1 && <span className="xp-mult up">Cycle {def.cycle}</span>}
        </div>
        {intensity.id !== 'normal' && def.type !== 'mobility' && (
          <p className={`adapt-line tone-${intensity.tone}`}>
            {intensity.label} difficulty (goal pace) · {intensity.summary}
          </p>
        )}
        {def.mods && (def.mods.recovery || def.mods.exhausted || def.mods.overdrive) && (
          <p className="adapt-line tone-ok">
            {def.mods.recovery ? '🛡 Recovery Mode: −1 set, +15 s rest' : def.mods.exhausted ? '😴 Lightened for today (status: exhausted)' : '🔥 Overdrive: +1 set on the first two exercises, +15% XP'}
          </p>
        )}
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

      <Panel title="Mission" action={<small className="muted">XP: Beg ×{LEVEL_XP_MULT.beginner} · Std ×1 · Adv ×{LEVEL_XP_MULT.advanced}</small>}>
        <ol className="ex-list">
          {def.items.map((item, i) => {
            const ex = EXERCISE_MAP[item.ex];
            return (
              <li key={i} className="ex-row">
                <div className="ex-row-top">
                  <button className="ex-name" onClick={() => nav.push({ name: 'exercise', id: ex.id })}>
                    <span className="ex-thumb"><ExerciseFigure id={ex.id} size={64} /></span>
                    <span>{ex.name} <span className="help-dot">?</span></span>
                  </button>
                  <span className="ex-target mono">
                    {describeItem(item, ex)}
                    {item.sets !== item.baseSets && item.baseSets != null && (
                      <small className={`set-delta ${item.sets > item.baseSets ? 'up' : 'down'}`}>
                        {item.sets > item.baseSets ? '+' : '−'}{Math.abs(item.sets - item.baseSets)}
                      </small>
                    )}
                  </span>
                </div>
                <div className="ex-row-sub muted small">
                  Rest {item.rest}s{item.note ? ` · ${item.note}` : ''} · {ex.equipment}
                </div>
                <VariationPicker exId={ex.id} />
                {(
                  <div className="replace-row">
                    {item.subFrom && <span className="muted small">Replaces {EXERCISE_MAP[item.subFrom].name}</span>}
                    <button className="link-btn small" onClick={() => setReplaceFor(item.subFrom || item.ex)}>
                      {item.subFrom ? 'Change replacement' : 'Can’t do this? Replace'}
                    </button>
                  </div>
                )}
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

      {!locked && def.type !== 'mobility' && !profile.doneToday && (
        <Panel title="⚔ Hunter Status">
          <HunterStatus compact />
        </Panel>
      )}

      <Sheet open={!!replaceFor} onClose={() => setReplaceFor(null)} title="Replace exercise">
        {replaceFor && <ReplaceExercise original={replaceFor} onDone={() => setReplaceFor(null)} />}
      </Sheet>

      <Sheet open={prompt === 'away'} onClose={() => setPrompt(null)} title={`You’ve been away ${advice.away} days`}>
        <p className="muted">Jumping straight back to full volume after a break is how injuries happen. Recovery Mode lightens your next 2 workouts (−1 set, +15 s rest) so you can ease back in.</p>
        <div className="stack">
          <Button size="lg" className="w-full" onClick={() => { actions.startRecoveryMode({ workouts: 2, reason: 'away' }); setPrompt(null); nav.replace({ name: 'workout', day }); }}>
            🛡 Enter Recovery Mode
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={() => { actions.markAwayHandled(); setPrompt(null); nav.replace({ name: 'workout', day }); }}>
            Resume normally
          </Button>
        </div>
      </Sheet>

      <Sheet open={prompt === 'again'} onClose={() => setPrompt(null)} title="Recovery recommended">
        <p className="muted">You already trained today. Doing another full mission adds fatigue without much extra benefit. Consider resting — tomorrow’s mission will feel better.</p>
        <div className="stack">
          <Button size="lg" className="w-full" onClick={() => { setPrompt(null); nav.pop(); }}>Rest instead</Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={() => { actions.startRecoveryMode({ workouts: 1, reason: 'double' }); setPrompt(null); nav.replace({ name: 'workout', day }); }}>
            Do a lighter version
          </Button>
          <Button size="md" variant="ghost" className="w-full" onClick={() => { setPrompt(null); nav.replace({ name: 'workout', day }); }}>
            Continue at full intensity
          </Button>
        </div>
      </Sheet>

      <div className="cta-bar">
        {needsEval ? (
          <Button size="lg" className="w-full" icon="play" onClick={() => nav.replace({ name: 'evaluation' })}>
            Complete Mission 0 first
          </Button>
        ) : locked ? (
          <Button size="lg" className="w-full" disabled icon="lock">
            Clear Day {profile.nextDay} first
          </Button>
        ) : otherActive ? (
          <Button size="lg" className="w-full" onClick={() => nav.replace({ name: 'workout', day: state.activeWorkout.day, resume: true })}>
            Resume Day {state.activeWorkout.day} first
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full"
            icon="play"
            onClick={() => {
              const today = toDateKey();
              if (!activeHere && !done && advice.away && !state.recoveryMode && state.awayHandled !== today) setPrompt('away');
              else if (!activeHere && advice.trainedToday) setPrompt('again');
              else nav.replace({ name: 'workout', day, resume: activeHere });
            }}
          >
            {activeHere ? 'Resume mission' : done ? 'Replay mission (no XP)' : 'Start mission'}
          </Button>
        )}
      </div>
    </div>
  );
}
