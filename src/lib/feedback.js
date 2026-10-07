/**
 * Sound + haptics. Uses WebAudio beeps (no audio files → works offline).
 * iOS requires the AudioContext to be created/resumed inside a user tap,
 * so call unlockAudio() from a button handler (e.g. "Start").
 */
let ctx = null;

export function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

export function beep({ freq = 880, duration = 0.12, volume = 0.15, type = 'sine' } = {}) {
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  } catch {
    /* ignore */
  }
}

export const sounds = {
  tick: () => beep({ freq: 660, duration: 0.08 }),
  go: () => {
    beep({ freq: 880, duration: 0.15 });
    setTimeout(() => beep({ freq: 1320, duration: 0.2 }), 140);
  },
  rest: () => beep({ freq: 520, duration: 0.25, type: 'triangle' }),
  complete: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep({ freq: f, duration: 0.18 }), i * 120)),
};

export function vibrate(pattern) {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    /* iOS Safari has no vibration API — silently ignored */
  }
}
