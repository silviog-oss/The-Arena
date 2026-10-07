/**
 * Persistence layer (localStorage). Small, synchronous, and works offline.
 * All writes go through save(); the schema is versioned so it can be
 * migrated (or moved to IndexedDB / a backend) later without breaking users.
 */
const KEY = 'arena.state.v1';
export const SCHEMA_VERSION = 1;

export function initialState() {
  return {
    version: SCHEMA_VERSION,
    profile: {
      name: '',
      experience: 'beginner',
      onboarded: false,
      createdAt: Date.now(),
      // Body data stays on this device only. Stored in metric; `units` is display preference.
      body: { age: null, sex: '', weightKg: null, heightCm: null, units: 'metric', weightLog: [], goal: null },
    },
    xp: 0,
    cycle: 1, // New Game+ cycle number
    pastDates: [], // workout dates from finished cycles (keeps streaks)
    pastWorkouts: 0,
    pastQuests: { total: 0, daily: 0, food: 0 },
    rankFloor: 0, // rank index kept when a new cycle starts
    cycles: [], // [{ cycle, finishedAt, xp }]
    stats: { STR: 0, END: 0, AGI: 0, VIT: 0 }, // set by Mission 0 (evaluation)
    evaluations: [], // [{ at, date, kind: 'initial'|'retest', raw, scores }]
    evalSkipped: false,
    completed: {}, // { [day]: { date, at, xp, seconds, stats, skipped, replays } }
    quests: {}, // { [day]: { daily: bool, bonus: bool } }
    totalSeconds: 0,
    achievements: {}, // { [id]: timestamp }
    activeWorkout: null, // { day, step, seconds, skipped }
    settings: {
      sound: true,
      vibration: true,
      keepAwake: true,
      variations: {}, // { [exerciseId]: index }
      notifications: {
        enabled: false,
        time: '18:00',
        daily: true,
        streak: true,
        levelUp: true,
        missionComplete: true,
        pushSubscribed: false,
      },
      lastNotified: {}, // { daily: 'YYYY-MM-DD', streak: 'YYYY-MM-DD' }
    },
  };
}

function migrate(data) {
  const base = initialState();
  // Users from before Mission 0 existed keep their stats and aren't blocked.
  if (data && !('evaluations' in data) && (data.xp > 0 || Object.keys(data.completed || {}).length)) {
    data = { ...data, evaluations: [], evalSkipped: true };
  }
  // Shallow-merge so new fields added in later versions get defaults.
  return {
    ...base,
    ...data,
    profile: {
      ...base.profile,
      ...(data.profile || {}),
      body: { ...base.profile.body, ...(data.profile?.body || {}) },
    },
    settings: {
      ...base.settings,
      ...(data.settings || {}),
      notifications: { ...base.settings.notifications, ...(data.settings?.notifications || {}) },
    },
    version: SCHEMA_VERSION,
  };
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return initialState();
    return migrate(JSON.parse(raw));
  } catch {
    return initialState();
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — app keeps working in memory */
  }
}

export function exportData(state) {
  return JSON.stringify({ app: 'the-arena', exportedAt: new Date().toISOString(), state }, null, 2);
}

export function importData(text) {
  const parsed = JSON.parse(text);
  const s = parsed.state || parsed;
  if (typeof s !== 'object' || !('completed' in s)) throw new Error('Not a valid backup file');
  return migrate(s);
}

/** Ask the browser not to evict our data (important on iOS). */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist) await navigator.storage.persist();
  } catch {
    /* ignore */
  }
}
