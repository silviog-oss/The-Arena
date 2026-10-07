/**
 * Web Push client — ready for a backend.
 *
 * To enable real push:
 *  1. Run the example server in /push-server (or your own) and generate VAPID keys.
 *  2. Create a `.env` file in the project root:
 *       VITE_VAPID_PUBLIC_KEY=<your public key>
 *       VITE_PUSH_SERVER_URL=https://your-push-server.example.com
 *  3. Rebuild. The Profile screen will show "Enable push (background reminders)".
 *
 * The service worker (public/sw.js) already handles `push` and
 * `notificationclick` events.
 */
export const PUSH_CONFIG = {
  publicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
  serverUrl: (import.meta.env.VITE_PUSH_SERVER_URL || '').replace(/\/$/, ''),
};

export const pushConfigured = () => !!(PUSH_CONFIG.publicKey && PUSH_CONFIG.serverUrl);
export const pushSupported = () => 'serviceWorker' in navigator && 'PushManager' in window;

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/** Subscribe and register with the server, including reminder preferences. */
export async function subscribePush(prefs) {
  if (!pushSupported() || !pushConfigured()) throw new Error('Push not available');
  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUSH_CONFIG.publicKey),
    });
  }
  await syncPushPreferences(sub, prefs);
  return sub;
}

/** Send reminder time/flags + timezone to the server whenever settings change. */
export async function syncPushPreferences(sub, prefs) {
  if (!pushConfigured()) return;
  const subscription = sub || (await (await navigator.serviceWorker.ready).pushManager.getSubscription());
  if (!subscription) return;
  await fetch(`${PUSH_CONFIG.serverUrl}/subscribe`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription,
      prefs: { ...prefs, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    }),
  });
}

/** Tell the server the user trained today so it skips today's reminders. */
export async function reportActivity(date) {
  if (!pushConfigured()) return;
  try {
    const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
    if (!sub) return;
    await fetch(`${PUSH_CONFIG.serverUrl}/activity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint, date }),
    });
  } catch {
    /* offline — fine */
  }
}

export async function unsubscribePush() {
  if (!pushSupported()) return;
  const sub = await (await navigator.serviceWorker.ready).pushManager.getSubscription();
  if (!sub) return;
  if (pushConfigured()) {
    fetch(`${PUSH_CONFIG.serverUrl}/unsubscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ endpoint: sub.endpoint }),
    }).catch(() => {});
  }
  await sub.unsubscribe();
}
