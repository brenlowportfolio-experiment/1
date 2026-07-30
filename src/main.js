// App shell + hash router.

import { el, clear } from './lib/dom.js';
import * as library from './views/library.js';
import * as reader from './views/reader.js';
import * as review from './views/review.js';
import * as deck from './views/deck.js';
import * as importView from './views/import.js';
import * as store from './lib/store.js';
import { buildQueue } from './views/review.js';

const outlet = document.getElementById('outlet');
const nav = document.getElementById('nav');
let teardown = null;
let focusPayload = null; // deep-link target that shouldn't live in the URL

function parseHash() {
  const h = location.hash.replace(/^#\/?/, '');
  if (!h) return { view: 'library' };
  const [view, arg] = h.split('/');
  if (view === 'read' && arg) return { view: 'reader', docId: arg };
  if (['library', 'review', 'deck', 'import'].includes(view)) return { view };
  return { view: 'library' };
}

function navigate(target) {
  focusPayload = target.focus || null;
  const hash =
    target.view === 'reader' ? `#/read/${target.docId}` : `#/${target.view}`;
  if (location.hash === hash) route();
  else location.hash = hash;
}

function route() {
  const r = parseHash();
  if (teardown) {
    teardown();
    teardown = null;
  }
  clear(outlet);
  outlet.scrollTop = 0;
  window.scrollTo(0, 0);

  const ctx = { navigate, focus: focusPayload };
  focusPayload = null;

  if (r.view === 'reader') teardown = reader.render(outlet, { docId: r.docId, focus: ctx.focus });
  else if (r.view === 'review') teardown = review.render(outlet, ctx);
  else if (r.view === 'deck') teardown = deck.render(outlet, ctx);
  else if (r.view === 'import') teardown = importView.render(outlet, ctx);
  else teardown = library.render(outlet, ctx);

  paintNav(r.view);
}

function paintNav(active) {
  clear(nav);
  const dueCount = buildQueue().length;
  const items = [
    ['library', 'Contexts', '#/library'],
    ['review', 'Review', '#/review'],
    ['deck', 'Deck', '#/deck'],
    ['import', 'Import', '#/import'],
  ];
  for (const [id, label, href] of items) {
    nav.append(
      el('a', { class: `nav-item${active === id ? ' on' : ''}`, href }, [
        label,
        id === 'review' && dueCount
          ? el('span', { class: 'badge', text: String(dueCount) })
          : null,
      ]),
    );
  }
}

window.addEventListener('hashchange', route);
store.subscribe(() => paintNav(parseHash().view));
route();
