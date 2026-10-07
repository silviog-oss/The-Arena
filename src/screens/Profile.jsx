import { useRef, useState } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { TOTAL_DAYS } from '../data/program.js';
import { STAT_KEYS } from '../lib/progression.js';
import { exportData } from '../lib/storage.js';
import {
  notificationsSupported, permission, requestPermission, notify, isIOS, isStandalone,
} from '../lib/notifications.js';
import { pushConfigured, pushSupported, subscribePush, unsubscribePush, syncPushPreferences } from '../lib/push.js';
import { useInstallPrompt } from '../hooks/useSystem.js';
import {
  ScreenHeader, Panel, XPBar, RankBadge, ProgressBar, StatBar, Toggle, Button, Sheet, Disclaimer,
} from '../components/UI.jsx';
import { LogoMark } from '../components/Logo.jsx';
import { BodyForm, BodyCard, GoalCard, GoalForm } from '../components/Body.jsx';
import Measurements from '../components/Measurements.jsx';
import { EquipmentForm } from '../components/Training.jsx';
import { bodyComplete } from '../lib/body.js';
import { retestAvailable, gradeFor } from '../lib/evaluation.js';
import { STAT_INFO } from '../lib/progression.js';

export default function Profile({ nav }) {
  const { state, profile, actions } = useGame();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(state.profile.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const [bodyOpen, setBodyOpen] = useState(false);
  const [goalOpen, setGoalOpen] = useState(false);
  const [perm, setPerm] = useState(permission());
  const fileRef = useRef();
  const install = useInstallPrompt();
  const n = state.settings.notifications;
  const maxStat = Math.max(60, ...STAT_KEYS.map((k) => state.stats[k]));
  const unlockedCount = Object.keys(state.achievements).length;

  const enableNotifications = async (on) => {
    if (!on) {
      actions.updateNotifications({ enabled: false });
      return;
    }
    if (isIOS() && !isStandalone()) {
      nav.showToast({ icon: 'ℹ', title: 'Add to Home Screen first', body: 'iPhone only allows notifications for installed apps.', ms: 4000 });
      return;
    }
    const p = await requestPermission();
    setPerm(p);
    if (p === 'granted') {
      actions.updateNotifications({ enabled: true });
      notify('Notifications on', 'The Arena will remind you about your daily mission.', { tag: 'arena-test' });
    } else {
      nav.showToast({ icon: '✕', title: 'Permission not granted', body: 'Enable notifications in your browser/system settings.' });
    }
  };

  const updateNotify = (patch) => {
    actions.updateNotifications(patch);
    if (n.pushSubscribed) syncPushPreferences(null, { ...n, ...patch }).catch(() => {});
  };

  const togglePush = async (on) => {
    try {
      if (on) {
        await subscribePush(n);
        actions.updateNotifications({ pushSubscribed: true });
        nav.showToast({ icon: '✓', title: 'Background reminders on' });
      } else {
        await unsubscribePush();
        actions.updateNotifications({ pushSubscribed: false });
      }
    } catch (e) {
      nav.showToast({ icon: '✕', title: 'Push failed', body: String(e.message || e) });
    }
  };

  const download = () => {
    const blob = new Blob([exportData(state)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `the-arena-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      actions.importBackup(await file.text());
      nav.showToast({ icon: '✓', title: 'Backup restored' });
    } catch (err) {
      nav.showToast({ icon: '✕', title: 'Import failed', body: err.message });
    }
    e.target.value = '';
  };

  return (
    <div className="screen">
      <ScreenHeader title="Profile" />

      <Panel glow className="profile-card">
        <div className="hunter-row">
          <RankBadge rank={profile.rank} size="lg" />
          <div className="hunter-id">
            {editing ? (
              <form
                className="name-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  actions.setName(name.trim());
                  setEditing(false);
                }}
              >
                <input className="input" value={name} maxLength={20} autoFocus onChange={(e) => setName(e.target.value)} />
                <Button size="sm" type="submit">Save</Button>
              </form>
            ) : (
              <button className="name-btn" onClick={() => setEditing(true)}>
                {state.profile.name || 'Hunter'} <small>✎</small>
              </button>
            )}
            <span className="eyebrow">{profile.rank.name} · {profile.rank.title}</span>
            <h2 className="level-title">LEVEL <span className="level-num">{profile.level}</span></h2>
          </div>
        </div>
        <XPBar profile={profile} />
        <div className="kpi-grid tight">
          <div className="kpi"><small>Total XP</small><b>{state.xp.toLocaleString()}</b></div>
          <div className="kpi"><small>Next level</small><b>{profile.toNext.toLocaleString()} XP</b></div>
          <div className="kpi"><small>Streak</small><b>🔥 {profile.streak.current}</b></div>
          <div className="kpi"><small>Longest</small><b>{profile.streak.longest}</b></div>
          <div className="kpi"><small>Workouts</small><b>{profile.totalWorkouts}</b></div>
          <div className="kpi"><small>Time trained</small><b>{profile.totalMinutes}m</b></div>
        </div>
        <div className="prog-line">
          <span className="small muted">{profile.cycle > 1 ? `Cycle ${profile.cycle} progress` : '31-day progress'}</span>
          <span className="mono small">{profile.daysDone}/{TOTAL_DAYS}</span>
        </div>
        <ProgressBar value={profile.daysDone} max={TOTAL_DAYS} label="31-day progress" />
      </Panel>

      <Panel title="Evaluation" action={<span className="mono muted">{profile.evaluations.length} taken</span>}>
        {profile.evaluations.length === 0 ? (
          <>
            <p className="muted small">Mission 0 measures your starting STR, END, VIT and AGI.</p>
            <Button className="w-full" onClick={() => nav.push({ name: 'evaluation' })}>Take evaluation</Button>
          </>
        ) : (
          <>
            <ul className="eval-history">
              {profile.evaluations.slice(-3).map((e) => (
                <li key={e.at}>
                  <span className="mono muted">{e.date}</span>
                  {Object.entries(e.scores).map(([k, v]) => (
                    <span key={k} className="eh-stat"><b style={{ color: STAT_INFO[k].color }}>{k}</b> {v}<i className={`diff diff-${gradeFor(v)}`}>{gradeFor(v)}</i></span>
                  ))}
                </li>
              ))}
            </ul>
            {retestAvailable(state, profile) ? (
              <Button className="w-full" onClick={() => nav.push({ name: 'evaluation' })}>Re-evaluate (+75 XP)</Button>
            ) : (
              <p className="muted small">Re-evaluation unlocks 14 days after your last test or when you finish a cycle.</p>
            )}
          </>
        )}
      </Panel>

      <Panel title="Body">
        <BodyCard body={state.profile.body} onEdit={() => setBodyOpen(true)} />
      </Panel>

      {bodyComplete(state.profile.body) && (
        <Panel title="Goal">
          <GoalCard
            body={state.profile.body}
            onSetGoal={() => setGoalOpen(true)}
            onLog={(kg) => {
              actions.setBody({ weightKg: kg });
              nav.showToast({ icon: '✓', title: 'Weight logged' });
            }}
          />
        </Panel>
      )}

      {bodyComplete(state.profile.body) && (
        <Panel title="Measurements">
          <Measurements />
        </Panel>
      )}

      <Panel title="🏋 Equipment">
        <EquipmentForm />
      </Panel>

      <Panel title="Attributes">
        {STAT_KEYS.map((k) => (
          <StatBar key={k} k={k} value={state.stats[k]} max={maxStat} />
        ))}
      </Panel>

      <Panel title="Achievements" action={<span className="mono muted">{unlockedCount}/{ACHIEVEMENTS.length}</span>}>
        <ul className="ach-grid">
          {ACHIEVEMENTS.map((a) => {
            const got = !!state.achievements[a.id];
            return (
              <li key={a.id} className={`ach ${got ? 'got' : ''}`} title={a.desc}>
                <span className="ach-icon">{got ? a.icon : '?'}</span>
                <b>{a.name}</b>
                <small>{a.desc}</small>
              </li>
            );
          })}
        </ul>
      </Panel>

      <Panel title="Reminders">
        {!notificationsSupported() ? (
          <p className="muted small">This browser doesn’t support notifications.</p>
        ) : (
          <>
            <Toggle
              label="Enable notifications"
              sub={perm === 'denied' ? 'Blocked in system settings' : isIOS() && !isStandalone() ? 'Install to Home Screen first (iPhone requirement)' : 'Mission, streak and level-up alerts'}
              checked={n.enabled && perm === 'granted'}
              onChange={enableNotifications}
            />
            <label className="time-row">
              <span>Reminder time</span>
              <input type="time" className="input time" value={n.time} onChange={(e) => updateNotify({ time: e.target.value })} />
            </label>
            <Toggle label="Daily mission reminder" checked={n.daily} onChange={(v) => updateNotify({ daily: v })} disabled={!n.enabled} />
            <Toggle label="Streak reminder" sub="If you haven’t trained by evening" checked={n.streak} onChange={(v) => updateNotify({ streak: v })} disabled={!n.enabled} />
            <Toggle label="Mission complete" checked={n.missionComplete} onChange={(v) => updateNotify({ missionComplete: v })} disabled={!n.enabled} />
            <Toggle label="Level & rank up" checked={n.levelUp} onChange={(v) => updateNotify({ levelUp: v })} disabled={!n.enabled} />
            {pushSupported() && pushConfigured() ? (
              <Toggle
                label="Background reminders (Web Push)"
                sub="Delivers reminders even when the app is closed"
                checked={n.pushSubscribed}
                onChange={togglePush}
                disabled={!n.enabled}
              />
            ) : (
              <p className="note small">
                Reminders fire while The Arena is open or in the background. To get them when the app is fully closed,
                connect a push server (see README → Push notifications).
              </p>
            )}
          </>
        )}
      </Panel>

      <Panel title="Workout settings">
        <Toggle label="Sound cues" sub="Countdown beeps" checked={state.settings.sound} onChange={(v) => actions.updateSettings({ sound: v })} />
        <Toggle label="Vibration" sub="Android only" checked={state.settings.vibration} onChange={(v) => actions.updateSettings({ vibration: v })} />
        <Toggle label="Keep screen awake" sub="During active workouts" checked={state.settings.keepAwake} onChange={(v) => actions.updateSettings({ keepAwake: v })} />
      </Panel>

      {!install.installed && (
        <Panel title="Install the app">
          {install.canPrompt ? (
            <Button className="w-full" icon="download" onClick={install.prompt}>Install The Arena</Button>
          ) : isIOS() ? (
            <ol className="howto small">
              <li>Open this page in <b>Safari</b>.</li>
              <li>Tap the <b>Share</b> button.</li>
              <li>Choose <b>Add to Home Screen</b>, then <b>Add</b>.</li>
            </ol>
          ) : (
            <p className="muted small">Use your browser menu → “Install app” or “Add to Home screen”.</p>
          )}
        </Panel>
      )}

      <Panel title="Data">
        <p className="muted small">Progress is stored on this device only. Export a backup before switching phones or clearing browser data.</p>
        <div className="btn-row">
          <Button variant="ghost" icon="download" onClick={download}>Export</Button>
          <Button variant="ghost" icon="upload" onClick={() => fileRef.current?.click()}>Import</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
        </div>
        <Button variant="danger" className="w-full" onClick={() => setConfirmReset(true)}>Reset all progress</Button>
      </Panel>

      <Disclaimer />

      <footer className="about">
        <LogoMark size={36} />
        <span>The Arena · v1.0 · Works offline</span>
      </footer>

      <Sheet open={bodyOpen} onClose={() => setBodyOpen(false)} title="Body profile">
        <BodyForm
          initial={state.profile.body}
          onSave={(b) => {
            actions.setBody(b);
            setBodyOpen(false);
            nav.showToast({ icon: '✓', title: 'Body profile saved' });
          }}
        />
      </Sheet>

      <Sheet open={goalOpen} onClose={() => setGoalOpen(false)} title="Your goal">
        {bodyComplete(state.profile.body) && (
          <GoalForm
            body={state.profile.body}
            onSave={(goal) => {
              actions.setBody({ goal });
              setGoalOpen(false);
              nav.showToast({ icon: '◎', title: 'Goal set', body: 'Log your weight to track progress.' });
            }}
            onClear={() => {
              actions.setBody({ goal: null });
              setGoalOpen(false);
            }}
          />
        )}
      </Sheet>

      <Sheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset everything?">
        <p className="muted">This deletes your level, XP, stats, streaks and achievements on this device. It can’t be undone unless you exported a backup.</p>
        <div className="stack">
          <Button variant="danger" size="lg" className="w-full" onClick={() => { actions.reset(); setConfirmReset(false); }}>
            Yes, reset
          </Button>
          <Button variant="ghost" size="lg" className="w-full" onClick={() => setConfirmReset(false)}>Cancel</Button>
        </div>
      </Sheet>
    </div>
  );
}
