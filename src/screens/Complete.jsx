import { useEffect } from 'react';
import { useGame } from '../state/GameContext.jsx';
import { ACHIEVEMENT_MAP } from '../data/achievements.js';
import { TOTAL_DAYS } from '../data/program.js';
import { STAT_KEYS, STAT_INFO } from '../lib/progression.js';
import { notify, MESSAGES } from '../lib/notifications.js';
import { Button, CountUp, RankBadge, Panel } from '../components/UI.jsx';
import { LogoMark } from '../components/Logo.jsx';
import QuestList from '../components/QuestList.jsx';

export default function Complete({ result, nav }) {
  const { state } = useGame();
  const levelUp = result.levelAfter > result.levelBefore;
  const rankUp = result.rankAfter.id !== result.rankBefore.id;
  const mins = Math.max(1, Math.round(result.seconds / 60));

  useEffect(() => {
    const n = state.settings.notifications;
    if (rankUp && n.enabled && n.levelUp) {
      const m = MESSAGES.rankUp(result.rankAfter.name);
      notify(m.title, m.body, { tag: 'arena-rank' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="screen complete">
      <div className="complete-hero">
        <div className="burst" aria-hidden="true" />
        <LogoMark size={84} glow className="pop" />
        <p className="eyebrow fade d1">{result.replay ? 'Training replay' : 'System message'}</p>
        <h1 className="complete-title fade d1">MISSION COMPLETE</h1>
        <p className="muted fade d2">Day {result.day} · “{result.title}” · {mins} min</p>
      </div>

      {!result.replay ? (
        <Panel className="reward-panel fade d2">
          <div className="xp-reward">
            <CountUp to={result.xp} prefix="+" suffix=" XP" />
          </div>
          <ul className="stat-gains">
            {STAT_KEYS.filter((k) => result.stats[k] > 0).map((k, i) => (
              <li key={k} className="fade" style={{ animationDelay: `${0.5 + i * 0.12}s` }}>
                <span style={{ color: STAT_INFO[k].color }}>{STAT_INFO[k].name.toUpperCase()}</span>
                <b>+{result.stats[k]}</b>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Panel className="fade d2">
          <p className="muted">Replays don’t grant XP, but your training time was added ({mins} min).</p>
        </Panel>
      )}

      <div className="summary-row fade d3">
        <div>
          <small>Progress</small>
          <b>DAY {result.daysDone} / {TOTAL_DAYS}</b>
        </div>
        <div>
          <small>Streak</small>
          <b>🔥 {result.streak} {result.streak === 1 ? 'DAY' : 'DAYS'}</b>
        </div>
      </div>

      {levelUp && (
        <Panel className="levelup fade d3" glow>
          <span className="eyebrow">Level up</span>
          <h2>
            LEVEL {result.levelBefore} → <span className="level-num">{result.levelAfter}</span>
          </h2>
        </Panel>
      )}

      {rankUp && (
        <Panel className="rankup fade d4" glow>
          <RankBadge rank={result.rankAfter} size="lg" />
          <div>
            <span className="eyebrow">Rank advancement</span>
            <h2>{result.rankAfter.name}</h2>
            <p className="muted small">{result.rankAfter.perk}</p>
          </div>
        </Panel>
      )}

      {result.newAchievements.length > 0 && (
        <Panel title="Achievements unlocked" className="fade d4">
          <ul className="ach-mini">
            {result.newAchievements.map((id) => (
              <li key={id}>
                <span className="ach-icon">{ACHIEVEMENT_MAP[id].icon}</span>
                <div>
                  <b>{ACHIEVEMENT_MAP[id].name}</b>
                  <small>{ACHIEVEMENT_MAP[id].desc}</small>
                </div>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {!result.replay && (
        <Panel title="Optional quests" className="fade d4">
          <QuestList day={result.day} nav={nav} />
        </Panel>
      )}

      <div className="stack pad-b">
        <Button size="lg" className="w-full" onClick={() => nav.closeAll('home')}>
          Return to base
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => nav.closeAll('stats')}>
          View stats
        </Button>
      </div>
    </div>
  );
}
