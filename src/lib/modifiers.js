/**
 * Everything that changes a day's workout before you do it, applied in order:
 *   1. Exercise substitutions ("Can't do this exercise?")
 *   2. Goal pace intensity            (intensity.js)
 *   3. New Game+ cycle scaling        (intensity.js)
 *   4. Recovery Mode / Hunter Status  (this file)
 *
 * Plus helpers for the equipment profile and recovery advice.
 */
import { DAY_MAP } from '../data/program.js';
import { EXERCISE_MAP } from '../data/exercises.js';
import { adaptDay, intensityFor, scaleForCycle } from './intensity.js';
import { toDateKey } from './progression.js';

/* ───────── Substitutions ─────────
 * Alternatives that train roughly the same muscles / stats.
 */
export const SUBSTITUTES = {
  pushup: ['diamond_pushup', 'db_floor_press', 'pike_pushup'],
  diamond_pushup: ['pushup', 'db_floor_press'],
  pike_pushup: ['db_press', 'pushup'],
  db_press: ['pike_pushup', 'pushup'],
  db_floor_press: ['pushup', 'diamond_pushup'],
  db_row: ['reverse_snow_angel', 'superman'],
  superman: ['reverse_snow_angel', 'dead_bug'],
  reverse_snow_angel: ['superman', 'db_row'],
  squat: ['goblet_squat', 'wall_sit', 'lunge'],
  goblet_squat: ['squat', 'lunge', 'wall_sit'],
  lunge: ['squat', 'goblet_squat', 'wall_sit'],
  db_rdl: ['glute_bridge', 'superman'],
  glute_bridge: ['db_rdl', 'superman'],
  wall_sit: ['squat', 'goblet_squat'],
  calf_raise: ['jog_in_place', 'wall_sit'],
  plank: ['dead_bug', 'hollow_hold', 'bear_crawl'],
  side_plank: ['plank', 'dead_bug'],
  dead_bug: ['plank', 'hollow_hold'],
  hollow_hold: ['dead_bug', 'plank'],
  bear_crawl: ['plank', 'mountain_climber'],
  mountain_climber: ['high_knees', 'bear_crawl', 'plank'],
  jumping_jack: ['jog_in_place', 'shadow_box', 'high_knees'],
  high_knees: ['jog_in_place', 'jumping_jack', 'mountain_climber'],
  jog_in_place: ['jumping_jack', 'shadow_box', 'high_knees'],
  skater: ['lunge', 'jumping_jack', 'high_knees'],
  burpee: ['mountain_climber', 'db_thruster', 'squat'],
  db_thruster: ['burpee', 'squat', 'jumping_jack'],
  shadow_box: ['jumping_jack', 'jog_in_place'],
  inchworm: ['cat_cow', 'worlds_greatest'],
  arm_circles: ['cat_cow'],
  cat_cow: ['childs_pose', 'thoracic_rotation'],
  worlds_greatest: ['hip_flexor', 'deep_squat_hold'],
  hip_flexor: ['worlds_greatest', 'deep_squat_hold'],
  deep_squat_hold: ['hip_flexor', 'worlds_greatest'],
  hamstring_stretch: ['inchworm', 'childs_pose'],
  thoracic_rotation: ['cat_cow', 'childs_pose'],
  childs_pose: ['cat_cow', 'hamstring_stretch'],
};

export const substitutesFor = (exId) => (SUBSTITUTES[exId] || []).filter((id) => EXERCISE_MAP[id]);

/** Replace exercises the user swapped. Reps ↔ time are converted (~3 s per rep). */
export function applySubs(def, subs = {}) {
  if (!def || !subs || !Object.keys(subs).length) return def;
  const items = def.items.map((it) => {
    const to = subs[it.ex];
    if (!to || !EXERCISE_MAP[to]) return it;
    const target = EXERCISE_MAP[to];
    const next = { ...it, ex: to, subFrom: it.ex };
    if (it.reps && target.type === 'time') {
      next.time = Math.max(15, Math.round((it.reps * 3) / 5) * 5);
      delete next.reps;
    } else if (it.time && target.type === 'reps' && !it.note) {
      next.reps = Math.max(5, Math.round(it.time / 3));
      delete next.time;
    }
    return next;
  });
  return { ...def, items };
}

