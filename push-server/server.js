/**
 * The Arena — minimal Web Push reminder server (example / starting point).
 *
 * Stores subscriptions in a JSON file and, once a minute, sends the daily
 * mission and streak reminders at each user's chosen local time.
 * Swap the JSON file for a real database (SQLite, Postgres, Firestore…) in production.
 *
 * Env vars:
 *   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY   (npx web-push generate-vapid-keys)
 *   VAPID_SUBJECT   e.g. mailto:you@example.com
 *   ALLOWED_ORIGIN  e.g. https://yourname.github.io
 *   PORT            default 8787
 */
import express from 'express';
import cors from 'cors';
import webpush from 'web-push';
import fs from 'node:fs';

const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT = 'mailto:admin@example.com', ALLOWED_ORIGIN = '*', PORT = 8787 } = process.env;
if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
  console.error('Missing VAPID keys. Run: npm run keys');
  process.exit(1);
}
webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const DB = new URL('./subscriptions.json', import.meta.url);
const load = () => (fs.existsSync(DB) ? JSON.parse(fs.readFileSync(DB, 'utf8')) : {});
const save = (d) => fs.writeFileSync(DB, JSON.stringify(d, null, 2));
let subs = load();

const app = express();
app.use(cors({ origin: ALLOWED_ORIGIN }));
app.use(express.json({ limit: '20kb' }));

app.post('/subscribe', (req, res) => {
  const { subscription, prefs } = req.body || {};
  if (!subscription?.endpoint) return res.status(400).json({ error: 'missing subscription' });
  const prev = subs[subscription.endpoint] || {};
  subs[subscription.endpoint] = { ...prev, subscription, prefs, updatedAt: Date.now() };
  save(subs);
  res.json({ ok: true });
});

app.post('/activity', (req, res) => {
  const s = subs[req.body?.endpoint];
  if (s) {
    s.lastActive = req.body.date;
    save(subs);
  }
  res.json({ ok: true });
});

app.post('/unsubscribe', (req, res) => {
  delete subs[req.body?.endpoint];
  save(subs);
  res.json({ ok: true });
});

/** Local date/time for a timezone. */
function localNow(tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

async function send(entry, payload) {
  try {
    await webpush.sendNotification(entry.subscription, JSON.stringify(payload));
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) delete subs[entry.subscription.endpoint]; // expired
    else console.warn('push error', err.statusCode, err.body);
  }
}

setInterval(async () => {
  for (const entry of Object.values(subs)) {
    const p = entry.prefs || {};
    if (!p.enabled) continue;
    const { date, minutes } = localNow(p.timezone || 'UTC');
    if (entry.lastActive === date) continue; // already trained today
    const [h, m] = (p.time || '18:00').split(':').map(Number);
    const target = h * 60 + m;
    entry.sent = entry.sent || {};
    if (p.daily && minutes >= target && entry.sent.daily !== date) {
      entry.sent.daily = date;
      await send(entry, { title: 'Your daily mission is waiting, Hunter.', body: 'Enter The Arena.', tag: 'arena-daily' });
    }
    if (p.streak && minutes >= Math.min(target + 180, 21 * 60) && entry.sent.streak !== date) {
      entry.sent.streak = date;
      await send(entry, { title: '🔥 Streak at risk', body: 'Complete any mission today to keep it alive.', tag: 'arena-streak' });
    }
  }
  save(subs);
}, 60_000);

app.listen(PORT, () => console.log(`The Arena push server on :${PORT}`));
