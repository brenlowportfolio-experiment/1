// Artifact build of src/lib/claude.js. Calls Claude through the claude.ai
// `sample` capability, on the viewer's own Claude account, so no API key.
// There is no system prompt here, so the voice block leads every input.

import * as store from '../src/lib/store.js';
import { voiceBlock } from '../src/lib/prompts.js';

export const NEEDS_KEY = false;
export const MODEL_SETTING = 'tier';
export const MODEL_CHOICES = [
  ['complex', 'Most capable: best voice match, slower'],
  ['default', 'Balanced'],
  ['quick', 'Fast: quick edits'],
];
export const CONNECTION_NOTE =
  'Runs on your claude.ai account and counts toward its usage. claude.ai asks once before this page first uses Claude.';
export const STORAGE_NOTE =
  'Saved to your claude.ai account, private to you, and kept in this browser as well. Export for a file backup.';

let samplePromise = null;
function sampler() {
  samplePromise ??= window.claude?.use ? window.claude.use('sample') : Promise.resolve(null);
  return samplePromise;
}

function opts(extra = {}) {
  const st = store.get().settings;
  return { modelTier: st.tier || 'complex', effort: st.effort || 'medium', cache: false, ...extra };
}

function withVoice(userText) {
  const st = store.get();
  return `${voiceBlock(st.samples, st.voiceNotes)}\n\n---\n\n${userText}`;
}

async function need() {
  const s = await sampler();
  if (!s) throw { code: 'unavailable', message: 'Claude is not available in this view.' };
  return s;
}

/** Fill anything the schema requires but the reply left out, so views can trust the shape. */
function coerce(schema, v) {
  if (schema.type === 'array') return Array.isArray(v) ? v.map((x) => coerce(schema.items, x)) : [];
  if (schema.type === 'object') {
    const out = v && typeof v === 'object' && !Array.isArray(v) ? { ...v } : {};
    for (const [k, sub] of Object.entries(schema.properties || {})) out[k] = coerce(sub, out[k]);
    return out;
  }
  if (schema.enum) return schema.enum.includes(v) ? v : schema.enum[0];
  return typeof v === 'string' ? v : v == null ? '' : String(v);
}

export async function structured(userText, schema) {
  const s = await need();
  const prompt = `${withVoice(userText)}\n\nReply with only one JSON object that matches this JSON Schema, and no other text:\n${JSON.stringify(schema)}`;
  return coerce(schema, await s.json(prompt, opts()));
}

export async function text(userText) {
  const s = await need();
  return (await s(withVoice(userText), opts())).text.trim();
}

export async function stream(userText, onText, signal) {
  const s = await need();
  const res = await s(withVoice(userText), opts({ signal, onText: ({ text: t }) => onText(t) }));
  return res.text.trim();
}

export function friendlyError(err) {
  switch (err?.code) {
    case 'cancelled':
      return 'Stopped.';
    case 'not_granted':
      return 'This page is not allowed to use Claude. Allow it from the artifact’s Permissions menu.';
    case 'sampling_disabled':
    case 'unavailable':
    case 'capability_disabled':
      return 'Claude is not available for this account here.';
    case 'rate_limited':
      return 'Usage limit reached for now. Try again later.';
    case 'session_expired':
      return 'Sign in to claude.ai again, then retry.';
    case 'refused':
      return 'Claude declined this request. Edit the input and try again.';
    case 'prompt_too_large':
      return 'Too much text in one request. Shorten the samples or the job description.';
    case 'invalid_json':
      return 'Claude’s reply could not be read. Try again.';
    case 'empty_completion':
      return 'Claude returned nothing. Try again with a shorter input.';
    default:
      return err?.message || 'Something went wrong reaching Claude. Try again.';
  }
}

export async function saveFile(filename, data) {
  const d = window.claude?.use ? await window.claude.use('downloads') : null;
  if (!d) throw new Error('Saving files is not available in this view.');
  try {
    await d.save({ filename, data });
  } catch (e) {
    if (e?.code === 'declined' || e?.code === 'cancelled') return;
    throw new Error('The file could not be saved.');
  }
}
