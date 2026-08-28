// Persistence. Everything lives in localStorage under one key so the whole
// deck can be exported/imported as a single JSON file — there is no server and
// no account, which also means nothing a user reads or drafts leaves the device.

import { newSchedule, dayKey, addDays, DEFAULT_MAX } from './srs.js';

const KEY = 'falv-zhongwen.v1';

const DEFAULTS = {
  version: 1,
  cards: [],
  userDocs: [], // hypotheticals generated from an uploaded source
  settings: {
    newPerDay: 12,
    maxInterval: DEFAULT_MAX, // days — the furthest ahead a card can be pushed
    showPinyinOnFront: true, // pinyin sits above the characters, as ruby text
    reviewLimit: 60,
  },
  history: {}, // dayKey -> count reviewed
};

let state = load();
const listeners = new Set();

// Cards graded before the ceiling existed can sit weeks out. Bring them inside
// it on load, so lowering the ceiling takes effect for a deck built under the
// old rules rather than only for cards graded from now on.
if (clampSchedules(state.settings.maxInterval) > 0) persist();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULTS);
    const parsed = JSON.parse(raw);
    return {
      ...structuredClone(DEFAULTS),
      ...parsed,
      settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
    };
  } catch {
    return structuredClone(DEFAULTS);
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save deck:', e);
  }
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getState() {
  return state;
}

export function getCards() {
  return state.cards;
}

export function getSettings() {
  return state.settings;
}

export function updateSettings(patch) {
  const before = state.settings.maxInterval;
  state.settings = { ...state.settings, ...patch };
  // Lowering the ceiling has to reach cards already scheduled beyond it,
  // otherwise everything graded Easy last week stays a fortnight out and the
  // change looks broken.
  if (patch.maxInterval != null && patch.maxInterval < before) {
    clampSchedules(patch.maxInterval);
  }
  persist();
}

/** Pull any card scheduled further out than `max` back inside the ceiling. */
export function clampSchedules(max) {
  const limit = Math.max(1, Math.round(max));
  const latest = dayKey(addDays(new Date(), limit));
  let moved = 0;
  for (const c of state.cards) {
    if (c.srs.interval > limit) c.srs.interval = limit;
    if (c.srs.due > latest) {
      c.srs.due = latest;
      moved++;
    }
  }
  return moved;
}

export function findCardByTerm(term) {
  return state.cards.find((c) => c.term === term) || null;
}

/**
 * @param {{term, pinyin, meaning, note, source}} input
 *   source: { docId, contextId, docTitle, paraIndex, start, end, sentence }
 */
export function addCard(input) {
  const existing = findCardByTerm(input.term);
  if (existing) {
    // Don't duplicate — attach the new sighting as another context instead.
    if (!existing.sources.some((s) => s.docId === input.source.docId && s.start === input.source.start)) {
      existing.sources.push(input.source);
    }
    persist();
    return { card: existing, created: false };
  }

  const card = {
    id: `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    term: input.term,
    pinyin: input.pinyin || '',
    meaning: input.meaning || '',
    note: input.note || '',
    sources: [input.source],
    created: new Date().toISOString(),
    suspended: false,
    srs: newSchedule(),
  };
  state.cards.push(card);
  persist();
  return { card, created: true };
}

export function updateCard(id, patch) {
  const c = state.cards.find((x) => x.id === id);
  if (!c) return null;
  Object.assign(c, patch);
  persist();
  return c;
}

export function deleteCard(id) {
  state.cards = state.cards.filter((c) => c.id !== id);
  persist();
}

export function recordReview(cardId, nextSrs) {
  const c = state.cards.find((x) => x.id === cardId);
  if (!c) return;
  c.srs = nextSrs;
  const k = dayKey();
  state.history[k] = (state.history[k] || 0) + 1;
  persist();
}

// ── user-generated documents ─────────────────────────────────────────────

export function getUserDocs() {
  return state.userDocs || [];
}

export function addUserDoc(doc) {
  const saved = {
    ...doc,
    id: doc.id || `ud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    custom: true,
    created: new Date().toISOString(),
  };
  state.userDocs.push(saved);
  persist();
  return saved;
}

export function deleteUserDoc(id) {
  state.userDocs = state.userDocs.filter((d) => d.id !== id);
  persist();
}

export function exportJSON() {
  return JSON.stringify(state, null, 2);
}

export function importJSON(text) {
  const parsed = JSON.parse(text);
  if (!parsed || !Array.isArray(parsed.cards)) throw new Error('Not a valid deck file');
  state = {
    ...structuredClone(DEFAULTS),
    ...parsed,
    settings: { ...DEFAULTS.settings, ...(parsed.settings || {}) },
  };
  clampSchedules(state.settings.maxInterval);
  persist();
}

export function resetAll() {
  state = structuredClone(DEFAULTS);
  persist();
}
