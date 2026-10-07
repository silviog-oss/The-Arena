import { useGame } from '../state/GameContext.jsx';
import { DAY_MAP, TOTAL_DAYS, TYPE_LABEL, phaseForDay } from '../data/program.js';
import { estimateMinutes, rankRequirements } from '../lib/progression.js';
import { Wordmark } from '../components/Logo.jsx';
import { Panel, XPBar, RankBadge, StreakChip, Button, ProgressBar, DifficultyTag, Pill } from '../components/UI.jsx';
import { Icon } from '../components/Icons.jsx';
import QuestList from '../components/QuestList.jsx';
import { useOnline } from '../hooks/useSystem.js';
import { HunterStatus, RecoveryBanner } from '../components/Training.jsx';
import { bmi, bmiCategory, bodyComplete, goalProgress } from '../lib/body.js';

export default function Home({ nav }) {
  const { state, profile, dayFor, intensity, actions } = useGame();
  const online = useOnline();
  const name = state.profile.name || 'Hunter';
  const active = state.activeWorkout;
  const day = active?.day || profile.nextDay;
  const mission = day ? dayFor(day) : null;
  const phase = mission ? phaseForDay(mission.day) : null;

  return (
    <div className="screen home">
      <header className="home-top">
        <Wordmark size={26} />
        {!online && <Pill tone="muted">Offline</Pill>}
      </header>

      {/* ── Hunter card ── */}
      <Panel className="hunter-card" glow>
        <div className="hunter-row">
          <RankBadge rank={profile.rank} size="lg" />
          <div className="hunter-id">
            <span className="eyebrow">{profile.rank.name} · {profile.rank.title}</span>
            <h1 className="level-title">
              LEVEL <span className="level-num">{profile.level}</span>
            </h1>
            <span className="hunter-name">{name}</span>
          </div>
        </div>
        <XPBar profile={profile} />
        <div className="hunter-foot">
          <StreakChip n={profile.streak.current} big />
          {bodyComplete(state.profile.body) ? (
            <button className="bmi-chip" onClick={() => nav.setTab('profile')}>
              BMI <b className="mono">{bmi(state.profile.body.weightKg, state.profile.body.heightCm)}</b>
              <small>
                {goalProgress(state.profile.body)
                  ? goalProgress(state.profile.body).reached
                    ? 'Goal reached ✓'
                    : `Goal ${Math.round(goalProgress(state.profile.body).pct)}%`
                  : bmiCategory(bmi(state.profile.body.weightKg, state.profile.body.heightCm), state.profile.body.age)?.label}
              </small>
            </button>
          ) : (
            <button className="bmi-chip add" onClick={() => nav.setTab('profile')}>+ Add BMI</button>
          )}
        </div>
      </Panel>

      {/* ── Today's mission ── */}
      <RecoveryBanner nav={nav} />

      {profile.evaluated && !profile.doneToday && !active && mission && mission.type !== 'mobility' && !profile.programComplete && (
        <Panel title="⚔ Hunter Status · how do you feel today?">
          <HunterStatus />
        </Panel>
      )}

      {profile.programComplete && !active && (() => {
        const d31 = state.completed[31]?.at || 0;
        const lastEval = (state.evaluations || []).slice(-1)[0]?.at || 0;
        return lastEval < d31 ? (
          <Panel glow className="final-eval">
            <span className="eyebrow">Hunter Evolution</span>
            <h2>Final Evaluation ready</h2>
            <p className="muted small">Repeat the Mission 0 tests and compare Day 1 with today — every test, side by side.</p>
            <Button size="lg" className="w-full" onClick={() => nav.push({ name: 'evaluation' })}>Start Final Evaluation</Button>
          </Panel>
        ) : null;
      })()}

      {!profile.evaluated && !active ? (
        <Panel title="Your first mission" glow className="today-card">
          <div className="today-meta">
            <span className="day-chip">MISSION 0</span>
            <span className="muted small">Evaluation · ~10 min</span>
          </div>
          <h2 className="mission-title">“Hunter Evaluation”</h2>
          <p className="muted">Your stats start at 0. Four short tests measure your strength, endurance, vitality and agility, then set your starting stats and difficulty.</p>
          <div className="today-facts">
            <span><Icon name="bolt" size={16} /> +50 XP</span>
            <span>Unlocks Day 1</span>
          </div>
          <Button size="lg" className="w-full" icon="play" onClick={() => nav.push({ name: 'evaluation' })}>
            Start evaluation
          </Button>
        </Panel>
      ) : profile.programComplete && !active ? (
        <Panel title={`Cycle ${profile.cycle} complete`} glow>
          <p className="muted">
            You cleared all 31 missions. Real progress takes longer than a month — keep going with
            <b> Cycle {profile.cycle + 1}</b>.
          </p>
          <ul className="ngplus">
            <li>+{profile.cycle >= 3 ? 'max' : '20%'} reps, longer timed sets</li>
            <li>+{profile.cycle >= 3 ? 'max' : '15%'} XP per mission</li>
            <li>Your level, rank, stats, streak, achievements and goal carry over</li>
          </ul>
          {goalProgress(state.profile.body) && !goalProgress(state.profile.body).reached && (
            <p className="note small">
              Goal: about {goalProgress(state.profile.body).weeks} more weeks at your pace — that’s roughly{' '}
              {Math.max(1, Math.ceil((goalProgress(state.profile.body).weeks * 7) / 31))} more cycle
              {Math.ceil((goalProgress(state.profile.body).weeks * 7) / 31) > 1 ? 's' : ''}.
            </p>
          )}
          <Button size="lg" className="w-full" icon="play" onClick={() => { actions.startNextCycle(); nav.showToast({ icon: '∞', title: `Cycle ${profile.cycle + 1} begins`, body: 'New Game+ — missions are harder now.' }); }}>
            Begin Cycle {profile.cycle + 1}
          </Button>
          <Button variant="ghost" className="w-full mt8" onClick={() => nav.setTab('missions')}>Replay missions instead</Button>
        </Panel>
      ) : (
        mission && (
          <Panel
            title={active ? 'Mission in progress' : profile.doneToday ? 'Next mission' : "Today's mission"}
            className="today-card"
          >
            <div className="today-meta">
              <span className="day-chip">DAY {mission.day}</span>
              <DifficultyTag grade={mission.difficulty} />
              <span className="muted small">{TYPE_LABEL[mission.type]}</span>
            </div>
            <h2 className="mission-title">“{mission.title}”</h2>
            <p className="muted">{mission.brief}</p>
            <div className="today-facts">
              <span><Icon name="clock" size={16} /> ~{estimateMinutes(mission)} min</span>
              <span><Icon name="bolt" size={16} /> +{mission.xp} XP</span>
              <span>{phase?.name}</span>
            </div>
            {intensity.id !== 'normal' && mission.type !== 'mobility' && (
              <p className={`adapt-line tone-${intensity.tone}`}>Adapted to your goal pace · {intensity.label} difficulty</p>
            )}
            {profile.doneToday && !active && (
              <p className="note">✓ You already trained today. Recovery is part of the program — but you can continue if you feel good.</p>
            )}
            <Button
              size="lg"
              className="w-full"
              icon="play"
              onClick={() =>
                active
                  ? nav.push({ name: 'workout', day: active.day, resume: true })
                  : nav.push({ name: 'mission', day: mission.day })
              }
            >
              {active ? 'Resume mission' : 'Start mission'}
            </Button>
          </Panel>
        )
      )}

      {/* ── 31-day progress ── */}
      <Panel
        title={profile.cycle > 1 ? `Cycle ${profile.cycle} progress` : '31-day progress'}
        action={<span className="mono muted">Day {profile.daysDone} / {TOTAL_DAYS}</span>}
      >
        <ProgressBar value={profile.daysDone} max={TOTAL_DAYS} height={10} label="Program progress" />
        <div className="mini-grid" aria-hidden="true">
          {Array.from({ length: TOTAL_DAYS }, (_, i) => i + 1).map((d) => (
            <span
              key={d}
              className={`mini-cell ${profile.completedDays.has(d) ? 'done' : ''} ${d === profile.nextDay ? 'next' : ''} ${DAY_MAP[d].type === 'mobility' ? 'rest' : ''}`}
            />
          ))}
        </div>
      </Panel>

      {/* ── Quests ── */}
      {mission && !profile.programComplete && (
        <Panel title={`Day ${mission.day} quests`}>
          <QuestList day={mission.day} nav={nav} />
        </Panel>
      )}

      {profile.next && (
        <Panel title="Next rank">
          <div className="next-rank">
            <RankBadge rank={profile.next} />
            <div>
              <b>{profile.next.name}</b>
              <ul className="req-list">
                {rankRequirements(profile.next, profile.rankCtx).map((q) => (
                  <li key={q.label} className={q.ok ? 'ok' : ''}>
                    {q.day ? `${q.label}: ${DAY_MAP[q.day].title}` : q.label}
                  </li>
                ))}
              </ul>
              {profile.next.id === 'S' && !profile.rankCtx.goal && (
                <button className="link-btn small" onClick={() => nav.setTab('profile')}>Set a goal in Profile →</button>
              )}
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
