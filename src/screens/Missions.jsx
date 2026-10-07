import { useGame } from '../state/GameContext.jsx';
import { PHASES, PROGRAM, TYPE_LABEL, TOTAL_DAYS } from '../data/program.js';
import { estimateMinutes } from '../lib/progression.js';
import { ScreenHeader, DifficultyTag } from '../components/UI.jsx';
import { Icon } from '../components/Icons.jsx';

export default function Missions({ nav }) {
  const { profile, dayFor, intensity } = useGame();

  return (
    <div className="screen">
      <ScreenHeader title="Missions" sub={`${profile.cycle > 1 ? `Cycle ${profile.cycle} · ` : ''}${profile.daysDone} of ${TOTAL_DAYS} cleared`} />
      {intensity.id !== 'normal' && (
        <p className={`note adapt-note tone-border-${intensity.tone}`}>
          Difficulty: <b className={`tone-${intensity.tone}`}>{intensity.label}</b> — {intensity.summary}. Change your goal pace in Profile.
        </p>
      )}
      {PHASES.map((ph) => {
        const days = PROGRAM.filter((d) => d.day >= ph.days[0] && d.day <= ph.days[1]).map((d) => dayFor(d.day));
        const done = days.filter((d) => profile.completedDays.has(d.day)).length;
        return (
          <section key={ph.id} className="phase">
            <header className="phase-head">
              <div>
                <span className="eyebrow">Phase {ph.id} · Days {ph.days[0]}{ph.days[1] !== ph.days[0] ? `–${ph.days[1]}` : ''}</span>
                <h2>{ph.name}</h2>
              </div>
              <span className="mono muted">{done}/{days.length}</span>
            </header>
            <p className="phase-blurb muted small">{ph.blurb}</p>
            <div className="day-list">
              {days.map((d) => {
                const isDone = profile.completedDays.has(d.day);
                const isNext = d.day === profile.nextDay;
                const locked = !isDone && !isNext;
                return (
                  <button
                    key={d.day}
                    className={`day-card ${isDone ? 'done' : ''} ${isNext ? 'next' : ''} ${locked ? 'locked' : ''} type-${d.type}`}
                    onClick={() => nav.push({ name: 'mission', day: d.day })}
                  >
                    <span className="day-num">
                      <small>DAY</small>
                      {d.day}
                    </span>
                    <span className="day-info">
                      <b>{d.title}</b>
                      <small>
                        {TYPE_LABEL[d.type]} · ~{estimateMinutes(d)} min · +{d.xp} XP
                      </small>
                    </span>
                    <span className="day-status">
                      <DifficultyTag grade={d.difficulty} />
                      {isDone ? (
                        <Icon name="check" size={18} className="ok" />
                      ) : locked ? (
                        <Icon name="lock" size={16} className="muted" />
                      ) : (
                        <Icon name="chevron" size={18} />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
