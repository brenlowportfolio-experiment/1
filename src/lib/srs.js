// Spaced repetition — an SM-2 variant with day-granularity intervals.
//
// Grades: 0 again / 1 hard / 2 good / 3 easy.
//
// Intervals grow by the card's ease factor, up to a ceiling set in Settings.
// "Again" both resets the interval and requeues the card inside the current
// session, so a word you blanked on gets tested twice before you leave.

export const GRADE = { AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 };

export const DEFAULT_MAX = 3; // days — the ceiling on any interval

const MIN_EASE = 1.3;
const MAX_EASE = 3.0;
const EASE_DELTA = [-0.20, -0.15, 0, +0.10];

export function newSchedule(now = new Date()) {
  return {
    state: 'new',
    due: dayKey(now),
    interval: 0,
    ease: 2.5,
    reps: 0,
    lapses: 0,
    lastGrade: null,
    lastReviewed: null,
  };
}

/**
 * Pure: returns the next schedule for a card given a grade.
 *
 * `maxInterval` is a hard ceiling on how far ahead a card can be pushed. Left
 * to itself the SM-2 ladder runs 3 → 8 → 20 → 50 → 125 days, which is correct
 * for long-term retention and too slow for someone drilling vocabulary they
 * expect to use this month. The ceiling keeps everything within reach; the
 * cost is that daily load grows with the deck, since nothing ever leaves
 * rotation.
 */
export function schedule(srs, grade, now = new Date(), maxInterval = DEFAULT_MAX) {
  const next = { ...srs };
  next.ease = clamp(srs.ease + EASE_DELTA[grade], MIN_EASE, MAX_EASE);
  next.reps = srs.reps + 1;
  next.lastGrade = grade;
  next.lastReviewed = now.toISOString();

  if (grade === GRADE.AGAIN) {
    next.lapses = srs.lapses + 1;
    next.interval = 0;
    next.state = 'learning';
    next.due = dayKey(now); // still due today; also requeued in-session
    return next;
  }

  if (srs.state === 'new' || srs.interval === 0) {
    next.interval = grade === GRADE.EASY ? 3 : 1;
  } else if (srs.interval === 1) {
    next.interval = grade === GRADE.HARD ? 2 : grade === GRADE.EASY ? 5 : 3;
  } else {
    const mult =
      grade === GRADE.HARD ? 1.2 : grade === GRADE.EASY ? next.ease * 1.3 : next.ease;
    next.interval = Math.max(srs.interval + 1, Math.round(srs.interval * mult));
  }

  const cap = Math.max(1, Math.round(maxInterval));
  if (cap <= 4) {
    // Below about five days there is no room for a ladder: clamping the SM-2
    // steps would land Hard, Good and Easy on the same day and the buttons
    // would stop meaning anything. Map the grades straight onto the range so
    // each one still says something distinct.
    next.interval =
      grade === GRADE.HARD ? 1 : grade === GRADE.EASY ? cap : Math.max(1, cap - 1);
  } else {
    next.interval = Math.min(next.interval, cap);
  }
  next.state = 'review';
  next.due = dayKey(addDays(now, next.interval));
  return next;
}

/** Human-readable preview of where each button sends the card. */
export function previewIntervals(srs, now = new Date(), maxInterval = DEFAULT_MAX) {
  return [0, 1, 2, 3].map((g) => {
    const s = schedule(srs, g, now, maxInterval);
    if (g === GRADE.AGAIN) return 'now';
    return s.interval === 1 ? '1d' : `${s.interval}d`;
  });
}

export function isDue(srs, now = new Date()) {
  return srs.due <= dayKey(now);
}

export function dayKey(d = new Date()) {
  const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function daysUntil(dueKey, now = new Date()) {
  const a = new Date(`${dayKey(now)}T00:00:00`);
  const b = new Date(`${dueKey}T00:00:00`);
  return Math.round((b - a) / 86400000);
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Fisher–Yates — review order is randomised so you test recall, not sequence. */
export function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
