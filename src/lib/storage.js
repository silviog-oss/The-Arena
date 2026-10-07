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
    profile: { name: '', experience: 'beginner', onboarded: false, createdAt: Date.now() },
    xp: 0,
    stats: { STR: 10, END: 10, AGI: 10, VIT: 10 },
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
  // Shallow-merge so new fields added in later versions get defaults.
  return {
    ...base,
    ...data,
    profile: { ...base.profile, ...(data.profile || {}) },
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
