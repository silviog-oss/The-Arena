import { EXERCISE_MAP } from '../data/exercises.js';
import { itemsWithWarmup } from './progression.js';

/**
 * Turn a day definition into a flat list of timer steps:
 *   prep → work → rest → work → rest … → done
 * Timed per-side exercises become two work steps (Left / Right).
 * Rep-based per-side exercises are one step showing "each side".
 *
 * Step: { kind: 'prep'|'work'|'rest', exId, itemIndex, set, sets,
 *         reps?, time?, perSide, side?, warmup, note, nextLabel }
 */
export function buildSteps(dayDef) {
  const items = itemsWithWarmup(dayDef);
  const steps = [{ kind: 'prep', time: 10, itemIndex: 0 }];

  items.forEach((item, itemIndex) => {
    const ex = EXERCISE_MAP[item.ex];
    const isLastItem = itemIndex === items.length - 1;
    for (let set = 1; set <= item.sets; set++) {
      const base = {
        kind: 'work',
        exId: item.ex,
        itemIndex,
        set,
        sets: item.sets,
        warmup: !!item.warmup,
        note: item.note || null,
        perSide: !!ex.perSide,
      };
      if (item.time) {
        if (ex.perSide) {
          steps.push({ ...base, time: item.time, side: 'Left' });
          steps.push({ ...base, time: item.time, side: 'Right' });
        } else {
          steps.push({ ...base, time: item.time });
        }
      } else {
        steps.push({ ...base, reps: item.reps });
      }
      const isLastSet = set === item.sets;
      if (!(isLastItem && isLastSet) && item.rest > 0) {
        steps.push({ kind: 'rest', time: item.rest, itemIndex, set, sets: item.sets });
      }
    }
  });

  // Attach "up next" labels for rest/prep screens.
  for (let i = 0; i < steps.length; i++) {
    const nextWork = steps.slice(i + 1).find((s) => s.kind === 'work');
    steps[i].nextExId = nextWork?.exId || null;
    steps[i].nextStep = nextWork || null;
  }
  return steps;
}

export const workCount = (steps) => steps.filter((s) => s.kind === 'work').length;

export function describeTarget(step) {
  if (!step) return '';
  if (step.time) return `${step.time} sec${step.side ? ` · ${step.side}` : ''}`;
  return `${step.reps} reps${step.perSide ? ' each side' : ''}`;
}

export function describeItem(item, ex) {
  const side = ex?.perSide ? ' each side' : '';
  return item.time ? `${item.sets} × ${item.time} sec${side}` : `${item.sets} × ${item.reps}${side}`;
}
