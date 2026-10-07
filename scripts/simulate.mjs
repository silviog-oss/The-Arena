// Headless check of the game rules: run with `node scripts/simulate.mjs`
import { PROGRAM } from '../src/data/program.js';
import { EXERCISE_MAP } from '../src/data/exercises.js';
import { completeDay, toggleQuest } from '../src/lib/game.js';
import { deriveProfile, estimateMinutes, computeStreaks, xpForLevel } from '../src/lib/progression.js';
import { buildSteps } from '../src/lib/workout.js';

globalThis.localStorage = { getItem: () => null, setItem() {} };
const { initialState } = await import('../src/lib/storage.js');

// 1. Data integrity
for (const d of PROGRAM) for (const it of d.items) {
  if (!EXERCISE_MAP[it.ex]) throw new Error(`Day ${d.day}: unknown exercise ${it.ex}`);
  if (!it.reps && !it.time) throw new Error(`Day ${d.day}: ${it.ex} needs reps or time`);
}
console.log('levels:', [1,2,3,4,5,6,7,8,9,10].map(xpForLevel).join(' '));

// 2. Play all 31 days, one per calendar day
let s = initialState();
const start = new Date(2026, 0, 1, 18, 0);
const rows = [];
for (const d of PROGRAM) {
  const now = new Date(start.getTime() + (d.day - 1) * 86400000);
  const r = completeDay(s, { day: d.day, seconds: estimateMinutes(d) * 60, skipped: 0, now });
  s = r.state;
  const steps = buildSteps(d);
  rows.push(`D${String(d.day).padStart(2)} ${d.difficulty} ${String(estimateMinutes(d)).padStart(2)}min steps:${String(steps.length).padStart(3)} xp:${String(s.xp).padStart(5)} L${r.result.levelAfter} ${r.result.rankAfter.id} streak:${r.result.streak}${r.result.newAchievements.length ? ' +' + r.result.newAchievements.join(',') : ''}`);
}
console.log(rows.join('\n'));
const p = deriveProfile(s, '2026-01-31');
console.log('FINAL', { xp: s.xp, level: p.level, rank: p.rank.id, days: p.daysDone, streak: p.streak, stats: s.stats, achievements: Object.keys(s.achievements).length });

// 3. Quests add/remove XP
const q1 = toggleQuest(s, 31, 'bonus'); const q2 = toggleQuest(q1.state, 31, 'bonus');
console.log('quest toggle', q1.state.xp - s.xp, q2.state.xp - s.xp);

// 4. Missed days: streak resets, progress kept
let m = initialState();
m = completeDay(m, { day: 1, now: new Date(2026, 0, 1) }).state;
m = completeDay(m, { day: 2, now: new Date(2026, 0, 2) }).state;
const after = completeDay(m, { day: 3, now: new Date(2026, 0, 6) });
console.log('gap test: next day', deriveProfile(after.state, '2026-01-06').nextDay, 'streak', after.result.streak, 'ach', after.result.newAchievements);
console.log('streak alive yesterday?', computeStreaks(m.completed, '2026-01-03').current, 'dead 2 days later?', computeStreaks(m.completed, '2026-01-04').current);

// 5. Replay grants no XP
const rep = completeDay(s, { day: 5, seconds: 600 });
console.log('replay xp', rep.result.xp, 'time added', rep.state.totalSeconds - s.totalSeconds);
