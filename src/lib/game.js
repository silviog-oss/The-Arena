/**
 * Pure game-logic functions: state in → new state (+ result) out.
 * No React here, which keeps the rules easy to test and reuse.
 */
import { DAY_MAP, QUEST_XP } from '../data/program.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { deriveProfile, statGainsForDay, toDateKey, STAT_KEYS } from './progression.js';

/** Returns ids of newly unlocked achievements and the updated map. */
export function evaluateAchievements(state, last = null, today = toDateKey()) {
  const p = deriveProfile(state, today);
  const unlocked = { ...state.achievements };
  const fresh = [];
  for (const a of ACHIEVEMENTS) {
    if (unlocked[a.id]) continue;
    try {
      if (a.test({ p, s: state, last })) {
        unlocked[a.id] = Date.now();
        fresh.push(a.id);
      }
    } catch {
      /* ignore broken test */
    }
  }
  return { achievements: unlocked, fresh };
}

/**
 * Complete a day's main quest.
 * First completion grants XP + stats. Replays only add training time.
 */
export function completeDay(state, { day, seconds = 0, skipped = 0, now = new Date() }) {
  const def = DAY_MAP[day];
  const today = toDateKey(now);
  const before = deriveProfile(state, today);
  const already = !!state.completed[day];

  let next = { ...state, totalSeconds: (state.totalSeconds || 0) + seconds, activeWorkout: null };
  let xpGain = 0;
  let statGain = { STR: 0, END: 0, AGI: 0, VIT: 0 };

  if (already) {
    const c = state.completed[day];
    next.completed = { ...state.completed, [day]: { ...c, replays: (c.replays || 0) + 1 } };
  } else {
    xpGain = def.xp;
    statGain = statGainsForDay(def);
    const stats = { ...state.stats };
    for (const k of STAT_KEYS) stats[k] += statGain[k];
    next = {
      ...next,
      xp: state.xp + xpGain,
      stats,
      completed: {
        ...state.completed,
        [day]: { date: today, at: now.getTime(), xp: xpGain, seconds, stats: statGain, skipped },
      },
    };
  }

  const last = {
    at: now.getTime(),
    skipped,
    isMobility: def.type === 'mobility',
    gapBefore: before.streak.daysSinceLast ?? 0,
  };
  const { achievements, fresh } = evaluateAchievements(next, already ? null : last, today);
  next.achievements = achievements;
  const after = deriveProfile(next, today);

  return {
    state: next,
    result: {
      day,
      title: def.title,
      replay: already,
      xp: xpGain,
      stats: statGain,
      seconds,
      levelBefore: before.level,
      levelAfter: after.level,
      rankBefore: before.rank,
      rankAfter: after.rank,
      daysDone: after.daysDone,
      streak: after.streak.current,
      newAchievements: fresh,
    },
  };
}

/** Toggle an optional quest. XP is added or removed accordingly. */
export function toggleQuest(state, day, kind) {
  const q = state.quests[day] || { daily: false, bonus: false };
  const on = !q[kind];
  const delta = (on ? 1 : -1) * QUEST_XP[kind];
  const levelBefore = deriveProfile(state).level;
  const next = {
    ...state,
    xp: Math.max(0, state.xp + delta),
    quests: { ...state.quests, [day]: { ...q, [kind]: on } },
  };
  const { achievements, fresh } = evaluateAchievements(next);
  next.achievements = achievements;
  return { state: next, delta, fresh, levelUp: deriveProfile(next).level > levelBefore };
}
