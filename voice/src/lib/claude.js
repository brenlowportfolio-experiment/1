// Claude calls, straight from the browser with the person's own key. The key
// never leaves this machine except to go to api.anthropic.com.

import Anthropic from '../../vendor/anthropic-sdk.mjs';
import * as store from './store.js';
import { voiceBlock } from './prompts.js';

export const NEEDS_KEY = true;
export const MODEL_SETTING = 'model';
export const MODEL_CHOICES = store.MODELS.map((m) => [m.id, m.label]);
export const CONNECTION_NOTE = 'Your key is stored in this browser only and sent only to api.anthropic.com.';
export const STORAGE_NOTE =
  'Everything is stored in this browser. Export to move it to another machine or keep a backup. Exports leave out your API key.';

export async function saveFile(filename, text) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

function client() {
  const { apiKey } = store.get().settings;
  if (!apiKey) throw new Error('Add your Anthropic API key under Voice first.');
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

function baseParams(maxTokens) {
  const st = store.get();
  const params = {
    model: st.settings.model,
    max_tokens: maxTokens,
    system: [
      {
        type: 'text',
        text: voiceBlock(st.samples, st.voiceNotes),
        cache_control: { type: 'ephemeral' },
      },
    ],
    output_config: { effort: st.settings.effort || 'medium' },
  };
  // Server side fallback re-runs a declined request on another model
  // instead of failing. Haiku has no server side fallback.
  if (!params.model.startsWith('claude-haiku')) {
    params.betas = ['server-side-fallback-2026-07-01'];
    params.fallbacks = 'default';
  }
  return params;
}

function checkStop(msg) {
  if (msg.stop_reason === 'refusal') {
    throw new Error('Claude declined this request. Edit the input and try again.');
  }
}

function textOf(msg) {
  return msg.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');
}

/** One shot request returning JSON that matches `schema`. */
export async function structured(userText, schema, maxTokens = 16000) {
  const params = baseParams(maxTokens);
  params.output_config.format = { type: 'json_schema', schema };
  params.messages = [{ role: 'user', content: userText }];
  const msg = await client().beta.messages.create(params);
  checkStop(msg);
  if (msg.stop_reason === 'max_tokens') throw new Error('Response was cut off. Try a shorter input.');
  return JSON.parse(textOf(msg));
}

/** Plain text request. */
export async function text(userText, maxTokens = 4000) {
  const params = baseParams(maxTokens);
  params.messages = [{ role: 'user', content: userText }];
  const msg = await client().beta.messages.create(params);
  checkStop(msg);
  return textOf(msg).trim();
}

/**
 * Streamed draft. onText receives the running text. Returns the final text.
 * `signal` aborts the request.
 */
export async function stream(userText, onText, signal, maxTokens = 16000) {
  const params = baseParams(maxTokens);
  params.messages = [{ role: 'user', content: userText }];
  const s = client().beta.messages.stream(params, { signal });
  let out = '';
  for await (const ev of s) {
    if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') {
      out += ev.delta.text;
      onText(out);
    }
  }
  const msg = await s.finalMessage();
  checkStop(msg);
  return out.trim();
}

export function friendlyError(err) {
  if (err?.name === 'AbortError' || /abort/i.test(err?.message || '')) return 'Stopped.';
  const status = err?.status;
  if (status === 401) return 'The API key was rejected. Check it under Voice.';
  if (status === 429) return 'Rate limited. Wait a moment and try again.';
  if (status === 529 || status >= 500) return 'Anthropic’s API is busy. Try again shortly.';
  if (status === 400) return `Request rejected: ${err?.error?.error?.message || err.message}`;
  return err?.message || String(err);
}
