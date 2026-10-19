// App shell + hash router.

import { el, clear } from './lib/dom.js';
import * as store from './lib/store.js';
import { NEEDS_KEY } from './lib/claude.js';
import * as voice from './views/voice.js';
import * as chunks from './views/chunks.js';
import * as assemble from './views/assemble.js';

const VIEWS = {
  assemble: { label: 'Assemble', mod: assemble },
  chunks: { label: 'Chunks', mod: chunks },
  voice: { label: 'Voice', mod: voice },
};

const outlet = document.getElementById('outlet');
const nav = document.getElementById('nav');
let teardown = null;

function current() {
  const v = location.hash.replace(/^#\/?/, '');
  if (VIEWS[v]) return v;
  const st = store.get();
  if ((NEEDS_KEY && !st.settings.apiKey) || st.samples.length < store.MIN_SAMPLES) return 'voice';
  return st.chunks.length ? 'assemble' : 'chunks';
}

function drawNav(active) {
  clear(nav);
  const st = store.get();
  const badge = {
    voice: st.samples.filter((s) => s.text.trim()).length,
    chunks: st.chunks.length,
    assemble: null,
  };
  for (const [id, v] of Object.entries(VIEWS)) {
    nav.append(
      el('a', { href: `#${id}`, class: id === active ? 'active' : '', 'aria-current': id === active ? 'page' : null }, [
        v.label,
        badge[id] != null ? el('span', { class: 'nav-n', text: badge[id] }) : null,
      ]),
    );
  }
}

function route() {
  if (teardown) teardown();
  teardown = null;
  const v = current();
  drawNav(v);
  clear(outlet);
  teardown = VIEWS[v].mod.render(outlet) || null;
  window.scrollTo(0, 0);
}

store.subscribe(() => drawNav(current()));
window.addEventListener('hashchange', route);
window.addEventListener('vb:refresh', route);
route();
