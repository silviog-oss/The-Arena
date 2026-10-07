/**
 * Simple stick-figure poses for every exercise (original illustrations).
 * Each exercise has pose A (start) and pose B (end); the figure animates between them.
 * Coordinates are in a 100 × 66 viewBox (y from -6 to 60), floor at y = 58.
 * Joints: head, sh (shoulder), mid (optional spine point), hip, el/ha (arm),
 * kn/ft (leg). el2/ha2/kn2/ft2 = the far-side limbs (drawn fainter).
 * Props: db (dumbbell in hand), wall (x position), view: 'side' | 'front'.
 */

const stand = {
  head: [50, 9], sh: [50, 17], hip: [50, 35],
  el: [50, 26], ha: [50, 34], kn: [50, 46], ft: [50, 57],
};
const standFront = {
  head: [50, 9], sh: [50, 17], hip: [50, 35],
  el: [46, 26], ha: [45, 34], el2: [54, 26], ha2: [55, 34],
  kn: [48, 46], ft: [47, 57], kn2: [52, 46], ft2: [53, 57],
};
const plankHigh = {
  head: [80, 43], sh: [72, 47], hip: [46, 51], el: [72, 52], ha: [72, 57],
  kn: [33, 54], ft: [20, 57],
};
const pushDown = { ...plankHigh, head: [80, 50], sh: [72, 53], hip: [46, 55], el: [64, 53], kn: [33, 56] };
const forearmPlank = {
  head: [79, 45], sh: [70, 48], hip: [46, 51], el: [70, 57], ha: [80, 57], kn: [33, 54], ft: [20, 57],
};
const squatDown = {
  head: [53, 21], sh: [49, 28], hip: [38, 43], el: [58, 30], ha: [67, 30], kn: [55, 45], ft: [50, 57],
};
const standArmsFwd = { ...stand, el: [57, 22], ha: [65, 22] };
const backLying = { head: [21, 53], sh: [29, 55], hip: [47, 56] };
const shift = (pose, dx, dy, keep = []) =>
  Object.fromEntries(Object.entries(pose).map(([k, v]) => [k, Array.isArray(v) && !keep.includes(k) ? [v[0] + dx, v[1] + dy] : v]));
const mirror = (pose) =>
  Object.fromEntries(Object.entries(pose).map(([k, v]) => [k, Array.isArray(v) ? [100 - v[0], v[1]] : v]));

const skaterA = {
  head: [43, 15], sh: [44, 22], hip: [42, 38], el: [50, 28], ha: [56, 32], el2: [38, 28], ha2: [33, 33],
  kn: [40, 47], ft: [38, 57], kn2: [50, 47], ft2: [57, 54],
};

