/**
 * Notification system.
 *
 * Two layers:
 *  1. LOCAL notifications (works now, no backend): shown through the service
 *     worker's registration.showNotification(). A scheduler checks every minute
 *     while the app is open (or in a background tab) and fires the daily /
 *     streak reminders at the user's chosen time. Mission-complete and
 *     level-up notifications fire when those events happen.
 *
 *  2. WEB PUSH (needs a server): see ./push.js and /push-server. With a push
 *     server, reminders arrive even when the app is fully closed — this is
 *     the only way reminders reach a closed app on iPhone.
 */
import { toDateKey } from './progression.js';

export const notificationsSupported = () =>
  typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator;

export const permission = () => (notificationsSupported() ? Notification.permission : 'unsupported');

export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported';
  return Notification.requestPermission();
}

/** iOS only allows notifications for PWAs added to the Home Screen. */
export const isStandalone = () =>
  window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;

export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

export async function notify(title, body, { tag, url = './' } = {}) {
  if (permission() !== 'granted') return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    await reg.showNotification(title, {
      body,
      tag,
      icon: './icons/icon-192.png',
      badge: './icons/badge-96.png',
      data: { url },
    });
    return true;
  } catch {
    return false;
  }
}

export const MESSAGES = {
  daily: (day, title) => ({
    title: 'Your daily mission is waiting, Hunter.',
    body: day ? `Day ${day}: “${title}”. Enter The Arena.` : 'Enter The Arena.',
  }),
  streak: (n) => ({
    title: `🔥 ${n}-day streak at risk`,
    body: 'Complete any mission today to keep it alive.',
  }),
  complete: (day) => ({ title: 'Mission complete', body: `Day ${day} cleared. Rest and recover.` }),
  levelUp: (lvl) => ({ title: `Level up — Level ${lvl}`, body: 'Your stats have grown. Keep climbing.' }),
  rankUp: (rank) => ({ title: `Rank up — ${rank}`, body: 'A new rank has been granted.' }),
};

/**
 * Decide which reminders are due now. Pure function — easy to test,
 * and the same logic can run on a push server.
 */
export function dueReminders({ settings, profile, now = new Date() }) {
  const n = settings.notifications;
  if (!n.enabled || profile.programComplete) return [];
  const [h, m] = n.time.split(':').map(Number);
  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const target = h * 60 + m;
  const today = toDateKey(now);
  const out = [];
  if (profile.doneToday) return out;
  if (n.daily && minutesNow >= target && settings.lastNotified.daily !== today) out.push('daily');
  // Streak reminder: 3 hours after the daily reminder (or at 21:00 at the latest).
  const streakAt = Math.min(target + 180, 21 * 60);
  if (n.streak && profile.streak.current > 0 && minutesNow >= streakAt && settings.lastNotified.streak !== today)
    out.push('streak');
  return out;
}
