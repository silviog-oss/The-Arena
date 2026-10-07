import { useGame } from '../state/GameContext.jsx';
import { DAY_MAP, TOTAL_DAYS, TYPE_LABEL, phaseForDay } from '../data/program.js';
import { estimateMinutes } from '../lib/progression.js';
import { Wordmark } from '../components/Logo.jsx';
import { Panel, XPBar, RankBadge, StreakChip, Button, ProgressBar, DifficultyTag, Pill } from '../components/UI.jsx';
import { Icon } from '../components/Icons.jsx';
import QuestList from '../components/QuestList.jsx';
import { useOnline } from '../hooks/useSystem.js';
import { bmi, bmiCategory, bodyComplete, goalProgress } from '../lib/body.js';

export default function Home({ nav }) {
  const { state, profile } = useGame();
  const online = useOnline();
  const name = state.profile.name || 'Hunter';
  const active = state.activeWorkout;
  const day = active?.day || profile.nextDay;
  const mission = day ? DAY_MAP[day] : null;
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
      {profile.programComplete && !active ? (
        <Panel title="Program complete" glow>
          <p className="muted">
            You cleared all 31 missions. Replay any mission from the Missions tab to keep training — or start a new
            cycle from Profile.
          </p>
          <Button className="w-full" onClick={() => nav.setTab('missions')}>View missions</Button>
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
      <Panel title="31-day progress" action={<span className="mono muted">Day {profile.daysDone} / {TOTAL_DAYS}</span>}>
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
                <li className={profile.level >= profile.next.minLevel ? 'ok' : ''}>Reach Level {profile.next.minLevel}</li>
                <li className={profile.daysDone >= profile.next.minWorkouts ? 'ok' : ''}>{profile.next.minWorkouts} missions completed</li>
                {profile.next.trial && (
                  <li className={profile.completedDays.has(profile.next.trial) ? 'ok' : ''}>
                    Clear Day {profile.next.trial}: {DAY_MAP[profile.next.trial].title}
                  </li>
                )}
              </ul>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
