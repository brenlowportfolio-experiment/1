// Deck — everything you've collected, plus settings and export/import.

import { el, clear, ruby } from '../lib/dom.js';
import * as store from '../lib/store.js';
import { isDue, daysUntil, dayKey } from '../lib/srs.js';
import { CONTEXTS, getDoc } from '../data/contexts/index.js';
import { toast } from './reader.js';

export function render(root, { navigate }) {
  clear(root);

  let filter = 'all';
  let query = '';

  const head = el('header', { class: 'page-head' }, [
    el('h1', { text: 'Deck' }),
    el('p', { class: 'lede', text: 'Every phrase you’ve collected, and where it came from.' }),
  ]);

  const stats = el('div', { class: 'stats' });
  const controls = el('div', { class: 'controls' });
  const list = el('div', { class: 'card-list' });

  root.append(head, stats, controls, list, settingsPanel(() => paint()));

  const search = el('input', {
    class: 'search',
    type: 'search',
    placeholder: 'Search characters, pinyin or meaning…',
    oninput: (e) => {
      query = e.target.value.trim().toLowerCase();
      paintList();
    },
  });

  const filters = el('div', { class: 'chips' });
  [['all', 'All'], ['due', 'Due'], ['new', 'New'], ...CONTEXTS.map((c) => [c.id, c.name])].forEach(
    ([id, label]) => {
      filters.append(
        el('button', {
          class: `chip${filter === id ? ' on' : ''}`,
          text: label,
          dataset: { f: id },
          onclick: () => {
            filter = id;
            filters.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.f === id));
            paintList();
          },
        }),
      );
    },
  );
  controls.append(search, filters);

  function paintStats() {
    const cards = store.getCards();
    const due = cards.filter((c) => !c.suspended && c.srs.state !== 'new' && isDue(c.srs)).length;
    const fresh = cards.filter((c) => c.srs.state === 'new').length;
    const mature = cards.filter((c) => c.srs.interval >= 21).length;
    const today = store.getState().history[dayKey()] || 0;
    clear(stats);
    [
      [cards.length, 'cards'],
      [due, 'due now'],
      [fresh, 'new'],
      [mature, 'mature (21d+)'],
      [today, 'reviewed today'],
    ].forEach(([n, label]) =>
      stats.append(el('div', { class: 'stat' }, [el('b', { text: String(n) }), el('span', { text: label })])),
    );
  }

  function paintList() {
    clear(list);
    let cards = [...store.getCards()].sort((a, b) => (a.srs.due < b.srs.due ? -1 : 1));

    if (filter === 'due') cards = cards.filter((c) => isDue(c.srs) && !c.suspended);
    else if (filter === 'new') cards = cards.filter((c) => c.srs.state === 'new');
    else if (filter !== 'all') cards = cards.filter((c) => c.sources.some((s) => s.contextId === filter));

    if (query) {
      cards = cards.filter((c) =>
        [c.term, c.pinyin, c.meaning, c.note].join(' ').toLowerCase().includes(query),
      );
    }

    if (!cards.length) {
      list.append(
        el('div', { class: 'empty' }, [
          el('p', { text: 'Nothing here yet.' }),
          el('button', {
            class: 'btn primary',
            text: 'Go read something',
            onclick: () => navigate({ view: 'library' }),
          }),
        ]),
      );
      return;
    }

    for (const c of cards) {
      list.append(row(c));
    }
  }

  function row(c) {
    const d = daysUntil(c.srs.due);
    const node = el('div', { class: `deck-row${c.suspended ? ' suspended' : ''}` });

    const meaningInput = el('input', {
      class: 'row-meaning',
      value: c.meaning,
      placeholder: 'meaning',
      onchange: (e) => {
        store.updateCard(c.id, { meaning: e.target.value.trim() });
        toast('Saved');
      },
    });

    node.append(
      el('div', { class: 'row-term' }, [ruby(c.term, c.pinyin)]),
      el('div', { class: 'row-body' }, [
        meaningInput,
        el(
          'div',
          { class: 'row-sources' },
          c.sources.map((s) => {
            const doc = getDoc(s.docId);
            return el('button', {
              class: 'linkish tiny',
              text: doc ? doc.titleZh : s.docTitle,
              title: s.sentence,
              onclick: () =>
                navigate({
                  view: 'reader',
                  docId: s.docId,
                  focus: { paraIndex: s.paraIndex, start: s.start, end: s.end },
                }),
            });
          }),
        ),
      ]),
      el('div', { class: 'row-side' }, [
        el('span', {
          class: `pill ${c.srs.state === 'new' ? 'new' : d <= 0 ? 'due' : 'later'}`,
          text: c.srs.state === 'new' ? 'new' : d <= 0 ? 'due' : `${d}d`,
        }),
        el('button', {
          class: 'icon-btn',
          title: c.suspended ? 'Resume' : 'Suspend',
          text: c.suspended ? '▶' : '⏸',
          onclick: () => {
            store.updateCard(c.id, { suspended: !c.suspended });
            paint();
          },
        }),
        el('button', {
          class: 'icon-btn danger',
          title: 'Delete',
          text: '✕',
          onclick: () => {
            if (confirm(`Delete “${c.term}”?`)) {
              store.deleteCard(c.id);
              paint();
            }
          },
        }),
      ]),
    );
    return node;
  }

  function paint() {
    paintStats();
    paintList();
  }

  paint();
}

