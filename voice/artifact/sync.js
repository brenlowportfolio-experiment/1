// Keeps the whole state in the viewer's private db subtree as well as in
// localStorage, so the library follows the person across devices.
// Layout under data/users/<id>: profile, chunks, and one app-<id> doc per
// application, each well under the 256 KiB document cap.

import * as store from '../src/lib/store.js';
import { refresh, toast } from '../src/lib/dom.js';

let col = null;
const written = new Map();
let profileJSON = null; // profile body without savedAt, as last written
let timer = null;
let flushing = false;
let again = false;

function setStatus(text, title) {
  const s = document.getElementById('sync');
  if (!s) return;
  s.hidden = false;
  s.textContent = text;
  s.title = title || '';
}

function docsOf(st) {
  const m = new Map();
  m.set('profile', {
    samples: st.samples,
    voiceNotes: st.voiceNotes,
    tags: st.tags,
    settings: { ...st.settings, apiKey: '' },
    currentApp: st.currentApp,
    order: st.applications.map((a) => a.id),
  });
  m.set('chunks', { list: st.chunks });
  for (const a of st.applications) m.set(`app-${a.id}`, { app: a });
  return m;
}

function fromDocs(docs) {
  const p = docs.get('profile') || {};
  const apps = (p.order || [])
    .map((id) => docs.get(`app-${id}`)?.app)
    .filter(Boolean);
  return {
    samples: p.samples || [],
    voiceNotes: p.voiceNotes || '',
    tags: p.tags || store.get().tags,
    settings: { ...store.get().settings, ...(p.settings || {}), apiKey: '' },
    currentApp: p.currentApp || apps[0]?.id || null,
    chunks: docs.get('chunks')?.list || [],
    applications: apps,
  };
}

function schedule() {
  if (!col) return;
  clearTimeout(timer);
  timer = setTimeout(flush, 1200);
}

async function flush() {
  if (flushing) {
    again = true;
    return;
  }
  flushing = true;
  try {
    const docs = docsOf(store.get());
    let changed = false;
    for (const [k, body] of docs) {
      if (k === 'profile') continue;
      const json = JSON.stringify(body);
      if (written.get(k) === json) continue;
      await col.doc(k).set(body);
      written.set(k, json);
      changed = true;
    }
    for (const k of [...written.keys()]) {
      if (!docs.has(k)) {
        await col.doc(k).delete();
        written.delete(k);
        changed = true;
      }
    }
    const profile = docs.get('profile');
    const pj = JSON.stringify(profile);
    if (changed || profileJSON !== pj) {
      await col.doc('profile').set({ ...profile, savedAt: Date.now() });
      profileJSON = pj;
    }
    setStatus('Saved to your account');
  } catch (e) {
    setStatus('Not saved to account', 'Changes are kept in this browser. They will sync on your next edit.');
    if (e?.code === 'quota_exceeded') toast('Account storage is full. Delete old applications.', 'error');
  } finally {
    flushing = false;
    if (again) {
      again = false;
      schedule();
    }
  }
}

export async function startSync() {
  const use = window.claude?.use;
  const [db, user] = use ? await Promise.all([use('db'), use('user')]) : [null, null];
  const id = user ? await user.id() : null;
  if (!db || !id) {
    setStatus('This browser only', 'Sign in to claude.ai to save across devices.');
    return;
  }
  col = db.collection(`data/users/${id}`);
  try {
    const snap = await col.get();
    if (!snap.empty) {
      const docs = new Map(snap.docs.map((d) => [d.id, d.data()]));
      for (const [k, v] of docs) {
        if (k === 'profile') {
          const { savedAt, ...rest } = v;
          profileJSON = JSON.stringify(rest);
        } else written.set(k, JSON.stringify(v));
      }
      const remoteAt = Number(docs.get('profile')?.savedAt) || 0;
      if (remoteAt >= (store.get().localSavedAt || 0)) {
        store.replaceState(fromDocs(docs));
        refresh();
      }
    }
  } catch {
    setStatus('This browser only', 'Your account copy could not be read. Changes stay in this browser.');
    col = null;
    return;
  }
  store.subscribe(schedule);
  await flush();
}