export const POSES = {
  pushup: { a: plankHigh, b: pushDown },
  diamond_pushup: { a: plankHigh, b: { ...pushDown, el: [68, 54] } },
  pike_pushup: {
    a: { head: [66, 49], sh: [61, 43], hip: [42, 28], el: [64, 50], ha: [66, 57], kn: [33, 43], ft: [26, 57] },
    b: { head: [70, 54], sh: [62, 49], hip: [42, 30], el: [58, 54], ha: [66, 57], kn: [33, 44], ft: [26, 57] },
  },
  db_press: {
    a: { ...stand, el: [55, 25], ha: [53, 17], db: true },
    b: { ...stand, el: [51, 7], ha: [51, -2], db: true },
  },
  db_floor_press: {
    a: { ...backLying, el: [31, 58], ha: [33, 48], kn: [61, 45], ft: [68, 57], db: true },
    b: { ...backLying, el: [32, 46], ha: [33, 37], kn: [61, 45], ft: [68, 57], db: true },
  },
  db_row: {
    a: { head: [71, 26], sh: [64, 30], hip: [44, 36], el: [64, 40], ha: [64, 50], kn: [48, 46], ft: [46, 57], el2: [68, 38], ha2: [62, 44], db: true },
    b: { head: [71, 26], sh: [64, 30], hip: [44, 36], el: [55, 28], ha: [59, 37], kn: [48, 46], ft: [46, 57], el2: [68, 38], ha2: [62, 44], db: true },
  },
  superman: {
    a: { head: [72, 54], sh: [64, 56], hip: [44, 56], el: [76, 56], ha: [87, 56], kn: [30, 56], ft: [17, 56] },
    b: { head: [72, 50], sh: [64, 54], hip: [44, 57], el: [76, 51], ha: [87, 46], kn: [30, 54], ft: [17, 50] },
  },
  squat: { a: standArmsFwd, b: squatDown },
  goblet_squat: {
    a: { ...stand, el: [55, 28], ha: [55, 21], db: true },
    b: { ...squatDown, el: [56, 36], ha: [55, 28], db: true },
  },
  lunge: {
    a: { ...stand, el: [53, 27], ha: [52, 35], kn2: [49, 46], ft2: [49, 57] },
    b: { head: [48, 15], sh: [48, 23], hip: [47, 40], el: [51, 32], ha: [50, 40], kn: [60, 46], ft: [62, 57], kn2: [40, 56], ft2: [29, 57] },
  },
  db_rdl: {
    a: { ...stand, el: [52, 27], ha: [53, 36], db: true },
    b: { head: [69, 28], sh: [62, 31], hip: [40, 36], el: [62, 40], ha: [62, 48], kn: [47, 46], ft: [49, 57], db: true },
  },
  glute_bridge: {
    a: { ...backLying, el: [38, 57], ha: [47, 57], kn: [60, 44], ft: [66, 57] },
    b: { ...backLying, hip: [46, 44], el: [38, 57], ha: [47, 57], kn: [60, 42], ft: [66, 57] },
  },
  wall_sit: {
    a: { head: [43, 18], sh: [43, 26], hip: [43, 42], el: [50, 32], ha: [52, 40], kn: [59, 42], ft: [59, 57], wall: 39 },
    b: { head: [43, 18], sh: [43, 26], hip: [43, 42], el: [50, 33], ha: [52, 41], kn: [59, 42], ft: [59, 57], wall: 39 },
  },
  calf_raise: { a: stand, b: { ...shift(stand, 0, -3), ft: [52, 57] } },
  plank: { a: forearmPlank, b: { ...forearmPlank, hip: [46, 50] } },
  side_plank: {
    a: { head: [75, 39], sh: [68, 45], hip: [45, 53], el: [68, 57], ha: [77, 57], el2: [62, 49], ha2: [55, 51], kn: [32, 55], ft: [19, 57] },
    b: { head: [75, 36], sh: [68, 42], hip: [45, 47], el: [68, 57], ha: [77, 57], el2: [60, 44], ha2: [52, 46], kn: [32, 52], ft: [19, 57] },
  },
  dead_bug: {
    a: { ...backLying, el: [30, 47], ha: [31, 39], kn: [56, 43], ft: [67, 43] },
    b: { ...backLying, el: [23, 50], ha: [15, 52], kn: [66, 52], ft: [79, 54] },
  },
  hollow_hold: {
    a: { head: [30, 47], sh: [37, 51], hip: [52, 56], el: [30, 46], ha: [22, 43], kn: [64, 52], ft: [77, 48] },
    b: { head: [30, 46], sh: [37, 50], hip: [52, 56], el: [30, 45], ha: [22, 42], kn: [64, 51], ft: [77, 47] },
  },
  bear_crawl: {
    a: { head: [71, 39], sh: [64, 42], hip: [44, 42], el: [65, 50], ha: [66, 57], kn: [39, 50], ft: [30, 57] },
    b: { head: [74, 39], sh: [67, 42], hip: [47, 42], el: [69, 50], ha: [71, 57], kn: [43, 50], ft: [37, 57] },
  },
  mountain_climber: {
    a: { ...plankHigh, kn2: [33, 54], ft2: [20, 57] },
    b: { ...plankHigh, kn2: [57, 50], ft2: [48, 55] },
  },
  jumping_jack: {
    a: standFront,
    b: { ...standFront, el: [41, 9], ha: [37, 1], el2: [59, 9], ha2: [63, 1], kn: [44, 46], ft: [38, 57], kn2: [56, 46], ft2: [62, 57], view: 'front' },
  },
  high_knees: {
    a: { ...stand, el: [55, 25], ha: [60, 20], el2: [45, 26], ha2: [43, 33], kn2: [50, 46], ft2: [50, 57] },
    b: { ...shift(stand, 0, -2), el: [45, 26], ha: [43, 33], el2: [55, 25], ha2: [60, 20], kn: [61, 33], ft: [60, 45], kn2: [50, 45], ft2: [50, 57] },
  },
  jog_in_place: {
    a: { ...stand, el: [55, 25], ha: [59, 21], kn2: [50, 46], ft2: [50, 57] },
    b: { ...shift(stand, 0, -1), el: [46, 26], ha: [45, 33], el2: [55, 25], ha2: [59, 21], kn: [56, 40], ft: [51, 51], kn2: [50, 45], ft2: [50, 57] },
  },
  skater: { a: skaterA, b: mirror(skaterA) },
  burpee: { a: standArmsFwd, b: plankHigh },
  db_thruster: {
    a: { ...squatDown, el: [55, 32], ha: [53, 24], db: true },
    b: { ...stand, el: [51, 7], ha: [51, -2], db: true },
  },
  shadow_box: {
    a: { ...stand, el: [56, 24], ha: [58, 17], el2: [54, 26], ha2: [56, 19], kn2: [46, 46], ft2: [43, 57] },
    b: { ...stand, el: [63, 18], ha: [74, 17], el2: [54, 26], ha2: [56, 19], kn2: [46, 46], ft2: [43, 57] },
  },
  inchworm: {
    a: { head: [59, 50], sh: [56, 43], hip: [50, 33], el: [58, 50], ha: [59, 57], kn: [50, 45], ft: [49, 57] },
    b: plankHigh,
  },
  arm_circles: {
    a: { ...standFront, el: [39, 18], ha: [29, 18], el2: [61, 18], ha2: [71, 18] },
    b: { ...standFront, el: [39, 15], ha: [29, 10], el2: [61, 15], ha2: [71, 10] },
  },
  cat_cow: {
    a: { head: [72, 37], sh: [64, 44], mid: [52, 48], hip: [40, 44], el: [64, 51], ha: [64, 57], kn: [40, 57], ft: [27, 57] },
    b: { head: [70, 50], sh: [64, 44], mid: [52, 37], hip: [40, 44], el: [64, 51], ha: [64, 57], kn: [40, 57], ft: [27, 57] },
  },
  worlds_greatest: {
    a: { head: [64, 32], sh: [58, 37], hip: [46, 46], el: [60, 47], ha: [61, 57], kn: [60, 46], ft: [62, 57], kn2: [35, 55], ft2: [24, 57] },
    b: { head: [62, 30], sh: [58, 37], hip: [46, 46], el: [57, 27], ha: [57, 17], kn: [60, 46], ft: [62, 57], kn2: [35, 55], ft2: [24, 57] },
  },
  hip_flexor: {
    a: { head: [44, 18], sh: [44, 26], hip: [44, 44], el: [41, 34], ha: [45, 41], kn: [60, 45], ft: [62, 57], kn2: [41, 57], ft2: [28, 57] },
    b: { head: [48, 18], sh: [48, 26], hip: [49, 45], el: [45, 34], ha: [49, 41], kn: [61, 45], ft: [62, 57], kn2: [41, 57], ft2: [28, 57] },
  },
  deep_squat_hold: {
    a: { head: [52, 25], sh: [50, 32], hip: [44, 50], el: [56, 40], ha: [53, 36], kn: [57, 44], ft: [52, 57] },
    b: { head: [52, 26], sh: [50, 33], hip: [44, 51], el: [56, 41], ha: [53, 37], kn: [57, 44], ft: [52, 57] },
  },
  hamstring_stretch: {
    a: { ...backLying, el: [38, 47], ha: [50, 42], kn: [55, 46], ft: [61, 36], kn2: [61, 56], ft2: [73, 57] },
    b: { ...backLying, el: [37, 45], ha: [49, 38], kn: [53, 43], ft: [55, 31], kn2: [61, 56], ft2: [73, 57] },
  },
  thoracic_rotation: {
    a: { head: [22, 50], sh: [30, 52], hip: [50, 54], el: [39, 50], ha: [47, 49], kn: [60, 47], ft: [66, 56] },
    b: { head: [22, 49], sh: [30, 52], hip: [50, 54], el: [23, 45], ha: [15, 49], kn: [60, 47], ft: [66, 56] },
  },
  childs_pose: {
    a: { head: [67, 54], sh: [58, 51], hip: [38, 50], el: [70, 56], ha: [81, 57], kn: [53, 57], ft: [34, 57] },
    b: { head: [67, 53], sh: [58, 49], hip: [38, 48], el: [70, 56], ha: [81, 57], kn: [53, 57], ft: [34, 57] },
  },
};

// Front-view flag for symmetric moves
for (const k of ['jumping_jack', 'arm_circles', 'skater']) {
  POSES[k].a = { ...POSES[k].a, view: 'front' };
  POSES[k].b = { ...POSES[k].b, view: 'front' };
}
