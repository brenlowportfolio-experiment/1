// Everything lives in one localStorage record. Small enough that rewriting
// it on every change is fine, and it keeps export/import trivial.

import { uid } from './dom.js';

const KEY = 'voicebank.v1';

export const KINDS = [
  { id: 'experience', label: 'Experience' },
  { id: 'value', label: 'Value proposition' },
  { id: 'intro', label: 'Introduction' },
  { id: 'closing', label: 'Closing' },
];

export const DEFAULT_TAGS = [
  'Analytical Rigor',
  'Cross-Functional Leadership',
  'Problem Solving',
  'Stakeholder Management',
  'Execution',
  'Communication',
  'Technical Depth',
  'Strategy',
  'Mentorship',
  'Customer Focus',
];

export const MODELS = [
  { id: 'claude-opus-5-5', label: 'Claude Opus 5.5' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5' },
  { id: 'claude-haiku-5-5', label: 'Claude Haiku 5.5' },
];

export const MAX_SAMPLES = 5;
export const MIN_SAMPLES = 3;

function blank() {
  return {
    settings: { apiKey: '', model: 'claude-opus-5-5', effort: 'medium' },
    samples: [],
    voiceNotes: '',
    tags: DEFAULT_TAGS.slice(),
    chunks: [],
    applications: [],
    currentApp: null,
  };
}

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...blank(), ...JSON.parse(raw) };
  } catch {
    // Private mode or corrupt record: start empty rather than fail.
  }
  return blank();
}

function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked. State still works for this session.
  }
  for (const fn of listeners) fn(state);
}

export function get() {
  return state;
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function update(fn) {
  fn(state);
  save();
}

// Samples

export function addSample() {
  if (state.samples.length >= MAX_SAMPLES) return null;
  const s = { id: uid('s'), title: '', text: '' };
  update((st) => st.samples.push(s));
  return s;
}

export function patchSample(id, patch) {
  update((st) => Object.assign(st.samples.find((s) => s.id === id), patch));
}

export function removeSample(id) {
  update((st) => (st.samples = st.samples.filter((s) => s.id !== id)));
}

// Tags

export function addTag(name) {
  const n = name.trim();
  if (!n || state.tags.some((t) => t.toLowerCase() === n.toLowerCase())) return;
  update((st) => st.tags.push(n));
}

export function removeTag(name) {
  update((st) => {
    st.tags = st.tags.filter((t) => t !== name);
    for (const c of st.chunks) c.tags = c.tags.filter((t) => t !== name);
  });
}

// Chunks

export function addChunk(fields = {}) {
  const c = { id: uid('c'), kind: 'experience', title: '', text: '', tags: [], ...fields };
  for (const t of c.tags) addTag(t);
  update((st) => st.chunks.unshift(c));
  return c;
}

export function patchChunk(id, patch) {
  if (patch.tags) for (const t of patch.tags) addTag(t);
  update((st) => Object.assign(st.chunks.find((c) => c.id === id), patch));
}

export function removeChunk(id) {
  update((st) => {
    st.chunks = st.chunks.filter((c) => c.id !== id);
    for (const a of st.applications) a.sequence = a.sequence.filter((s) => s.chunkId !== id);
  });
}

/** Reorder a visible subset in place, leaving filtered-out chunks where they were. */
export function reorderChunks(ids) {
  update((st) => {
    const byId = new Map(st.chunks.map((c) => [c.id, c]));
    const set = new Set(ids);
    const slots = st.chunks.map((c, i) => (set.has(c.id) ? i : -1)).filter((i) => i >= 0);
    const next = st.chunks.slice();
    slots.forEach((slot, k) => (next[slot] = byId.get(ids[k])));
    st.chunks = next;
  });
}

export function chunk(id) {
  return state.chunks.find((c) => c.id === id);
}

// Applications

export function newApplication() {
  const a = {
    id: uid('a'),
    company: '',
    role: '',
    jd: '',
    analysis: null,
    sequence: [],
    questions: [
      { id: uid('q'), prompt: 'Cover letter', limit: 300, unit: 'words', answer: '', note: '' },
    ],
    createdAt: Date.now(),
  };
  update((st) => {
    st.applications.unshift(a);
    st.currentApp = a.id;
  });
  return a;
}

export function app(id = state.currentApp) {
  return state.applications.find((a) => a.id === id) || null;
}

export function patchApp(id, patch) {
  update((st) => Object.assign(st.applications.find((a) => a.id === id), patch));
}

export function removeApp(id) {
  update((st) => {
    st.applications = st.applications.filter((a) => a.id !== id);
    if (st.currentApp === id) st.currentApp = st.applications[0]?.id || null;
  });
}

export function patchQuestion(appId, qid, patch) {
  update((st) => {
    const a = st.applications.find((x) => x.id === appId);
    Object.assign(a.questions.find((q) => q.id === qid), patch);
  });
}

// Backup

export function exportJSON(includeKey = false) {
  const copy = JSON.parse(JSON.stringify(state));
  if (!includeKey) copy.settings.apiKey = '';
  return JSON.stringify(copy, null, 2);
}

export function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.chunks)) throw new Error('Not a Voicebank backup.');
  const key = state.settings.apiKey;
  state = { ...blank(), ...data };
  if (!state.settings.apiKey) state.settings.apiKey = key;
  save();
}