/* ───────── Equipment profile ───────── */
export const DB_SETUPS = [
  { id: 'none', label: 'No dumbbells' },
  { id: 'fixed', label: 'Fixed dumbbells' },
  { id: 'adjustable', label: 'Adjustable dumbbells' },
];

/** Does this variation need dumbbells? */
export const variationNeedsDb = (v) => !!v && /\bDB\b/.test(v.name) && !/^No-DB/.test(v.name);

export const hasDumbbells = (settings) => (settings?.equipment?.dumbbells || 'fixed') !== 'none';

/* ───────── Hunter Status (daily readiness) ───────── */
export const READINESS = [
  { id: 'exhausted', emoji: '😴', label: 'Exhausted', effect: 'Lighter workout: −1 set, longer rests' },
  { id: 'normal', emoji: '😐', label: 'Normal', effect: 'Workout as planned' },
  { id: 'good', emoji: '⚡', label: 'Good', effect: 'Workout as planned' },
  { id: 'excellent', emoji: '🔥', label: 'Excellent', effect: 'Overdrive challenge available' },
];

/* ───────── Recovery Mode / readiness / overdrive modifiers ───────── */
function lighten(def) {
  const items = def.items.map((it) => {
    const sets = it.sets >= 2 ? it.sets - 1 : it.sets;
    const rest = it.rest > 0 ? it.rest + 15 : 0;
    return { ...it, sets, rest, baseSets: it.baseSets ?? it.sets };
  });
  return { ...def, items, xp: Math.max(10, Math.round((def.xp * 0.9) / 5) * 5), lightened: true };
}

function overdrive(def) {
  let n = 0;
  const items = def.items.map((it) => {
    if (n >= 2) return it;
    n++;
    return { ...it, sets: Math.min(6, it.sets + 1), baseSets: it.baseSets ?? it.sets };
  });
  return { ...def, items, xp: Math.round((def.xp * 1.15) / 5) * 5, overdrive: true };
}

/** Today's modifiers from state: Recovery Mode, Hunter Status, Overdrive. */
export function dayMods(state, today = toDateKey()) {
  const r = state.readiness?.[today];
  const recovery = !!(state.recoveryMode && state.recoveryMode.remaining > 0);
  return {
    recovery,
    exhausted: r?.level === 'exhausted',
    overdrive: r?.level === 'excellent' && !!r?.overdrive && !recovery,
    readiness: r?.level || null,
  };
}

/** The full pipeline: the exact workout the user will do today. */
export function dayForState(day, state, today = toDateKey()) {
  const base = DAY_MAP[day];
  if (!base) return null;
  let def = applySubs(base, state.settings?.subs);
  def = adaptDay(def, intensityFor(state.profile?.body));
  def = scaleForCycle(def, state.cycle || 1);
  if (def.type !== 'mobility') {
    const m = dayMods(state, today);
    if (m.recovery || m.exhausted) def = lighten(def);
    else if (m.overdrive) def = overdrive(def);
    def = { ...def, mods: m };
  }
  return def;
}

/* ───────── Recovery advice ─────────
 * Simple, honest rules — not medical. Used for the prompts on Home / mission start.
 */
export function recoveryAdvice(state, profile, today = toDateKey()) {
  // Only count hard days (recovery/mobility sessions don't add fatigue).
  const dates = new Set([
    ...Object.entries(state.completed || {}).filter(([day]) => DAY_MAP[day]?.type !== 'mobility').map(([, c]) => c.date),
    ...(state.history || []).filter((h) => h.type && h.type !== 'mobility').map((h) => h.date),
  ]);
  // consecutive training days ending yesterday or today
  let streakDays = 0;
  const d = new Date();
  for (let i = 0; i < 14; i++) {
    const key = toDateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() - i));
    if (dates.has(key)) streakDays++;
    else if (i > 0) break;
  }
  const away = profile.streak.daysSinceLast ?? 0;
  const trainedToday = profile.doneToday;
  const restDays = state.restDays || [];
  const restToday = restDays.includes(today);
  const recentRest = restDays.filter((r) => (new Date(today) - new Date(r)) / 86400000 < 7).length;
  return {
    away: profile.totalWorkouts > 0 && away >= 3 ? away : 0, // missed 2+ days
    trainedToday,
    consecutive: streakDays,
    recommendRest: !trainedToday && !restToday && streakDays >= 4,
    canLogRest: !trainedToday && !restToday && recentRest < 2,
    restToday,
  };
}
