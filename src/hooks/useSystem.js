import { useEffect, useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { DAY_MAP } from '../data/program.js';
import { dueReminders, notify, MESSAGES } from '../lib/notifications.js';
import { toDateKey } from '../lib/progression.js';

/** Fires local reminders at the chosen time while the app is running. */
export function useReminderScheduler() {
  const { state, profile, actions } = useGame();
  const ref = useRef({ state, profile });
  ref.current = { state, profile };

  useEffect(() => {
    const check = () => {
      const { state: s, profile: p } = ref.current;
      const due = dueReminders({ settings: s.settings, profile: p });
      const today = toDateKey();
      for (const kind of due) {
        const msg = kind === 'daily' ? MESSAGES.daily(p.nextDay, DAY_MAP[p.nextDay]?.title) : MESSAGES.streak(p.streak.current);
        notify(msg.title, msg.body, { tag: `arena-${kind}` });
        actions.markNotified(kind, today);
      }
    };
    check();
    const id = setInterval(check, 60_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, [actions]);
}

/** Keeps the screen on during workouts (where supported). */
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !('wakeLock' in navigator)) return;
    let lock = null;
    let cancelled = false;
    const acquire = async () => {
      try {
        lock = await navigator.wakeLock.request('screen');
      } catch {
        /* denied — ignore */
      }
    };
    const onVis = () => document.visibilityState === 'visible' && !cancelled && acquire();
    acquire();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVis);
      lock?.release?.().catch(() => {});
    };
  }, [active]);
}

/** Captures the Android/desktop install prompt so we can show our own button. */
export function useInstallPrompt() {
  const [evt, setEvt] = useState(null);
  const [installed, setInstalled] = useState(
    () => window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true,
  );
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setEvt(e);
    };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const prompt = async () => {
    if (!evt) return;
    evt.prompt();
    await evt.userChoice.catch(() => {});
    setEvt(null);
  };
  return { canPrompt: !!evt, prompt, installed };
}

/** Online/offline indicator. */
export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
