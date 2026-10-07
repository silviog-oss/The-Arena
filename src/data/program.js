/**
 * The 31-day program.
 *
 * Item shape: { ex, sets, reps? , time? (seconds), rest (seconds) }
 *  - reps for rep-based exercises, time for timed ones
 *  - exercises flagged perSide in the database are done on each side
 *
 * Difficulty grades: E → D → C → B → A → S
 * Day types: strength | conditioning | core | full | mobility | trial
 *
 * Design notes:
 *  - Volume rises gradually (≈2 sets/exercise on Day 1 → 4–5 by Day 28).
 *  - A mobility/recovery day appears every 3–4 days (4, 11, 18, 24, 27).
 *  - Each phase ends with a "trial" day that tests the phase's work.
 *  - Day 27 is a deliberate deload before the Final Dungeon.
 */

export const PHASES = [
  { id: 1, name: 'Awakening', days: [1, 7], rank: 'E', blurb: 'Your body learns the basic movements. Focus on form, not speed.' },
  { id: 2, name: 'The First Gate', days: [8, 14], rank: 'D', blurb: 'More volume and your first dumbbell work. Consistency is the weapon.' },
  { id: 3, name: 'Elite Hunter', days: [15, 21], rank: 'C', blurb: 'Split training: dedicated upper, lower, core and conditioning days.' },
  { id: 4, name: 'Shadow Training', days: [22, 27], rank: 'B', blurb: 'High-volume sessions. Recovery matters as much as effort now.' },
  { id: 5, name: 'Final Dungeon', days: [28, 30], rank: 'A', blurb: 'Three peak missions. Everything you built comes together.' },
  { id: 6, name: 'Rank Advancement', days: [31, 31], rank: 'S', blurb: 'The test. Max effort in fixed time — measure how far you’ve come.' },
];

export const TYPE_LABEL = {
  strength: 'Strength',
  conditioning: 'Conditioning',
  core: 'Core',
  full: 'Full Body',
  mobility: 'Recovery',
  trial: 'Trial',
};

/** Short warm-up prepended to every non-recovery workout (gives no stats). */
export const WARMUP = [
  { ex: 'arm_circles', sets: 1, time: 30, rest: 5, warmup: true },
  { ex: 'jog_in_place', sets: 1, time: 60, rest: 10, warmup: true },
  { ex: 'squat', sets: 1, reps: 8, rest: 15, warmup: true },
];

const d = (o) => o;

