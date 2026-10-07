/**
 * Body metrics: BMI, unit conversion and a daily water target.
 * Everything is stored in metric (kg, cm) and converted for display.
 */

export const LB_PER_KG = 2.20462;
export const CM_PER_IN = 2.54;

export const kgToLb = (kg) => kg * LB_PER_KG;
export const lbToKg = (lb) => lb / LB_PER_KG;
export const cmToFtIn = (cm) => {
  const totalIn = cm / CM_PER_IN;
  let ft = Math.floor(totalIn / 12);
  let inch = Math.round(totalIn - ft * 12);
  if (inch === 12) {
    ft += 1;
    inch = 0;
  }
  return { ft, inch };
};
export const ftInToCm = (ft, inch) => (Number(ft || 0) * 12 + Number(inch || 0)) * CM_PER_IN;

/** BMI = kg / m². Returns null if data is missing or implausible. */
export function bmi(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm) / 100;
  if (!w || !h || w < 20 || w > 400 || h < 1 || h > 2.6) return null;
  return Math.round((w / (h * h)) * 10) / 10;
}

/** WHO adult categories. Under 18, BMI must be read on age/sex percentile charts. */
export function bmiCategory(value, age) {
  if (value == null) return null;
  if (age != null && age < 18) {
    return {
      label: 'Use youth chart',
      tone: 'muted',
      note: 'For under-18s, BMI is judged against age and sex percentiles, not adult ranges.',
    };
  }
  if (value < 18.5) return { label: 'Underweight', tone: 'warn', note: 'Below the 18.5–24.9 healthy range.' };
  if (value < 25) return { label: 'Healthy range', tone: 'ok', note: 'Within the 18.5–24.9 healthy range.' };
  if (value < 30) return { label: 'Overweight', tone: 'warn', note: 'Above the 18.5–24.9 healthy range.' };
  return { label: 'Obesity range', tone: 'danger', note: 'BMI of 30 or above.' };
}

export const BMI_NOTE =
  'BMI is a quick screening number based only on height and weight. It does not measure body fat or muscle, so very muscular people can read high. Talk to a doctor for a real health assessment.';

/**
 * Daily water target: ~35 ml per kg of body weight, rounded to 250 ml,
 * kept between 1.5 L and 4 L. Defaults to 2 L when weight is unknown.
 * Training days need more — drink extra when you sweat.
 */
export function waterTargetMl(weightKg) {
  const w = Number(weightKg);
  if (!w) return 2000;
  const ml = Math.round((w * 35) / 250) * 250;
  return Math.min(4000, Math.max(1500, ml));
}

export const formatWater = (ml) => `${(ml / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} L (${ml.toLocaleString()} ml)`;

/** Fill quest text placeholders, e.g. "{water}" → "2.5 L (2,500 ml)". */
export function questText(text, body) {
  return text.replace('{water}', formatWater(waterTargetMl(body?.weightKg)));
}

export const SEX_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'other', label: 'Prefer not to say' },
];

export const bodyComplete = (b) => !!(b && b.age && b.weightKg && b.heightCm && b.sex);

export function formatWeight(kg, units) {
  if (!kg) return '—';
  return units === 'imperial' ? `${Math.round(kgToLb(kg))} lb` : `${Math.round(kg * 10) / 10} kg`;
}
export function formatHeight(cm, units) {
  if (!cm) return '—';
  if (units === 'imperial') {
    const { ft, inch } = cmToFtIn(cm);
    return `${ft}′ ${inch}″`;
  }
  return `${Math.round(cm)} cm`;
}

/* ───────── Goals ───────── */
export const MIN_GOAL_BMI = 18.5; // never allow a goal below the healthy range
export const weightForBmi = (b, heightCm) => Math.round(b * (heightCm / 100) ** 2 * 10) / 10;
export const healthyRangeKg = (heightCm) => [weightForBmi(18.5, heightCm), weightForBmi(24.9, heightCm)];

/** Validate a goal weight; returns an error string or null. */
export function goalError(goalKg, heightCm) {
  const b = bmi(goalKg, heightCm);
  if (b == null) return 'Enter a valid goal.';
  if (b < MIN_GOAL_BMI) return `That goal is below a healthy BMI of ${MIN_GOAL_BMI}. Choose at least ${weightForBmi(MIN_GOAL_BMI, heightCm)} kg.`;
  return null;
}

/**
 * Progress toward the goal. Works for losing or gaining weight.
 * Pace estimate uses 0.5 kg/week — a sustainable rate for most people.
 */
export function goalProgress(body) {
  const g = body?.goal;
  if (!g || !body.weightKg) return null;
  const start = g.startKg;
  const target = g.weightKg;
  const current = body.weightKg;
  const total = Math.abs(target - start);
  const direction = target < start ? 'lose' : target > start ? 'gain' : 'maintain';
  const remaining = Math.round((direction === 'lose' ? current - target : target - current) * 10) / 10;
  const reached = direction === 'maintain' ? Math.abs(current - target) <= 1 : remaining <= 0;
  const done = total === 0 ? 1 : Math.max(0, Math.min(1, (total - Math.max(0, remaining)) / total));
  const weeks = reached ? 0 : Math.ceil(Math.max(0, remaining) / 0.5);
  return { start, target, current, direction, remaining: Math.max(0, remaining), reached, pct: done * 100, weeks, targetBmi: bmi(target, body.heightCm) };
}
