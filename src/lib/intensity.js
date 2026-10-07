/**
 * Goal pace → training intensity.
 *
 * The user's goal pace (how fast they want to lose or gain weight) adapts the
 * 31-day program: sets, rest times and XP. Recovery days are never changed,
 * and the warm-up is always kept.
 *
 * Safety caps:
 *  - Weight loss: max 1 kg/week AND max 1% of body weight per week (whichever is lower).
 *  - Weight gain: max 0.5 kg/week (faster gain is mostly fat, not muscle).
 *  - Under 18: only the two gentlest paces.
 */
import { DAY_MAP } from '../data/program.js';
import { EXERCISE_MAP } from '../data/exercises.js';

export const PACES = {
  lose: [
    { id: 'relaxed', label: 'Relaxed', kgPerWeek: 0.25, intensity: 'easy' },
    { id: 'steady', label: 'Steady', kgPerWeek: 0.5, intensity: 'normal', recommended: true },
    { id: 'fast', label: 'Fast', kgPerWeek: 0.75, intensity: 'hard' },
    { id: 'max', label: 'Max safe', kgPerWeek: 1.0, intensity: 'intense' },
  ],
  gain: [
    { id: 'relaxed', label: 'Lean', kgPerWeek: 0.1, intensity: 'easy' },
    { id: 'steady', label: 'Steady', kgPerWeek: 0.25, intensity: 'normal', recommended: true },
    { id: 'fast', label: 'Fast', kgPerWeek: 0.5, intensity: 'hard' },
  ],
};

/** Absolute safe max kg/week for this person. */
export function maxSafeRate(direction, weightKg) {
  if (direction === 'gain') return 0.5;
  return Math.min(1, Math.round(weightKg * 0.01 * 100) / 100);
}

/** Paces available for this person, with unsafe ones flagged. */
export function pacesFor(direction, weightKg, age) {
  const list = PACES[direction] || [];
  const cap = maxSafeRate(direction, weightKg);
  return list.map((p, i) => {
    const kg = Math.min(p.kgPerWeek, cap);
    const youthBlocked = age != null && age < 18 && i > 1;
    return { ...p, kgPerWeek: kg, capped: kg < p.kgPerWeek, disabled: youthBlocked };
  });
}

/**
 * Intensity modes. setsDelta is applied by exercise category,
 * restDelta (seconds) to every work-set rest.
 */
export const INTENSITY = {
  easy: {
    id: 'easy',
    label: 'Easier',
    tone: 'ok',
    xpMult: 1,
    restDelta: 15,
    sets: { strength: -1, conditioning: -1 },
    summary: '−1 set on bigger exercises · +15s rest',
    warning: 'Workouts get easier: fewer sets and longer rests. Results come slower but are easier to stick with.',
  },
  normal: {
    id: 'normal',
    label: 'Standard',
    tone: 'muted',
    xpMult: 1,
    restDelta: 0,
    sets: {},
    summary: 'The program as designed',
    warning: 'Workouts stay as designed. This is the recommended balance of results and recovery.',
  },
  hard: {
    id: 'hard',
    label: 'Harder',
    tone: 'warn',
    xpMult: 1.1,
    restDelta: -10,
    sets: { conditioning: 1 },
    summary: '+1 set on conditioning · −10s rest · +10% XP',
    warning: 'Workouts get harder: an extra conditioning set and shorter rests. Expect more fatigue — sleep and eat enough protein.',
  },
  intense: {
    id: 'intense',
    label: 'Intense',
    tone: 'danger',
    xpMult: 1.2,
    restDelta: -15,
    sets: { conditioning: 1, strength: 1 },
    summary: '+1 set on strength & conditioning · −15s rest · +20% XP',
    warning:
      'Workouts get much harder: extra sets on most exercises and short rests. This is the upper safe limit — do not combine it with very low-calorie diets. Drop to a slower pace if you feel run down, dizzy or sore for days.',
  },
};

/** Gain goals favour strength volume over cardio. */
const GAIN_SETS = {
  easy: { conditioning: -1 },
  normal: { strength: 0 },
  hard: { strength: 1, conditioning: -1 },
};

export function intensityFor(body) {
  const g = body?.goal;
  if (!g?.pace) return INTENSITY.normal;
  const direction = g.direction || (g.weightKg < g.startKg ? 'lose' : 'gain');
  const pace = (PACES[direction] || []).find((p) => p.id === g.pace);
  const base = INTENSITY[pace?.intensity] || INTENSITY.normal;
  if (direction === 'gain') {
    return {
      ...base,
      sets: GAIN_SETS[base.id] || {},
      summary: base.id === 'hard' ? '+1 strength set · −1 cardio set · −10s rest · +10% XP' : base.id === 'easy' ? '−1 cardio set · +15s rest' : base.summary,
    };
  }
  return base;
}

const CATEGORY = (exId) => {
  const c = EXERCISE_MAP[exId]?.category;
  if (c === 'Conditioning') return 'conditioning';
  if (c === 'Mobility') return 'mobility';
  return 'strength'; // Push, Pull, Legs, Core
};

/** Returns a copy of the day adapted to the intensity (recovery days unchanged). */
export function adaptDay(def, intensity = INTENSITY.normal) {
  if (!def || intensity.id === 'normal' || def.type === 'mobility') return { ...def, intensity: intensity.id };
  const items = def.items.map((it) => {
    const delta = intensity.sets[CATEGORY(it.ex)] || 0;
    const sets = Math.max(1, Math.min(6, it.sets + (it.sets >= 3 || delta > 0 ? delta : 0)));
    const rest = it.rest > 0 ? Math.max(20, it.rest + intensity.restDelta) : 0;
    return { ...it, sets, rest, adapted: sets !== it.sets || rest !== it.rest, baseSets: it.sets };
  });
  const xp = Math.round((def.xp * intensity.xpMult) / 5) * 5;
  return { ...def, items, xp, baseXp: def.xp, intensity: intensity.id };
}

/**
 * New Game+ scaling. Each cycle after the first: +20% reps, +15% time, +15% XP
 * (capped at cycle 3 levels: +40% reps, +30% time, +30% XP). Recovery days unchanged.
 */
export function cycleScale(cycle = 1) {
  const c = Math.min(Math.max(1, cycle), 3) - 1;
  return { reps: 1 + 0.2 * c, time: 1 + 0.15 * c, xp: 1 + 0.15 * c };
}

export function scaleForCycle(def, cycle = 1) {
  if (!def || cycle <= 1 || def.type === 'mobility') return { ...def, cycle };
  const k = cycleScale(cycle);
  const items = def.items.map((it) => ({
    ...it,
    reps: it.reps ? Math.round(it.reps * k.reps) : it.reps,
    time: it.time ? Math.round((it.time * k.time) / 5) * 5 : it.time,
  }));
  return { ...def, items, xp: Math.round((def.xp * k.xp) / 5) * 5, cycle };
}

export const dayFor = (day, body, cycle = 1) => scaleForCycle(adaptDay(DAY_MAP[day], intensityFor(body)), cycle);

/** Realistic timeline for a goal at a pace. */
export function goalTimeline(startKg, targetKg, kgPerWeek, from = new Date()) {
  const diff = Math.abs(targetKg - startKg);
  if (!kgPerWeek || diff === 0) return { weeks: 0, date: from, in31: 0 };
  const weeks = Math.ceil(diff / kgPerWeek);
  const date = new Date(from.getTime() + weeks * 7 * 86400000);
  const in31 = Math.min(diff, Math.round(kgPerWeek * (31 / 7) * 10) / 10);
  return { weeks, date, in31 };
}
