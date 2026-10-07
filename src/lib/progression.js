import { EXERCISE_MAP } from '../data/exercises.js';
import { WARMUP, QUEST_XP, TOTAL_DAYS } from '../data/program.js';
import { goalProgress } from './body.js';

/* ─────────────────────────── LEVELS ───────────────────────────
 * XP needed to REACH level n:  100·(n−1)² + 400·(n−1)
 *   L1 0 · L2 500 · L3 1,200 · L4 2,100 · L5 3,200 · L6 4,500
 *   L7 6,000 · L8 7,700 · L9 9,600 · L10 11,700 · L11 14,000 …
 * Completing all 31 main missions = 6,310 XP → Level 7.
 * Adding every optional quest (+2,325 XP) → Level 8.
 * Levels keep going after Day 31 (replays don't grant XP, so
 * the cap is effectively set by the program).
 */
export const MAX_LEVEL = 50;
export const xpForLevel = (n) => 100 * (n - 1) ** 2 + 400 * (n - 1);

export function levelFromXp(xp) {
  let lvl = 1;
  while (lvl < MAX_LEVEL && xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}

export function levelProgress(xp) {
  const level = levelFromXp(xp);
  const base = xpForLevel(level);
  const next = xpForLevel(level + 1);
  return {
    level,
    current: xp - base,
    needed: next - base,
    toNext: next - xp,
    nextTotal: next,
    pct: Math.min(100, ((xp - base) / (next - base)) * 100),
  };
}

/* ─────────────────────────── RANKS ───────────────────────────
 * Rank is earned through BOTH level and proven work (workouts
 * completed + specific trial days cleared). Skipping ahead in the
 * calendar does not rank you up — finishing the work does.
 */
export const RANKS = [
  { id: 'E', name: 'E-Rank', title: 'Awakened Novice', color: '#8a94a6', minLevel: 1, minWorkouts: 0, trial: null,
    perk: 'The System recognizes you. Learn the movements.' },
  { id: 'D', name: 'D-Rank', title: 'Gate Runner', color: '#4fb3a9', minLevel: 2, minWorkouts: 6, trial: 7,
    perk: 'Cleared the Gate of Awakening. Dumbbell missions unlocked.' },
  { id: 'C', name: 'C-Rank', title: 'Proven Hunter', color: '#5b8cff', minLevel: 3, minWorkouts: 12, trial: 14,
    perk: 'Defeated the Gatekeeper. Split training begins.' },
  { id: 'B', name: 'B-Rank', title: 'Elite Hunter', color: '#8b6cff', minLevel: 4, minWorkouts: 18, trial: 21,
    perk: 'Passed the Elite Trial. Shadow Training opens.' },
  { id: 'A', name: 'A-Rank', title: 'Shadow Vanguard', color: '#c26bff', minLevel: 5, minWorkouts: 24, trial: 26,
    perk: 'Survived the Shadow Trial. S-Rank is earned only by reaching your goal.' },
  { id: 'S', name: 'S-Rank', title: 'Sovereign', color: '#ffcf5c', minLevel: 8, minWorkouts: 31, trial: 31, special: 'goal',
    perk: 'You reached your goal. Few hunters ever get here.' },
];

/**
 * Requirement checklist for a rank. ctx comes from deriveProfile().
 * S-Rank is about real-world results: it needs you to be close to (or at)
 * your goal — or, with no goal set, two full cycles plus a measured improvement.
 */
export function rankRequirements(r, ctx) {
  const reqs = [{ label: `Reach Level ${r.minLevel}`, ok: ctx.level >= r.minLevel }];
  if (r.special === 'goal') {
    reqs.push({ label: 'Clear Day 31 (Rank Advancement Trial)', ok: ctx.cleared31 });
    if (ctx.goal) {
      reqs.push({
        label: ctx.goal.reached ? 'Goal reached' : `Get within 10% of your goal (now ${Math.round(ctx.goal.pct)}%)`,
        ok: ctx.goal.reached || ctx.goal.pct >= 90,
      });
    } else {
      reqs.push({ label: `Complete 2 full cycles (${Math.min(ctx.totalWorkouts, 62)}/62 missions)`, ok: ctx.totalWorkouts >= 62 });
      reqs.push({ label: 'Improve a stat in a re-evaluation — or set a goal', ok: ctx.retestImproved });
    }
    return reqs;
  }
  reqs.push({ label: `${r.minWorkouts} missions completed`, ok: ctx.completedDays.size >= r.minWorkouts });
  if (r.trial) reqs.push({ label: `Clear Day ${r.trial}`, ok: ctx.completedDays.has(r.trial), day: r.trial });
  return reqs;
}

export function rankFor(level, completedDays, extra = {}) {
  const set = completedDays instanceof Set ? completedDays : new Set(completedDays);
  const ctx = { level, completedDays: set, cleared31: set.has(31), totalWorkouts: set.size, goal: null, retestImproved: false, ...extra };
  let rank = RANKS[0];
  for (const r of RANKS) {
    if (rankRequirements(r, ctx).every((q) => q.ok)) rank = r;
  }
  return rank;
}

export function nextRank(rank) {
  const i = RANKS.findIndex((r) => r.id === rank.id);
  return RANKS[i + 1] || null;
}

/* ─────────────────────────── STATS ─────────────────────────── */
export const STAT_KEYS = ['STR', 'END', 'AGI', 'VIT'];
export const STAT_INFO = {
  STR: { name: 'Strength', color: '#ff6b6b', desc: 'Push, pull, squat and press work.' },
  END: { name: 'Endurance', color: '#4fd1c5', desc: 'Conditioning and cardio intervals.' },
  AGI: { name: 'Agility', color: '#ffd166', desc: 'Explosive, coordination and mobility work.' },
  VIT: { name: 'Vitality', color: '#8b6cff', desc: 'Core stability, legs and recovery.' },
};
export const BASE_STATS = { STR: 0, END: 0, AGI: 0, VIT: 0 }; // set by Mission 0

/** Stat gains for a training day (warm-up excluded). */
export function statGainsForDay(dayDef) {
  const g = { STR: 0, END: 0, AGI: 0, VIT: 0 };
  for (const item of dayDef.items) {
    const ex = EXERCISE_MAP[item.ex];
    if (!ex) continue;
    for (const k of STAT_KEYS) g[k] += (ex.stats[k] || 0) * item.sets;
  }
  for (const k of STAT_KEYS) g[k] = Math.round(g[k]);
  return g;
}

/* ─────────────────────────── DURATION ─────────────────────────── */
export function itemsWithWarmup(dayDef) {
  return dayDef.type === 'mobility' ? dayDef.items : [...WARMUP, ...dayDef.items];
}

export function estimateMinutes(dayDef) {
  let sec = 10; // prep countdown
  const items = itemsWithWarmup(dayDef);
  items.forEach((item, idx) => {
    const ex = EXERCISE_MAP[item.ex];
    const sides = ex?.perSide ? 2 : 1;
    const work = item.time ? item.time * sides : item.reps * (ex?.secPerRep || 3) * sides;
    sec += work * item.sets + 5 * item.sets; // + transition time
    const isLast = idx === items.length - 1;
    sec += item.rest * (isLast ? item.sets - 1 : item.sets);
  });
  return Math.max(5, Math.round(sec / 60));
}

/* ─────────────────────────── STREAKS ─────────────────────────── */
export const toDateKey = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};
const keyToDate = (k) => {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const dayDiff = (a, b) => Math.round((keyToDate(b) - keyToDate(a)) / 86400000);

/**
 * Streak = consecutive calendar days with at least one completed mission.
 * Current streak stays alive until the end of the day after your last workout.
 * Missing a day resets the streak only — never the program progress.
 */
export function computeStreaks(completed, today = toDateKey(), pastDates = []) {
  const dates = [...new Set([...pastDates, ...Object.values(completed).map((c) => c.date)])].sort();
  if (!dates.length) return { current: 0, longest: 0, activeToday: false, dates };
  let longest = 1;
  let run = 1;
  for (let i = 1; i < dates.length; i++) {
    run = dayDiff(dates[i - 1], dates[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  const last = dates[dates.length - 1];
  const gap = dayDiff(last, today);
  const current = gap <= 1 ? run : 0;
  return { current, longest, activeToday: gap === 0, dates, lastDate: last, daysSinceLast: gap };
}

/* ─────────────────────────── DERIVED PROFILE ─────────────────────────── */
export function deriveProfile(state, today = toDateKey()) {
  const completedDays = new Set(Object.keys(state.completed).map(Number));
  const lp = levelProgress(state.xp);
  // Rank never drops when a new cycle starts.
  const evals = state.evaluations || [];
  const rankCtx = {
    level: lp.level,
    completedDays,
    cleared31: completedDays.has(31) || (state.cycles || []).length > 0,
    totalWorkouts: (state.pastWorkouts || 0) + completedDays.size,
    goal: goalProgress(state.profile?.body),
    retestImproved:
      evals.length >= 2 && Object.keys(evals[evals.length - 1].scores).some((k) => evals[evals.length - 1].scores[k] > evals[0].scores[k]),
  };
  const earned = rankFor(lp.level, completedDays, rankCtx);
  const floor = RANKS[state.rankFloor || 0];
  const rank = RANKS.indexOf(earned) >= RANKS.indexOf(floor) ? earned : floor;
  const streak = computeStreaks(state.completed, today, [...(state.pastDates || []), ...(state.restDays || [])]);
  const past = state.pastQuests || { total: 0, daily: 0, food: 0 };
  let nextDay = 1;
  while (completedDays.has(nextDay) && nextDay <= TOTAL_DAYS) nextDay++;
  const questCount = past.total + Object.values(state.quests).reduce((n, q) => n + (q.daily ? 1 : 0) + (q.bonus ? 1 : 0) + (q.food ? 1 : 0), 0);
  const foodCount = past.food + Object.values(state.quests).filter((q) => q.food).length;
  const dailyCount = past.daily + Object.values(state.quests).filter((q) => q.daily).length;
  const doneToday = Object.values(state.completed).some((c) => c.date === today);
  return {
    ...lp,
    rank,
    next: nextRank(rank),
    streak,
    completedDays,
    daysDone: completedDays.size,
    cycle: state.cycle || 1,
    rankCtx,
    evaluated: (state.evaluations || []).length > 0 || !!state.evalSkipped,
    evaluations: state.evaluations || [],
    totalWorkouts: (state.pastWorkouts || 0) + completedDays.size,
    nextDay: nextDay > TOTAL_DAYS ? null : nextDay,
    programComplete: completedDays.size >= TOTAL_DAYS,
    questCount,
    dailyCount,
    foodCount,
    doneToday,
    totalMinutes: Math.round((state.totalSeconds || 0) / 60),
  };
}

/* ─────────────────────────── VARIATION XP ───────────────────────────
 * XP scales with the variation actually used for each completed set.
 */
export const LEVEL_XP_MULT = { beginner: 0.8, standard: 1, advanced: 1.25 };
export function variationMultiplier(levels) {
  if (!levels || !levels.length) return 1;
  const sum = levels.reduce((n, l) => n + (LEVEL_XP_MULT[l] ?? 1), 0);
  return Math.round((sum / levels.length) * 100) / 100;
}

export { QUEST_XP };
