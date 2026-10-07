import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import { load, save, initialState, importData } from '../lib/storage.js';
import {
  completeDay, toggleQuest, startNextCycle, completeEvaluation, skipEvaluation,
  setReadiness, startRecoveryMode, endRecoveryMode, logRestDay,
} from '../lib/game.js';
import { dayForState, variationNeedsDb, hasDumbbells } from '../lib/modifiers.js';
import { deriveProfile, toDateKey } from '../lib/progression.js';
import { EXERCISE_MAP, defaultVariationIndex } from '../data/exercises.js';
import { dayFor as adaptedDay, intensityFor } from '../lib/intensity.js';

const GameContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'ONBOARD':
      return { ...state, profile: { ...state.profile, ...action.profile, onboarded: true } };
    case 'SET_BODY': {
      // Keep a weight log so goal progress can be tracked over time.
      const prev = state.profile.body;
      const body = { ...prev, ...action.body };
      if (action.body.weightKg && action.body.weightKg !== prev.weightKg) {
        const date = toDateKey();
        const log = (prev.weightLog || []).filter((e) => e.date !== date);
        body.weightLog = [...log, { date, kg: action.body.weightKg }].slice(-365);
      }
      return { ...state, profile: { ...state.profile, body } };
    }
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
      let idx = saved != null && ex.variations[saved] ? saved : defaultVariationIndex(ex, state.profile.experience);
      // Equipment profile: without dumbbells, never pick a variation that needs them.
      if (!hasDumbbells(state.settings) && variationNeedsDb(ex.variations[idx])) {
        const ok = ex.variations.map((v, i) => [v, i]).filter(([v]) => !variationNeedsDb(v));
        if (ok.length) idx = ok.reduce((best, cur) => (Math.abs(cur[1] - idx) < Math.abs(best[1] - idx) ? cur : best))[1];
      }
      return idx;
    },
    [state.settings.variations, state.settings.equipment, state.profile.experience],
  );

  const actions = useMemo(
    () => ({
      onboard: (p) => dispatch({ type: 'ONBOARD', profile: p }),
      setName: (name) => dispatch({ type: 'SET_NAME', name }),
      setBody: (body) => dispatch({ type: 'SET_BODY', body }),
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
      completeEvaluation: (payload) => {
        const { state: next, result } = completeEvaluation(stateRef.current, payload);
        dispatch({ type: 'REPLACE', state: next });
        return result;
      },
      setReadiness: (level, opts) => dispatch({ type: 'REPLACE', state: setReadiness(stateRef.current, level, opts) }),
      startRecoveryMode: (opts) => dispatch({ type: 'REPLACE', state: startRecoveryMode(stateRef.current, opts) }),
      endRecoveryMode: () => dispatch({ type: 'REPLACE', state: endRecoveryMode(stateRef.current) }),
      logRestDay: () => dispatch({ type: 'REPLACE', state: logRestDay(stateRef.current) }),
      markAwayHandled: () => dispatch({ type: 'REPLACE', state: { ...stateRef.current, awayHandled: toDateKey() } }),
      setSub: (exId, to) => {
        const subs = { ...(stateRef.current.settings.subs || {}) };
        if (to) subs[exId] = to;
        else delete subs[exId];
        dispatch({ type: 'SETTINGS', patch: { subs } });
      },
      setEquipment: (patch) =>
        dispatch({ type: 'SETTINGS', patch: { equipment: { ...stateRef.current.settings.equipment, ...patch } } }),
      setDbWeight: (exId, kg) =>
        dispatch({ type: 'SETTINGS', patch: { dbWeights: { ...(stateRef.current.settings.dbWeights || {}), [exId]: kg } } }),
      addMeasurement: (m) => {
        const body = stateRef.current.profile.body;
        const date = toDateKey();
        const list = (body.measurements || []).filter((x) => x.date !== date);
        dispatch({ type: 'SET_BODY', body: { measurements: [...list, { ...m, date }].slice(-200) } });
      },
      skipEvaluation: () => dispatch({ type: 'REPLACE', state: skipEvaluation(stateRef.current) }),
      startNextCycle: () => dispatch({ type: 'REPLACE', state: startNextCycle(stateRef.current) }),
      importBackup: (text) => dispatch({ type: 'REPLACE', state: importData(text) }),
      reset: () => dispatch({ type: 'RESET' }),
    }),
    [],
  );

  const body = state.profile.body;
  const intensity = useMemo(() => intensityFor(body), [body]);
  const cycle = state.cycle || 1;
  const dayFor = useCallback((d) => dayForState(d, state), [state]);

  const value = useMemo(
    () => ({ state, profile, actions, variationFor, dayFor, intensity }),
    [state, profile, actions, variationFor, dayFor, intensity],
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export const useGame = () => useContext(GameContext);
