/**
 * Personal records.
 *
 * Record keys:
 *   reps:<exId>:<level>   most reps in a single set at that variation level
 *   hold:<exId>           longest completed timed set
 *   amrap:<exId>:<sec>    most reps in a max-reps timed set (Day 31 test)
 *   weight:<exId>         heaviest dumbbell used (with reps)
 *   eval:pushups|squats|plank|balance   best Hunter Evaluation results
 *
 * Record value: { value, unit, date, at, label, detail }
 */
import { EXERCISE_MAP } from '../data/exercises.js';

const LEVEL_NAME = { beginner: 'Beginner', standard: 'Standard', advanced: 'Advanced' };

export function recordLabel(key) {
  const [kind, id, extra] = key.split(':');
  if (kind === 'eval') {
    return { pushups: 'Max push-ups (test)', squats: 'Squats in 60 s (test)', plank: 'Longest plank (test)', balance: 'Best balance (test)' }[id] || id;
  }
  const name = EXERCISE_MAP[id]?.name || id;
  if (kind === 'reps') return `${name} — most reps (${LEVEL_NAME[extra] || extra})`;
  if (kind === 'hold') return `${name} — longest set`;
  if (kind === 'amrap') return `${name} — max reps in ${extra} s`;
  if (kind === 'weight') return `${name} — heaviest dumbbell`;
  return key;
}

/** Merge candidate records into existing ones. Returns { records, fresh: [keys] }. */
export function mergeRecords(records = {}, candidates = [], when = new Date()) {
  const next = { ...records };
  const fresh = [];
  // Best value per key within this batch first, so sets in the same workout
  // don't count as "beating" each other.
  const best = new Map();
  for (const c of candidates) {
    if (!c || !(c.value > 0)) continue;
    if (!best.has(c.key) || c.value > best.get(c.key).value) best.set(c.key, c);
  }
  for (const c of best.values()) {
    if (!c || !(c.value > 0)) continue;
    const old = next[c.key];
    if (!old || c.value > old.value) {
      next[c.key] = { value: c.value, unit: c.unit, detail: c.detail || null, date: c.date, at: when.getTime(), prev: old?.value ?? null };
      // A first-ever entry counts as a record only for meaningful categories.
      fresh.push(c.key);
    }
  }
  return { records: next, fresh };
}

/** Build record candidates from a finished workout's set log. */
export function candidatesFromLog(log = [], date) {
  const out = [];
  for (const s of log) {
    if (!s || s.skipped || s.warmup) continue;
    if (s.amrap && s.reps > 0) out.push({ key: `amrap:${s.exId}:${s.time}`, value: s.reps, unit: 'reps', date, detail: s.variation });
    else if (s.reps > 0) out.push({ key: `reps:${s.exId}:${s.level}`, value: s.reps, unit: 'reps', date, detail: s.variation });
    else if (s.time > 0 && !s.amrap) out.push({ key: `hold:${s.exId}`, value: s.time, unit: 'sec', date, detail: s.variation });
    if (s.kg > 0) out.push({ key: `weight:${s.exId}`, value: s.kg, unit: 'kg', date, detail: `${s.reps || s.time || ''}${s.reps ? ' reps' : s.time ? ' s' : ''}` });
  }
  return out;
}

export function candidatesFromEvaluation(raw, date) {
  return [
    { key: 'eval:pushups', value: raw.pushups, unit: 'reps', date, detail: raw.pushupVariation },
    { key: 'eval:squats', value: raw.squats, unit: 'reps', date },
    { key: 'eval:plank', value: raw.plank, unit: 'sec', date },
    { key: 'eval:balance', value: Math.round(((raw.balanceL || 0) + (raw.balanceR || 0)) / 2), unit: 'sec', date, detail: 'avg per leg' },
  ];
}

/** Records are only "new" (celebrated) when they beat a previous value or are a real test. */
export const isCelebrated = (key, rec) => key.startsWith('eval:') || key.startsWith('amrap:') || rec.prev != null;
