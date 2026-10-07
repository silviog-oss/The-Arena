import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { load, save, initialState, importData } from '../lib/storage.js';
import { completeDay, toggleQuest } from '../lib/game.js';
import { deriveProfile } from '../lib/progression.js';
import { EXERCISE_MAP, defaultVariationIndex } from '../data/exercises.js';

const GameContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'ONBOARD':
      return { ...state, profile: { ...state.profile, ...action.profile, onboarded: true } };
    case 'SET_NAME':
      return { ...state, profile: { ...state.profile, name: action.name } };
    case 'REPLACE':
      return action.state;
    case 'SET_VARIATION':
      return {
        ...state,
        settings: { ...state.settings, variations: { ...state.settings.variations, [action.id]: action.index } },
      };
    case 'SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'NOTIFY_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, notifications: { ...state.settings.notifications, ...action.patch } },
      };
    case 'MARK_NOTIFIED':
      return {
        ...state,
        settings: { ...state.settings, lastNotified: { ...state.settings.lastNotified, [action.kind]: action.date } },
      };
    case 'SET_ACTIVE':
      return { ...state, activeWorkout: action.active };
    case 'RESET':
      return { ...initialState(), profile: { ...initialState().profile } };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => save(state), [state]);

  const profile = useMemo(() => deriveProfile(state), [state]);

  const variationFor = useCallback(
    (exId) => {
      const ex = EXERCISE_MAP[exId];
      const saved = state.settings.variations[exId];
      if (saved != null && ex.variations[saved]) return saved;
      return defaultVariationIndex(ex, state.profile.experience);
    },
    [state.settings.variations, state.profile.experience],
  );

  const actions = useMemo(
    () => ({
      onboard: (p) => dispatch({ type: 'ONBOARD', profile: p }),
      setName: (name) => dispatch({ type: 'SET_NAME', name }),
      setVariation: (id, index) => dispatch({ type: 'SET_VARIATION', id, index }),
      updateSettings: (patch) => dispatch({ type: 'SETTINGS', patch }),
      updateNotifications: (patch) => dispatch({ type: 'NOTIFY_SETTINGS', patch }),
      markNotified: (kind, date) => dispatch({ type: 'MARK_NOTIFIED', kind, date }),
      setActive: (active) => dispatch({ type: 'SET_ACTIVE', active }),
      /** Returns the completion result for the summary screen. */
      completeDay: (payload) => {
        const { state: next, result } = completeDay(stateRef.current, payload);
        dispatch({ type: 'REPLACE', state: next });
        return result;
      },
      toggleQuest: (day, kind) => {
        const r = toggleQuest(stateRef.current, day, kind);
        dispatch({ type: 'REPLACE', state: r.state });
        return r;
      },
      importBackup: (text) => dispatch({ type: 'REPLACE', state: importData(text) }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [],
  );

  const value = useMemo(
    () => ({ state, profile, actions, variationFor }),
    [state, profile, actions, variationFor],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => useContext(GameContext);
