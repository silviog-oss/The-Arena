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
  { id: 's_rank', icon: 'S', name: 'Sovereign', desc: 'Reach S-Rank.', test: ({ p }) => p.rank.id === 'S' },
  { id: 'quest_seeker', icon: '❖', name: 'Quest Seeker', desc: 'Complete 10 optional quests.', test: ({ p }) => p.questCount >= 10 },
  { id: 'hydrated', icon: '💧', name: 'Well Supplied', desc: 'Complete 7 daily quests.', test: ({ p }) => p.dailyCount >= 7 },
  { id: 'balance', icon: '☯', name: 'Balance', desc: 'Complete every recovery day.', test: ({ p }) => [4, 11, 18, 24, 27].every((d) => p.completedDays.has(d)) },
  { id: 'centurion', icon: '⏱', name: 'Centurion', desc: 'Train for 100 total minutes.', test: ({ p }) => p.totalMinutes >= 100 },
  { id: 'marathon', icon: '⌛', name: 'Long Road', desc: 'Train for 500 total minutes.', test: ({ p }) => p.totalMinutes >= 500 },
  { id: 'early_bird', icon: '☀', name: 'Dawn Raider', desc: 'Finish a mission before 8 AM.', test: ({ last }) => last && new Date(last.at).getHours() < 8 },
  { id: 'night_owl', icon: '☾', name: 'Night Hunter', desc: 'Finish a mission after 9 PM.', test: ({ last }) => last && new Date(last.at).getHours() >= 21 },
  { id: 'comeback', icon: '↻', name: 'The Return', desc: 'Come back after missing 2+ days.', test: ({ last }) => last && last.gapBefore >= 3 },
  { id: 'no_shortcuts', icon: '⚖', name: 'No Shortcuts', desc: 'Finish a mission without skipping any step.', test: ({ last }) => last && last.skipped === 0 && !last.isMobility },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
