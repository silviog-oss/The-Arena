import { useCallback, useEffect, useRef, useState } from 'react';
import { useGame } from './state/GameContext.jsx';
import { BottomNav, Toast } from './components/UI.jsx';
import { useReminderScheduler } from './hooks/useSystem.js';
import Onboarding from './screens/Onboarding.jsx';
import Home from './screens/Home.jsx';
import Missions from './screens/Missions.jsx';
import MissionDetail from './screens/MissionDetail.jsx';
import Workout from './screens/Workout.jsx';
import Complete from './screens/Complete.jsx';
import Stats from './screens/Stats.jsx';
import Exercises from './screens/Exercises.jsx';
import ExerciseDetail from './screens/ExerciseDetail.jsx';
import Profile from './screens/Profile.jsx';

const TAB_KEY = 'arena.tab';

/**
 * Navigation model:
 *  - `tab` = the bottom-nav screen
 *  - `stack` = full-screen views on top (mission, workout, complete, exercise)
 * Each pushed view adds a browser history entry so the Android back
 * button / swipe-back closes it instead of leaving the app.
 */
export default function App() {
  const { state } = useGame();
  const [tab, setTabState] = useState(() => sessionStorage.getItem(TAB_KEY) || 'home');
  const [stack, setStack] = useState([]);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef();
  useReminderScheduler();

  const setTab = (t) => {
    setTabState(t);
    try {
      sessionStorage.setItem(TAB_KEY, t);
    } catch {
      /* ignore */
    }
    window.scrollTo(0, 0);
  };

  const push = useCallback((view) => {
    setStack((s) => [...s, view]);
    window.history.pushState({ depth: Date.now() }, '');
    window.scrollTo(0, 0);
  }, []);

  /** Replace the top view (no new history entry). */
  const replace = useCallback((view) => setStack((s) => [...s.slice(0, -1), view]), []);

  const pop = useCallback(() => window.history.back(), []);

  /** Close everything and return to a tab. */
  const closeAll = useCallback(
    (toTab) => {
      const n = stack.length;
      setStack([]);
      if (toTab) setTab(toTab);
      if (n > 0) window.history.go(-n);
    },
    [stack.length],
  );

  useEffect(() => {
    const onPop = () => setStack((s) => s.slice(0, -1));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const showToast = useCallback((t) => {
    clearTimeout(toastTimer.current);
    setToast({ ...t, id: Date.now() });
    toastTimer.current = setTimeout(() => setToast(null), t.ms || 2600);
  }, []);

  const nav = { push, pop, replace, closeAll, setTab, showToast };

  if (!state.profile.onboarded) return <Onboarding />;

  const top = stack[stack.length - 1];
  let view = null;
  if (top) {
    switch (top.name) {
      case 'mission':
        view = <MissionDetail day={top.day} nav={nav} />;
        break;
      case 'workout':
        view = <Workout day={top.day} resume={top.resume} nav={nav} />;
        break;
      case 'complete':
        view = <Complete result={top.result} nav={nav} />;
        break;
      case 'exercise':
        view = <ExerciseDetail id={top.id} nav={nav} />;
        break;
      default:
        view = null;
    }
  }

  const tabs = {
    home: <Home nav={nav} />,
    missions: <Missions nav={nav} />,
    stats: <Stats nav={nav} />,
    exercises: <Exercises nav={nav} />,
    profile: <Profile nav={nav} />,
  };

  return (
    <div className="app">
      {view ? (
        <div className="view" key={`${top.name}-${top.day || top.id || ''}`}>
          {view}
        </div>
      ) : (
        <>
          <main className="tab-screen" key={tab}>
            {tabs[tab]}
          </main>
          <BottomNav tab={tab} onChange={setTab} />
        </>
      )}
      <Toast toast={toast} />
    </div>
  );
}
