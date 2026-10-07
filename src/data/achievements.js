/**
 * Achievements. `test(ctx)` receives the derived profile + raw state.
 * ctx: { p (derived profile), s (state), last (last completion result or null) }
 */
export const ACHIEVEMENTS = [
  { id: 'first_awakening', icon: '✦', name: 'First Awakening', desc: 'Complete Day 1.', test: ({ p }) => p.completedDays.has(1) },
  { id: 'getting_serious', icon: '⚔', name: 'Getting Serious', desc: 'Complete 7 workouts.', test: ({ p }) => p.daysDone >= 7 },
  { id: 'two_weeks', icon: '⛨', name: 'Two Weeks Strong', desc: 'Complete 14 days.', test: ({ p }) => p.daysDone >= 14 },
  { id: 'elite_hunter', icon: '◆', name: 'Elite Hunter', desc: 'Complete 21 days.', test: ({ p }) => p.daysDone >= 21 },
  { id: 'final_dungeon', icon: '♜', name: 'Final Dungeon', desc: 'Complete Day 30.', test: ({ p }) => p.completedDays.has(30) },
  { id: 'awakened', icon: '★', name: 'Awakened', desc: 'Complete all 31 days.', test: ({ p }) => p.daysDone >= 31 },
  { id: 'unbroken', icon: '🔥', name: 'Unbroken', desc: 'Maintain a 7-day streak.', test: ({ p }) => p.streak.longest >= 7 },
  { id: 'iron_will', icon: '⛓', name: 'Iron Will', desc: 'Maintain a 14-day streak.', test: ({ p }) => p.streak.longest >= 14 },
  { id: 'relentless', icon: '☄', name: 'Relentless', desc: 'Maintain a 21-day streak.', test: ({ p }) => p.streak.longest >= 21 },
  { id: 'gatekeeper', icon: '⚑', name: 'Gate Breaker', desc: 'Clear the Day 14 boss mission.', test: ({ p }) => p.completedDays.has(14) },
  { id: 'rising_power', icon: '▲', name: 'Rising Power', desc: 'Reach Level 5.', test: ({ p }) => p.level >= 5 },
  { id: 'beyond_limits', icon: '⬆', name: 'Beyond Limits', desc: 'Reach Level 8.', test: ({ p }) => p.level >= 8 },
  { id: 'c_rank', icon: 'C', name: 'Licensed Hunter', desc: 'Reach C-Rank.', test: ({ p }) => 'CBAS'.includes(p.rank.id) },
  { id: 'a_rank', icon: 'A', name: 'Vanguard', desc: 'Reach A-Rank.', test: ({ p }) => 'AS'.includes(p.rank.id) },
  { id: 's_rank', icon: 'S', name: 'Sovereign', desc: 'Reach S-Rank (get within 10% of your goal).', test: ({ p }) => p.rank.id === 'S' },
  { id: 'quest_seeker', icon: '❖', name: 'Quest Seeker', desc: 'Complete 10 optional quests.', test: ({ p }) => p.questCount >= 10 },
  { id: 'hydrated', icon: '💧', name: 'Well Supplied', desc: 'Complete 7 daily quests.', test: ({ p }) => p.dailyCount >= 7 },
  { id: 'clean_eater', icon: '🥦', name: 'Clean Fuel', desc: 'Complete 7 food challenges.', test: ({ p }) => p.foodCount >= 7 },
  { id: 'iron_diet', icon: '🍎', name: 'Iron Diet', desc: 'Complete 21 food challenges.', test: ({ p }) => p.foodCount >= 21 },
  { id: 'new_game_plus', icon: '∞', name: 'New Game+', desc: 'Start a second cycle.', test: ({ s }) => (s.cycle || 1) >= 2 },
  { id: 'veteran', icon: '♛', name: 'Veteran', desc: 'Finish two full cycles.', test: ({ s, p }) => (s.cycles?.length || 0) >= 2 || ((s.cycle || 1) >= 2 && p.daysDone >= 31) },
  { id: 'measured', icon: '◎', name: 'Measured', desc: 'Complete the Hunter Evaluation (Mission 0).', test: ({ s }) => (s.evaluations || []).length >= 1 },
  { id: 'breakthrough', icon: '⇡', name: 'Breakthrough', desc: 'Improve a stat in a re-evaluation.', test: ({ s }) => { const e = s.evaluations || []; if (e.length < 2) return false; const a = e[e.length - 2].scores, b = e[e.length - 1].scores; return Object.keys(b).some((k) => b[k] > a[k]); } },
  { id: 'balance', icon: '☯', name: 'Balance', desc: 'Complete every recovery day.', test: ({ p }) => [4, 11, 18, 24, 27].every((d) => p.completedDays.has(d)) },
  { id: 'centurion', icon: '⏱', name: 'Centurion', desc: 'Train for 100 total minutes.', test: ({ p }) => p.totalMinutes >= 100 },
  { id: 'marathon', icon: '⌛', name: 'Long Road', desc: 'Train for 500 total minutes.', test: ({ p }) => p.totalMinutes >= 500 },
  { id: 'early_bird', icon: '☀', name: 'Dawn Raider', desc: 'Finish a mission before 8 AM.', test: ({ last }) => last && new Date(last.at).getHours() < 8 },
  { id: 'night_owl', icon: '☾', name: 'Night Hunter', desc: 'Finish a mission after 9 PM.', test: ({ last }) => last && new Date(last.at).getHours() >= 21 },
  { id: 'comeback', icon: '↻', name: 'The Return', desc: 'Come back after missing 2+ days.', test: ({ last }) => last && last.gapBefore >= 3 },
  { id: 'no_shortcuts', icon: '⚖', name: 'No Shortcuts', desc: 'Finish a mission without skipping any step.', test: ({ last }) => last && last.skipped === 0 && !last.isMobility },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