export const PROGRAM = [
  // ═════════ PHASE 1 — AWAKENING (E) ═════════
  d({
    day: 1, title: 'The Awakening', type: 'full', difficulty: 'E', xp: 100,
    brief: 'The System has chosen you. Learn the five foundational movements.',
    items: [
      { ex: 'squat', sets: 2, reps: 10, rest: 60 },
      { ex: 'pushup', sets: 2, reps: 6, rest: 60 },
      { ex: 'glute_bridge', sets: 2, reps: 12, rest: 45 },
      { ex: 'plank', sets: 2, time: 20, rest: 45 },
      { ex: 'jumping_jack', sets: 2, time: 30, rest: 45 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Complete 10 extra bodyweight squats.',
  }),
  d({
    day: 2, title: 'Strength Initiation', type: 'strength', difficulty: 'E', xp: 110,
    brief: 'Push, squat, pull. The three pillars of strength.',
    items: [
      { ex: 'pushup', sets: 3, reps: 6, rest: 60 },
      { ex: 'squat', sets: 3, reps: 10, rest: 60 },
      { ex: 'db_row', sets: 3, reps: 8, rest: 60 },
      { ex: 'dead_bug', sets: 2, reps: 6, rest: 45 },
    ],
    daily: 'Walk for at least 15 minutes.',
    bonus: 'Hold a plank for 30 seconds before bed.',
  }),
  d({
    day: 3, title: 'Heartbeat Run', type: 'conditioning', difficulty: 'E', xp: 110,
    brief: 'Build the engine. Steady effort, controlled breathing.',
    items: [
      { ex: 'jog_in_place', sets: 3, time: 45, rest: 45 },
      { ex: 'jumping_jack', sets: 3, time: 30, rest: 40 },
      { ex: 'mountain_climber', sets: 3, time: 20, rest: 45 },
      { ex: 'squat', sets: 2, reps: 12, rest: 45 },
      { ex: 'shadow_box', sets: 2, time: 30, rest: 30 },
    ],
    daily: 'Get 7+ hours of sleep tonight.',
    bonus: '2 extra minutes of jogging in place or outdoors.',
  }),
  d({
    day: 4, title: 'Mobility Rite', type: 'mobility', difficulty: 'E', xp: 70,
    brief: 'Recovery is training. Restore range of motion and let muscles rebuild.',
    items: [
      { ex: 'cat_cow', sets: 2, time: 40, rest: 15 },
      { ex: 'worlds_greatest', sets: 2, time: 30, rest: 15 },
      { ex: 'hip_flexor', sets: 2, time: 30, rest: 15 },
      { ex: 'deep_squat_hold', sets: 2, time: 30, rest: 20 },
      { ex: 'thoracic_rotation', sets: 2, reps: 6, rest: 15 },
      { ex: 'childs_pose', sets: 1, time: 60, rest: 0 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Take a 20-minute easy walk.',
  }),
  d({
    day: 5, title: 'First Trial', type: 'full', difficulty: 'E', xp: 150,
    brief: 'A first real test of the basics. Same moves, more volume.',
    items: [
      { ex: 'pushup', sets: 3, reps: 8, rest: 60 },
      { ex: 'squat', sets: 3, reps: 12, rest: 60 },
      { ex: 'db_row', sets: 3, reps: 10, rest: 60 },
      { ex: 'plank', sets: 3, time: 30, rest: 45 },
    ],
    daily: 'Eat a serving of protein with every meal.',
    bonus: 'Complete 20 additional squats.',
  }),
  d({
    day: 6, title: 'Core Ignition', type: 'core', difficulty: 'E', xp: 120,
    brief: 'A strong core protects your spine and powers every movement.',
    items: [
      { ex: 'dead_bug', sets: 3, reps: 8, rest: 40 },
      { ex: 'plank', sets: 3, time: 30, rest: 40 },
      { ex: 'side_plank', sets: 2, time: 20, rest: 30 },
      { ex: 'glute_bridge', sets: 3, reps: 12, rest: 40 },
      { ex: 'superman', sets: 3, reps: 10, rest: 40 },
    ],
    daily: 'Stretch for 5 minutes before bed.',
    bonus: '1 extra round of 30-second plank.',
  }),
  d({
    day: 7, title: 'Gate of Awakening', type: 'trial', difficulty: 'E', xp: 180,
    brief: 'Phase trial. Prove the foundation is set before the first gate opens.',
    items: [
      { ex: 'squat', sets: 3, reps: 15, rest: 45 },
      { ex: 'pushup', sets: 3, reps: 8, rest: 60 },
      { ex: 'lunge', sets: 3, reps: 8, rest: 60 },
      { ex: 'mountain_climber', sets: 3, time: 30, rest: 45 },
      { ex: 'plank', sets: 3, time: 35, rest: 45 },
      { ex: 'burpee', sets: 2, reps: 5, rest: 60 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Complete 10 extra push-ups (any variation).',
  }),

  // ═════════ PHASE 2 — THE FIRST GATE (D) ═════════
  d({
    day: 8, title: 'Iron Foundations', type: 'strength', difficulty: 'D', xp: 170,
    brief: 'Four sets now. Dumbbells join the fight — or use the bodyweight swaps.',
    items: [
      { ex: 'pushup', sets: 4, reps: 8, rest: 75 },
      { ex: 'goblet_squat', sets: 4, reps: 10, rest: 75 },
      { ex: 'db_row', sets: 4, reps: 10, rest: 60 },
      { ex: 'db_press', sets: 3, reps: 8, rest: 60 },
      { ex: 'hollow_hold', sets: 3, time: 20, rest: 40 },
    ],
    daily: 'Eat a serving of protein with every meal.',
    bonus: 'Complete 15 extra glute bridges.',
  }),
  d({
    day: 9, title: 'Pulse Hunt', type: 'conditioning', difficulty: 'D', xp: 170,
    brief: 'Intervals. Work hard, recover, repeat. Your endurance stat climbs here.',
    items: [
      { ex: 'jumping_jack', sets: 3, time: 40, rest: 30 },
      { ex: 'high_knees', sets: 3, time: 30, rest: 40 },
      { ex: 'burpee', sets: 3, reps: 6, rest: 60 },
      { ex: 'skater', sets: 3, time: 30, rest: 40 },
      { ex: 'mountain_climber', sets: 3, time: 30, rest: 40 },
      { ex: 'shadow_box', sets: 2, time: 45, rest: 45 },
    ],
    daily: 'Walk for at least 20 minutes.',
    bonus: '1 extra minute of shadow boxing.',
  }),
  d({
    day: 10, title: 'Lower Gate', type: 'strength', difficulty: 'D', xp: 180,
    brief: 'Dedicated leg day. Strong legs carry everything else.',
    items: [
      { ex: 'squat', sets: 4, reps: 15, rest: 60 },
      { ex: 'lunge', sets: 3, reps: 10, rest: 60 },
      { ex: 'db_rdl', sets: 3, reps: 10, rest: 60 },
      { ex: 'glute_bridge', sets: 3, reps: 15, rest: 45 },
      { ex: 'calf_raise', sets: 3, reps: 15, rest: 30 },
      { ex: 'wall_sit', sets: 2, time: 30, rest: 45 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Hold a 45-second wall sit.',
  }),
  d({
    day: 11, title: 'Restoration', type: 'mobility', difficulty: 'D', xp: 80,
    brief: 'Active recovery. Loosen hips, hamstrings and upper back.',
    items: [
      { ex: 'cat_cow', sets: 2, time: 45, rest: 15 },
      { ex: 'inchworm', sets: 2, reps: 5, rest: 20 },
      { ex: 'worlds_greatest', sets: 2, time: 30, rest: 15 },
      { ex: 'hamstring_stretch', sets: 2, time: 30, rest: 15 },
      { ex: 'deep_squat_hold', sets: 2, time: 40, rest: 20 },
      { ex: 'thoracic_rotation', sets: 2, reps: 6, rest: 15 },
      { ex: 'childs_pose', sets: 1, time: 60, rest: 0 },
    ],
    daily: 'Get 7+ hours of sleep tonight.',
    bonus: 'Take a 20-minute easy walk.',
  }),
  d({
    day: 12, title: 'Upper Gate', type: 'strength', difficulty: 'D', xp: 180,
    brief: 'Chest, shoulders, back and arms. Controlled reps beat fast reps.',
    items: [
      { ex: 'pushup', sets: 4, reps: 10, rest: 60 },
      { ex: 'db_row', sets: 4, reps: 10, rest: 60 },
      { ex: 'pike_pushup', sets: 3, reps: 6, rest: 60 },
      { ex: 'db_floor_press', sets: 3, reps: 10, rest: 60 },
      { ex: 'diamond_pushup', sets: 2, reps: 6, rest: 60 },
      { ex: 'plank', sets: 3, time: 40, rest: 40 },
    ],
    daily: 'Eat a serving of protein with every meal.',
    bonus: 'Complete 10 extra push-ups (any variation).',
  }),
  d({
    day: 13, title: 'Core Forge', type: 'core', difficulty: 'D', xp: 160,
    brief: 'Anti-extension, anti-rotation, and crawling. A complete core session.',
    items: [
      { ex: 'hollow_hold', sets: 3, time: 20, rest: 40 },
      { ex: 'dead_bug', sets: 3, reps: 10, rest: 40 },
      { ex: 'side_plank', sets: 3, time: 25, rest: 30 },
      { ex: 'mountain_climber', sets: 3, time: 30, rest: 40 },
      { ex: 'superman', sets: 3, reps: 12, rest: 40 },
      { ex: 'bear_crawl', sets: 3, time: 20, rest: 45 },
    ],
    daily: 'Stretch for 5 minutes before bed.',
    bonus: '1 extra round of 30-second bear crawl.',
  }),
  d({
    day: 14, title: 'The Gatekeeper', type: 'trial', difficulty: 'D', xp: 230,
    brief: 'Gate boss. Full-body circuit — the first real dungeon clear.',
    items: [
      { ex: 'squat', sets: 3, reps: 20, rest: 45 },
      { ex: 'pushup', sets: 3, reps: 10, rest: 60 },
      { ex: 'db_row', sets: 3, reps: 12, rest: 60 },
      { ex: 'lunge', sets: 3, reps: 10, rest: 60 },
      { ex: 'burpee', sets: 3, reps: 8, rest: 60 },
      { ex: 'plank', sets: 3, time: 45, rest: 45 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Complete 10 extra burpees (any variation).',
  }),

  // ═════════ PHASE 3 — ELITE HUNTER (C) ═════════
  d({
    day: 15, title: 'Strength Ascension', type: 'strength', difficulty: 'C', xp: 210,
    brief: 'Full-body strength at higher volume. Consider moving one exercise up a variation.',
    items: [
      { ex: 'pushup', sets: 4, reps: 12, rest: 75 },
      { ex: 'goblet_squat', sets: 4, reps: 12, rest: 75 },
      { ex: 'db_row', sets: 4, reps: 12, rest: 60 },
      { ex: 'db_press', sets: 4, reps: 8, rest: 60 },
      { ex: 'db_rdl', sets: 3, reps: 12, rest: 60 },
      { ex: 'hollow_hold', sets: 3, time: 25, rest: 40 },
    ],
    daily: 'Eat a serving of protein with every meal.',
    bonus: 'Complete 20 additional squats.',
  }),
  d({
    day: 16, title: 'Endurance Raid', type: 'conditioning', difficulty: 'C', xp: 210,
    brief: 'Longer intervals. Pace yourself — finish strong, not empty.',
    items: [
      { ex: 'burpee', sets: 4, reps: 8, rest: 60 },
      { ex: 'high_knees', sets: 4, time: 30, rest: 30 },
      { ex: 'db_thruster', sets: 3, reps: 10, rest: 60 },
      { ex: 'skater', sets: 4, time: 30, rest: 40 },
      { ex: 'jog_in_place', sets: 3, time: 60, rest: 45 },
      { ex: 'mountain_climber', sets: 4, time: 30, rest: 40 },
    ],
    daily: 'Walk for at least 20 minutes.',
    bonus: '2 extra minutes of jogging in place or outdoors.',
  }),
  d({
    day: 17, title: 'Leg Day Dungeon', type: 'strength', difficulty: 'C', xp: 220,
    brief: 'The hardest leg session yet. Use the wall for balance whenever you need it.',
    items: [
      { ex: 'goblet_squat', sets: 4, reps: 12, rest: 75 },
      { ex: 'lunge', sets: 4, reps: 10, rest: 60 },
      { ex: 'db_rdl', sets: 4, reps: 10, rest: 60 },
      { ex: 'glute_bridge', sets: 3, reps: 12, rest: 45 },
      { ex: 'calf_raise', sets: 4, reps: 15, rest: 30 },
      { ex: 'wall_sit', sets: 3, time: 45, rest: 45 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Hold a 60-second wall sit.',
  }),
  d({
    day: 18, title: 'Shadow Stretch', type: 'mobility', difficulty: 'C', xp: 90,
    brief: 'Mid-program recovery. Breathe slowly; this is where adaptation happens.',
    items: [
      { ex: 'cat_cow', sets: 2, time: 45, rest: 15 },
      { ex: 'inchworm', sets: 2, reps: 5, rest: 20 },
      { ex: 'worlds_greatest', sets: 2, time: 40, rest: 15 },
      { ex: 'hip_flexor', sets: 2, time: 40, rest: 15 },
      { ex: 'hamstring_stretch', sets: 2, time: 40, rest: 15 },
      { ex: 'deep_squat_hold', sets: 2, time: 45, rest: 20 },
      { ex: 'childs_pose', sets: 1, time: 90, rest: 0 },
    ],
    daily: 'Get 7+ hours of sleep tonight.',
    bonus: 'Take a 30-minute easy walk.',
  }),
  d({
    day: 19, title: 'Upper Body Siege', type: 'strength', difficulty: 'C', xp: 220,
    brief: 'Five sets of push-ups. Break sets into mini-sets if you need to.',
    items: [
      { ex: 'pushup', sets: 5, reps: 10, rest: 60 },
      { ex: 'db_row', sets: 4, reps: 12, rest: 60 },
      { ex: 'pike_pushup', sets: 4, reps: 6, rest: 60 },
      { ex: 'db_floor_press', sets: 4, reps: 10, rest: 60 },
      { ex: 'diamond_pushup', sets: 3, reps: 8, rest: 60 },
      { ex: 'superman', sets: 3, reps: 12, rest: 40 },
    ],
    daily: 'Eat a serving of protein with every meal.',
    bonus: 'Complete 15 extra push-ups (any variation).',
  }),
  d({
    day: 20, title: 'Core Citadel', type: 'core', difficulty: 'C', xp: 200,
    brief: 'Longer holds, more rounds. Quality positions only.',
    items: [
      { ex: 'hollow_hold', sets: 4, time: 25, rest: 40 },
      { ex: 'dead_bug', sets: 3, reps: 12, rest: 40 },
      { ex: 'side_plank', sets: 3, time: 30, rest: 30 },
      { ex: 'plank', sets: 3, time: 50, rest: 45 },
      { ex: 'bear_crawl', sets: 4, time: 25, rest: 45 },
      { ex: 'mountain_climber', sets: 3, time: 40, rest: 40 },
    ],
    daily: 'Stretch for 5 minutes before bed.',
    bonus: 'Hold a 60-second plank.',
  }),
  d({
    day: 21, title: 'Elite Trial', type: 'trial', difficulty: 'C', xp: 280,
    brief: 'Phase trial. A long full-body circuit — prove you belong in the elite.',
    items: [
      { ex: 'squat', sets: 4, reps: 20, rest: 45 },
      { ex: 'pushup', sets: 4, reps: 12, rest: 60 },
      { ex: 'db_row', sets: 4, reps: 12, rest: 60 },
      { ex: 'lunge', sets: 4, reps: 12, rest: 60 },
      { ex: 'burpee', sets: 4, reps: 10, rest: 60 },
      { ex: 'plank', sets: 3, time: 60, rest: 45 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Complete 10 extra burpees (any variation).',
  }),

  // ═════════ PHASE 4 — SHADOW TRAINING (B) ═════════
  d({
    day: 22, title: 'Shadow Strength', type: 'strength', difficulty: 'B', xp: 260,
    brief: 'Five working sets on the main lifts. Heavy dumbbells or harder variations.',
    items: [
      { ex: 'pushup', sets: 5, reps: 12, rest: 75 },
      { ex: 'goblet_squat', sets: 5, reps: 12, rest: 75 },
      { ex: 'db_row', sets: 5, reps: 12, rest: 60 },
      { ex: 'db_press', sets: 4, reps: 10, rest: 60 },
      { ex: 'db_rdl', sets: 4, reps: 12, rest: 60 },
      { ex: 'hollow_hold', sets: 3, time: 30, rest: 40 },
    ],
    daily: 'Eat a serving of protein with every meal.',
    bonus: 'Complete 20 additional squats.',
  }),
  d({
    day: 23, title: 'Shadow Conditioning', type: 'conditioning', difficulty: 'B', xp: 260,
    brief: 'The most demanding conditioning yet. Breathe through your nose on rests.',
    items: [
      { ex: 'burpee', sets: 5, reps: 10, rest: 60 },
      { ex: 'db_thruster', sets: 4, reps: 12, rest: 60 },
      { ex: 'skater', sets: 4, time: 40, rest: 40 },
      { ex: 'mountain_climber', sets: 4, time: 40, rest: 40 },
      { ex: 'high_knees', sets: 4, time: 40, rest: 40 },
      { ex: 'shadow_box', sets: 3, time: 60, rest: 45 },
    ],
    daily: 'Walk for at least 20 minutes.',
    bonus: '1 extra minute of shadow boxing.',
  }),
  d({
    day: 24, title: 'Mind & Body Reset', type: 'mobility', difficulty: 'B', xp: 100,
    brief: 'Deep recovery before the final push. Slow breathing, long holds.',
    items: [
      { ex: 'cat_cow', sets: 2, time: 60, rest: 15 },
      { ex: 'worlds_greatest', sets: 2, time: 40, rest: 15 },
      { ex: 'hip_flexor', sets: 2, time: 45, rest: 15 },
      { ex: 'hamstring_stretch', sets: 2, time: 45, rest: 15 },
      { ex: 'thoracic_rotation', sets: 2, reps: 8, rest: 15 },
      { ex: 'deep_squat_hold', sets: 2, time: 60, rest: 20 },
      { ex: 'childs_pose', sets: 1, time: 120, rest: 0 },
    ],
    daily: 'Get 7+ hours of sleep tonight.',
    bonus: 'Take a 30-minute easy walk.',
  }),
  d({
    day: 25, title: 'Sovereign Legs', type: 'strength', difficulty: 'B', xp: 270,
    brief: 'Peak leg volume. Try the pause or jump squat variation if you’re ready.',
    items: [
      { ex: 'squat', sets: 4, reps: 15, rest: 60 },
      { ex: 'lunge', sets: 4, reps: 12, rest: 60 },
      { ex: 'db_rdl', sets: 4, reps: 12, rest: 60 },
      { ex: 'glute_bridge', sets: 4, reps: 15, rest: 45 },
      { ex: 'wall_sit', sets: 3, time: 60, rest: 60 },
      { ex: 'calf_raise', sets: 4, reps: 20, rest: 30 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Complete 20 extra lunges (10 per side).',
  }),
  d({
    day: 26, title: 'Shadow Trial', type: 'trial', difficulty: 'B', xp: 320,
    brief: 'Phase trial. The longest session so far — clear it and the Final Dungeon opens.',
    items: [
      { ex: 'pushup', sets: 5, reps: 12, rest: 60 },
      { ex: 'squat', sets: 5, reps: 20, rest: 45 },
      { ex: 'db_row', sets: 4, reps: 15, rest: 60 },
      { ex: 'burpee', sets: 4, reps: 10, rest: 60 },
      { ex: 'plank', sets: 3, time: 60, rest: 45 },
      { ex: 'bear_crawl', sets: 3, time: 30, rest: 45 },
      { ex: 'hollow_hold', sets: 3, time: 30, rest: 40 },
    ],
    daily: 'Eat a serving of protein with every meal.',
    bonus: 'Complete 15 extra push-ups (any variation).',
  }),
  d({
    day: 27, title: 'Calm Before the Storm', type: 'mobility', difficulty: 'B', xp: 100,
    brief: 'Planned deload. Arrive at the Final Dungeon fresh, not fatigued.',
    items: [
      { ex: 'cat_cow', sets: 2, time: 45, rest: 15 },
      { ex: 'inchworm', sets: 2, reps: 5, rest: 20 },
      { ex: 'worlds_greatest', sets: 2, time: 40, rest: 15 },
      { ex: 'hip_flexor', sets: 2, time: 40, rest: 15 },
      { ex: 'deep_squat_hold', sets: 2, time: 45, rest: 20 },
      { ex: 'thoracic_rotation', sets: 2, reps: 8, rest: 15 },
      { ex: 'childs_pose', sets: 1, time: 90, rest: 0 },
    ],
    daily: 'Get 7+ hours of sleep tonight.',
    bonus: 'Take a 20-minute easy walk.',
  }),

  // ═════════ PHASE 5 — FINAL DUNGEON (A) ═════════
  d({
    day: 28, title: 'Final Dungeon I: Iron Hall', type: 'strength', difficulty: 'A', xp: 340,
    brief: 'Peak strength day. Choose the hardest variations you can do with clean form.',
    items: [
      { ex: 'pushup', sets: 5, reps: 15, rest: 75 },
      { ex: 'goblet_squat', sets: 5, reps: 15, rest: 75 },
      { ex: 'db_row', sets: 5, reps: 12, rest: 60 },
      { ex: 'db_press', sets: 4, reps: 12, rest: 60 },
      { ex: 'pike_pushup', sets: 4, reps: 8, rest: 60 },
      { ex: 'db_rdl', sets: 4, reps: 12, rest: 60 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Complete 20 additional squats.',
  }),
  d({
    day: 29, title: 'Final Dungeon II: Endless Corridor', type: 'conditioning', difficulty: 'A', xp: 340,
    brief: 'Peak conditioning. Long intervals, short rests — stay in control.',
    items: [
      { ex: 'burpee', sets: 5, reps: 12, rest: 60 },
      { ex: 'db_thruster', sets: 4, reps: 12, rest: 60 },
      { ex: 'mountain_climber', sets: 5, time: 40, rest: 40 },
      { ex: 'skater', sets: 5, time: 40, rest: 40 },
      { ex: 'high_knees', sets: 4, time: 45, rest: 40 },
      { ex: 'jog_in_place', sets: 3, time: 90, rest: 45 },
    ],
    daily: 'Eat a serving of protein with every meal.',
    bonus: '2 extra minutes of jogging in place or outdoors.',
  }),
  d({
    day: 30, title: 'Final Dungeon III: The Throne', type: 'trial', difficulty: 'A', xp: 380,
    brief: 'The final boss. Every movement you have learned, at full volume.',
    items: [
      { ex: 'squat', sets: 5, reps: 20, rest: 45 },
      { ex: 'pushup', sets: 5, reps: 15, rest: 60 },
      { ex: 'lunge', sets: 4, reps: 12, rest: 60 },
      { ex: 'db_row', sets: 4, reps: 15, rest: 60 },
      { ex: 'burpee', sets: 4, reps: 12, rest: 60 },
      { ex: 'hollow_hold', sets: 4, time: 30, rest: 40 },
      { ex: 'plank', sets: 3, time: 60, rest: 45 },
    ],
    daily: 'Drink at least {water} of water today.',
    bonus: 'Complete 10 extra burpees (any variation).',
  }),

  // ═════════ PHASE 6 — RANK ADVANCEMENT (S) ═════════
  d({
    day: 31, title: 'Rank Advancement Trial', type: 'trial', difficulty: 'S', xp: 500,
    brief: 'Max reps in fixed time. Count your reps and compare with Day 1 — that is your proof.',
    test: true,
    items: [
      { ex: 'pushup', sets: 3, time: 45, rest: 90, note: 'Max reps in 45 sec' },
      { ex: 'squat', sets: 3, time: 60, rest: 90, note: 'Max reps in 60 sec' },
      { ex: 'db_row', sets: 2, reps: 15, rest: 60 },
      { ex: 'burpee', sets: 3, time: 45, rest: 90, note: 'Max reps in 45 sec' },
      { ex: 'mountain_climber', sets: 3, time: 45, rest: 60 },
      { ex: 'plank', sets: 2, time: 90, rest: 60, note: 'Hold as long as you can, up to 90 sec' },
    ],
    daily: 'Write down your Day 31 rep counts.',
    bonus: 'Plan your next 31 days.',
  }),
];

export const DAY_MAP = Object.fromEntries(PROGRAM.map((x) => [x.day, x]));
export const TOTAL_DAYS = PROGRAM.length;

export function phaseForDay(day) {
  return PHASES.find((p) => day >= p.days[0] && day <= p.days[1]);
}

export const QUEST_XP = { daily: 25, bonus: 50 };