function settingsPanel(onChange) {
  const s = store.getSettings();
  const wrap = el('details', { class: 'settings' });
  wrap.append(el('summary', { text: 'Settings & data' }));

  const body = el('div', { class: 'settings-body' });

  body.append(
    field('New cards per day',
      el('input', {
        type: 'number', min: '0', max: '100', value: String(s.newPerDay),
        onchange: (e) => store.updateSettings({ newPerDay: Math.max(0, +e.target.value || 0) }),
      })),
    field('Longest interval (days)',
      el('input', {
        type: 'number', min: '1', max: '365', value: String(s.maxInterval),
        title: 'The furthest ahead any card can be scheduled. Lowering this also pulls back cards already scheduled beyond it.',
        onchange: (e) => {
          const v = Math.min(365, Math.max(1, +e.target.value || 1));
          e.target.value = String(v);
          store.updateSettings({ maxInterval: v });
          toast(`Ceiling set to ${v} day${v === 1 ? '' : 's'}`);
          onChange();
        },
      })),
    field('Max cards per session',
      el('input', {
        type: 'number', min: '5', max: '300', value: String(s.reviewLimit),
        onchange: (e) => store.updateSettings({ reviewLimit: Math.max(5, +e.target.value || 5) }),
      })),
    field('Pinyin above characters on the front',
      el('input', {
        type: 'checkbox', checked: s.showPinyinOnFront,
        onchange: (e) => store.updateSettings({ showPinyinOnFront: e.target.checked }),
      })),
  );

  const dataRow = el('div', { class: 'row' }, [
    el('button', {
      class: 'btn ghost',
      text: 'Export deck (.json)',
      onclick: () => {
        const blob = new Blob([store.exportJSON()], { type: 'application/json' });
        const a = el('a', { href: URL.createObjectURL(blob), download: `legal-chinese-deck-${dayKey()}.json` });
        document.body.append(a);
        a.click();
        a.remove();
      },
    }),
    el('label', { class: 'btn ghost file' }, [
      'Import deck',
      el('input', {
        type: 'file',
        accept: 'application/json',
        onchange: async (e) => {
          const f = e.target.files[0];
          if (!f) return;
          try {
            store.importJSON(await f.text());
            toast('Deck imported');
            onChange();
          } catch (err) {
            alert(`Import failed: ${err.message}`);
          }
        },
      }),
    ]),
    el('button', {
      class: 'btn ghost danger',
      text: 'Reset everything',
      onclick: () => {
        if (confirm('Delete all cards and history? This cannot be undone.')) {
          store.resetAll();
          onChange();
        }
      },
    }),
  ]);

  body.append(
    dataRow,
    el('p', {
      class: 'hint',
      text: 'A low interval ceiling keeps everything in rotation, at the cost of a daily load that grows with the deck — raise it as the deck gets bigger and cards stick.',
    }),
    el('p', { class: 'hint', text: 'Your deck is stored only in this browser. Export it if you want a backup.' }),
  );
  wrap.append(body);
  return wrap;
}

function field(label, input) {
  return el('label', { class: 'field' }, [el('span', { text: label }), input]);
}
