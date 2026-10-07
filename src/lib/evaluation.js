/**
 * Mission 0 — Hunter Evaluation.
 *
 * Four simple, safe tests set the starting value of each stat (0–30):
 *   STR  Push-ups: max reps with good form (variation-weighted)
 *   END  Squats: max reps in 60 seconds
 *   VIT  Plank: max hold (cap 3 min)
 *   AGI  Balance: single-leg stand each side (cap 60 s) + toe-touch reach
 *
 * Retests (after a cycle, or 14+ days later) compare against the first test;
 * improvements are added to your stats as "breakthroughs".
 */

export const PUSHUP_TEST_VARIATIONS = [
  { id: 'wall', label: 'Wall', factor: 0.3 },
  { id: 'incline', label: 'Incline', factor: 0.5 },
  { id: 'knee', label: 'Knee', factor: 0.7 },
  { id: 'standard', label: 'Standard', factor: 1 },
];

export const REACH_OPTIONS = [
  { id: 0, label: 'Knees' },
  { id: 1, label: 'Shins' },
  { id: 2, label: 'Ankles' },
  { id: 3, label: 'Toes' },
  { id: 4, label: 'Floor' },
];

export const EVAL_XP = { initial: 50, retest: 75 };
const MAX = 30;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function scoreEvaluation(raw) {
  const pv = PUSHUP_TEST_VARIATIONS.find((v) => v.id === raw.pushupVariation) || PUSHUP_TEST_VARIATIONS[2];
  const effPush = (raw.pushups || 0) * pv.factor;
  const STR = Math.round((clamp(effPush, 0, 50) / 50) * MAX);
  const END = Math.round((clamp(raw.squats || 0, 0, 60) / 60) * MAX);
  const VIT = Math.round((clamp(raw.plank || 0, 0, 180) / 180) * MAX);
  const balance = (clamp(raw.balanceL || 0, 0, 60) + clamp(raw.balanceR || 0, 0, 60)) / 2;
  const AGI = Math.round((balance / 60) * 20 + (clamp(raw.reach ?? 0, 0, 4) / 4) * 10);
  // Showing up counts: minimum 1 in each stat.
  return { STR: Math.max(1, STR), END: Math.max(1, END), AGI: Math.max(1, AGI), VIT: Math.max(1, VIT) };
}

export function gradeFor(score) {
  const pct = score / MAX;
  if (pct >= 0.9) return 'S';
  if (pct >= 0.75) return 'A';
  if (pct >= 0.55) return 'B';
  if (pct >= 0.35) return 'C';
  if (pct >= 0.18) return 'D';
  return 'E';
}

/** Suggest a starting experience level from the push-up + squat results. */
export function recommendedExperience(raw) {
  const pv = raw.pushupVariation;
  if (pv === 'standard' && raw.pushups >= 20 && raw.squats >= 40) return 'trained';
  if ((pv === 'standard' && raw.pushups >= 8) || (pv === 'knee' && raw.pushups >= 20 && raw.squats >= 30)) return 'some';
  return 'beginner';
}

export const EXPERIENCE_LABEL = { beginner: 'New to training', some: 'Some experience', trained: 'Trained' };

/** Can the user take a retest now? After a finished cycle or 14+ days since the last test. */
export function retestAvailable(state, profile) {
  const list = state.evaluations || [];
  if (!list.length) return false;
  const last = list[list.length - 1];
  const days = (Date.now() - last.at) / 86400000;
  return profile.programComplete || days >= 14;
}
