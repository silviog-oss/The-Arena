/**
 * Pure game-logic functions: state in → new state (+ result) out.
 * No React here, which keeps the rules easy to test and reuse.
 */
import { QUEST_XP } from '../data/program.js';
import { dayForState } from './modifiers.js';
import { mergeRecords, candidatesFromLog, candidatesFromEvaluation, isCelebrated } from './records.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { scoreEvaluation, recommendedExperience, EVAL_XP } from './evaluation.js';
import { deriveProfile, statGainsForDay, toDateKey, STAT_KEYS, variationMultiplier, RANKS } from './progression.js';

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
export function completeDay(state, { day, seconds = 0, skipped = 0, levels = null, log = null, now = new Date() }) {
  const today = toDateKey(now);
  const def = dayForState(day, state, today); // subs + goal pace + cycle + recovery/readiness
  const varMult = levels ? variationMultiplier(levels) : 1;
  const before = deriveProfile(state, today);
  const already = !!state.completed[day];

  let next = { ...state, totalSeconds: (state.totalSeconds || 0) + seconds, activeWorkout: null };
  let xpGain = 0;
  let statGain = { STR: 0, END: 0, AGI: 0, VIT: 0 };

  if (already) {
    const c = state.completed[day];
    next.completed = { ...state.completed, [day]: { ...c, replays: (c.replays || 0) + 1 } };
  } else {
    xpGain = Math.max(5, Math.round((def.xp * varMult) / 5) * 5);
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

  // Workout history (every finish, including replays)
  const entry = {
    at: now.getTime(),
    date: today,
    day,
    cycle: state.cycle || 1,
    title: def.title,
    type: def.type,
    xp: xpGain,
    seconds,
    stats: statGain,
    skipped,
    replay: already,
    mods: def.mods || null,
    sets: (log || []).filter((x) => x && !x.warmup).map((x) => ({
      exId: x.exId, variation: x.variation, level: x.level, reps: x.reps || null, time: x.time || null, kg: x.kg || null, skipped: !!x.skipped,
    })),
  };
  next.history = [...(state.history || []), entry].slice(-1000);

  // Personal records
  const merged = mergeRecords(state.records, candidatesFromLog(log || [], today), now);
  next.records = merged.records;
  const newRecords = merged.fresh.filter((k) => isCelebrated(k, merged.records[k]));

  // Recovery Mode counts down per completed (non-replay) training workout
  if (!already && state.recoveryMode?.remaining > 0 && def.type !== 'mobility') {
    const remaining = state.recoveryMode.remaining - 1;
    next.recoveryMode = remaining > 0 ? { ...state.recoveryMode, remaining } : null;
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
      baseXp: def.xp,
      varMult,
      cycle: state.cycle || 1,
      stats: statGain,
      seconds,
      levelBefore: before.level,
      levelAfter: after.level,
      rankBefore: before.rank,
      rankAfter: after.rank,
      daysDone: after.daysDone,
      streak: after.streak.current,
      newAchievements: fresh,
      newRecords,
      records: next.records,
      mods: def.mods || null,
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

/**
 * Start the next cycle (New Game+). Keeps XP, level, stats, achievements,
 * rank (as a floor), streak history and body/goal data. Resets day progress.
 */
export function startNextCycle(state, now = new Date()) {
  const p = deriveProfile(state);
  if (!p.programComplete) return state;
  const dates = Object.values(state.completed).map((c) => c.date);
  const q = Object.values(state.quests);
  const past = state.pastQuests || { total: 0, daily: 0, food: 0 };
  const next = {
    ...state,
    cycle: (state.cycle || 1) + 1,
    pastDates: [...(state.pastDates || []), ...dates].slice(-800),
    pastWorkouts: (state.pastWorkouts || 0) + p.daysDone,
    pastQuests: {
      total: past.total + q.reduce((n, x) => n + (x.daily ? 1 : 0) + (x.food ? 1 : 0) + (x.bonus ? 1 : 0), 0),
      daily: past.daily + q.filter((x) => x.daily).length,
      food: past.food + q.filter((x) => x.food).length,
    },
    rankFloor: Math.max(state.rankFloor || 0, RANKS.indexOf(p.rank)),
    cycles: [...(state.cycles || []), { cycle: state.cycle || 1, finishedAt: now.getTime(), xp: state.xp }],
    completed: {},
    quests: {},
    activeWorkout: null,
  };
  const { achievements } = evaluateAchievements(next, null, toDateKey(now));
  next.achievements = achievements;
  return next;
}

/**
 * Mission 0 — record an evaluation.
 * Initial: scores become the starting stats. Retest: improvements over the
 * previous test are added to stats ("breakthroughs").
 */
export function completeEvaluation(state, { raw, applyExperience = true, now = new Date() }) {
  const list = state.evaluations || [];
  const kind = list.length ? 'retest' : 'initial';
  const scores = scoreEvaluation(raw);
  const prev = list[list.length - 1]?.scores || null;
  const before = deriveProfile(state, toDateKey(now));
  const stats = { ...state.stats };
  const gains = { STR: 0, END: 0, AGI: 0, VIT: 0 };
  for (const k of STAT_KEYS) {
    gains[k] = kind === 'initial' ? scores[k] : Math.max(0, scores[k] - (prev?.[k] || 0));
    stats[k] += gains[k];
  }
  const xp = EVAL_XP[kind];
  const recommended = recommendedExperience(raw);
  const merged = mergeRecords(state.records, candidatesFromEvaluation(raw, toDateKey(now)), now);
  let next = {
    ...state,
    xp: state.xp + xp,
    stats,
    evalSkipped: false,
    records: merged.records,
    evaluations: [...list, { at: now.getTime(), date: toDateKey(now), kind, raw, scores }],
  };
  if (kind === 'initial' && applyExperience) {
    next = { ...next, profile: { ...next.profile, experience: recommended }, settings: { ...next.settings, variations: {} } };
  }
  const { achievements, fresh } = evaluateAchievements(next, null, toDateKey(now));
  next.achievements = achievements;
  const after = deriveProfile(next, toDateKey(now));
  return {
    state: next,
    result: {
      kind, scores, prev, gains, xp, recommended, levelBefore: before.level, levelAfter: after.level,
      raw, first: list[0] || null, newRecords: kind === 'retest' ? merged.fresh : [],
    },
  };
}

/** Skip Mission 0: neutral starting stats so the program can begin. */
export function skipEvaluation(state) {
  return { ...state, evalSkipped: true, stats: { STR: 5, END: 5, AGI: 5, VIT: 5 } };
}

/* ───────── Recovery & readiness ───────── */

/** Hunter Status check-in for today. */
export function setReadiness(state, level, { overdrive = false, now = new Date() } = {}) {
  const date = toDateKey(now);
  return { ...state, readiness: { ...(state.readiness || {}), [date]: { level, overdrive, at: now.getTime() } } };
}

/** Recovery Mode: lighter workouts (−1 set, +15 s rest) for the next N workouts. */
export function startRecoveryMode(state, { workouts = 2, reason = 'manual', now = new Date() } = {}) {
  return { ...state, recoveryMode: { remaining: workouts, reason, startedAt: now.getTime() }, awayHandled: toDateKey(now) };
}

export function endRecoveryMode(state) {
  return { ...state, recoveryMode: null };
}

/** Log a recovery day. It keeps the streak alive (max 2 per 7 days, enforced by the UI). */
export function logRestDay(state, now = new Date()) {
  const date = toDateKey(now);
  if ((state.restDays || []).includes(date)) return state;
  const next = { ...state, restDays: [...(state.restDays || []), date].slice(-200) };
  next.achievements = evaluateAchievements(next, null, date).achievements;
  return next;
}
