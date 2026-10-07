import { useGame } from '../state/GameContext.jsx';
import { DAY_MAP, QUEST_XP } from '../data/program.js';
import { Icon } from './Icons.jsx';
import { notify, MESSAGES } from '../lib/notifications.js';

/** Main / daily / bonus quests for a day. Optional quests toggle XP on/off. */
export default function QuestList({ day, nav }) {
  const { state, profile, actions } = useGame();
  const def = DAY_MAP[day];
  const q = state.quests[day] || {};
  const mainDone = profile.completedDays.has(day);

  const toggle = (kind) => {
    const r = actions.toggleQuest(day, kind);
    if (r.delta > 0) nav?.showToast({ icon: '✦', title: `+${r.delta} XP`, body: 'Optional quest complete' });
    if (r.levelUp) {
      nav?.showToast({ icon: '▲', title: 'Level up!', body: 'Your power grows.' });
      if (state.settings.notifications.enabled && state.settings.notifications.levelUp) {
        const m = MESSAGES.levelUp(profile.level + 1);
        notify(m.title, m.body, { tag: 'arena-level' });
      }
    }
  };

  return (
    <ul className="quest-list">
      <li className={`quest main ${mainDone ? 'done' : ''}`}>
        <span className="quest-check">{mainDone && <Icon name="check" size={16} />}</span>
        <div>
          <span className="quest-kind">Main quest</span>
          <p>Complete today’s workout</p>
        </div>
        <span className="quest-xp">+{def.xp}</span>
      </li>
      {['daily', 'bonus'].map((kind) => (
        <li key={kind}>
          <button className={`quest ${q[kind] ? 'done' : ''}`} onClick={() => toggle(kind)} aria-pressed={!!q[kind]}>
            <span className="quest-check">{q[kind] && <Icon name="check" size={16} />}</span>
            <div>
              <span className="quest-kind">{kind === 'daily' ? 'Daily quest' : 'Bonus quest'} · optional</span>
              <p>{def[kind]}</p>
            </div>
            <span className="quest-xp">+{QUEST_XP[kind]}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
