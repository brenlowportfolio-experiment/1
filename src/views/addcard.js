// Add a phrase straight to the deck, without a document behind it.
//
// Most cards are mined from a text, which is the point of the app — the
// sentence comes with them. But vocabulary also arrives from a meeting, a
// colleague's mark-up, or something half-remembered on the way home, and
// having to find a document to hang it on would just mean it never gets
// written down. These cards are ordinary cards: same deck, same queue, same
// scheduling. They simply have no source document, and the reader's context
// button stands down for them unless you supply a sentence yourself.

import { el, clear, append, ruby } from '../lib/dom.js';
import { glossPhrase, loadGlossary, glossaryReady, SOURCE_LABEL } from '../lib/translate.js';
import { countHan } from '../lib/normalize.js';
import { normalizeText } from '../lib/normalize.js';
import * as store from '../lib/store.js';
import { CONTEXTS } from '../data/contexts/index.js';
import { toast } from './reader.js';

export function addCardPanel({ onAdded, navigate }) {
  const wrap = el('section', { class: 'addcard' });

  let open = false;
  let pinyinTouched = false;
  let meaningTouched = false;
  let glossTimer = null;

  const summary = el('button', {
    class: 'btn primary addcard-open',
    onclick: () => {
      open = !open;
      paint();
      if (open) {
        // Warm the glossary while they type rather than after.
        loadGlossary().catch(() => {});
        setTimeout(() => wrap.querySelector('.ac-term')?.focus(), 0);
      }
    },
  });

  const term = el('input', {
    class: 'ac-term',
    type: 'text',
    placeholder: '输入中文词语或短语　e.g. 融资租赁',
    spellcheck: 'false',
    autocomplete: 'off',
    oninput: () => scheduleGloss(),
    onkeydown: (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    },
  });

  const pinyin = el('input', {
    class: 'ac-pinyin',
    type: 'text',
    placeholder: 'pinyin',
    spellcheck: 'false',
    oninput: () => {
      pinyinTouched = true;
    },
  });

  const meaning = el('input', {
    class: 'ac-meaning',
    type: 'text',
    placeholder: 'English meaning',
    oninput: () => {
      meaningTouched = true;
    },
    onkeydown: (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submit();
      }
    },
  });

  const sentence = el('input', {
    class: 'ac-sentence',
    type: 'text',
    placeholder: '例句（可选）— an example sentence, if you have one',
    spellcheck: 'false',
  });

  const contextSel = el(
    'select',
    { class: 'ac-context' },
    [
      el('option', { value: '', text: 'No context' }),
      ...CONTEXTS.map((c) => el('option', { value: c.id, text: c.name })),
    ],
  );

  const preview = el('div', { class: 'ac-preview' });
  const note = el('p', { class: 'hint ac-note' });
  const dupe = el('div', { class: 'ac-dupe', hidden: 'hidden' });
  const submitBtn = el('button', { class: 'btn primary', text: 'Add to deck', onclick: () => submit() });

  // ── automatic gloss ──────────────────────────────────────────────────────
  function scheduleGloss() {
    clearTimeout(glossTimer);
    glossTimer = setTimeout(applyGloss, 250);
    paintDupe();
  }

  async function applyGloss() {
    const t = normalizeText(term.value).trim();
    if (!countHan(t)) {
      clear(preview);
      note.textContent = '';
      return;
    }

    let info = glossPhrase(t);
    fill(info);

    if (!glossaryReady()) {
      note.textContent = 'Looking up English…';
      try {
        await loadGlossary();
      } catch {
        note.textContent = 'Offline — pinyin and meaning from the built-in dictionary only.';
        return;
      }
      // The term may have moved on while the glossary was in flight.
      if (normalizeText(term.value).trim() !== t) return;
      info = glossPhrase(t);
      fill(info);
    }
  }

  function fill(info) {
    if (!pinyinTouched) pinyin.value = info.pinyin || '';
    if (!meaningTouched) meaning.value = info.meaning || '';
    clear(preview);
    const t = normalizeText(term.value).trim();
    if (t) preview.append(ruby(t, pinyin.value));
    const words = (info.units || []).filter((u) => /[一-鿿]/.test(u));
    note.textContent =
      words.length > 1
        ? `Read as a phrase: ${words.join(' · ')} — edit anything that looks wrong.`
        : `${SOURCE_LABEL[info.source] || ''} — edit anything that looks wrong.`;
  }

  function paintDupe() {
    const t = normalizeText(term.value).trim();
    const existing = t && store.findCardByTerm(t);
    clear(dupe);
    dupe.hidden = !existing;
    if (!existing) {
      submitBtn.textContent = 'Add to deck';
      return;
    }
    submitBtn.textContent = 'Update existing card';
    append(
      dupe,
      el('span', { text: `Already in your deck — ${existing.meaning || 'no meaning yet'}.` }),
      el('button', {
        class: 'linkish',
        text: 'Show it',
        onclick: () => navigate({ view: 'deck', search: t }),
      }),
    );
  }

  // ── save ─────────────────────────────────────────────────────────────────
  function submit() {
    const t = normalizeText(term.value).trim();
    if (!countHan(t)) {
      toast('Enter a Chinese word or phrase');
      term.focus();
      return;
    }

    const ex = normalizeText(sentence.value).trim();
    const ctx = contextSel.value || null;
    const existing = store.findCardByTerm(t);

    // A sourceless card is the normal case here. If they wrote an example
    // sentence it becomes the card's context, so 语境 still has something to
    // show in review.
    const source =
      ex || ctx
        ? {
            docId: null,
            contextId: ctx,
            docTitle: '手动添加 · Added by hand',
            sentence: ex,
            paraIndex: null,
            start: 0,
            end: 0,
          }
        : null;

    if (existing) {
      store.updateCard(existing.id, {
        pinyin: pinyin.value.trim() || existing.pinyin,
        meaning: meaning.value.trim() || existing.meaning,
      });
      if (source) store.addCard({ term: t, source });
      toast('Card updated');
    } else {
      store.addCard({
        term: t,
        pinyin: pinyin.value.trim(),
        meaning: meaning.value.trim(),
        source,
      });
      toast('Added to deck');
    }

    reset();
    onAdded?.();
  }

  function reset() {
    term.value = '';
    pinyin.value = '';
    meaning.value = '';
    sentence.value = '';
    pinyinTouched = false;
    meaningTouched = false;
    clear(preview);
    note.textContent = '';
    dupe.hidden = true;
    submitBtn.textContent = 'Add to deck';
    term.focus();
  }

  // ── render ───────────────────────────────────────────────────────────────
  function paint() {
    clear(wrap);
    clear(summary);
    summary.append(
      el('span', { class: 'ac-plus', text: open ? '×' : '+' }),
      el('span', { text: open ? 'Close' : 'Add a phrase' }),
    );
    wrap.append(summary);
    if (!open) return;

    wrap.append(
      el('div', { class: 'addcard-body' }, [
        el('p', {
          class: 'panel-note',
          text:
            'For vocabulary that did not come from a document — something from a meeting, a colleague’s mark-up, a word you looked up. It joins the same deck and the same review queue as everything else.',
        }),
        el('label', { class: 'ac-field' }, [el('span', { text: '词语 Word or phrase' }), term]),
        preview,
        el('div', { class: 'ac-row' }, [
          el('label', { class: 'ac-field' }, [el('span', { text: 'Pinyin' }), pinyin]),
          el('label', { class: 'ac-field grow' }, [el('span', { text: 'Meaning' }), meaning]),
        ]),
        note,
        dupe,
        el('details', { class: 'ac-more' }, [
          el('summary', { text: 'Add an example sentence or file it under a context' }),
          el('div', { class: 'ac-more-body' }, [
            el('label', { class: 'ac-field' }, [el('span', { text: '例句 Example sentence' }), sentence]),
            el('label', { class: 'ac-field' }, [el('span', { text: 'Context' }), contextSel]),
          ]),
        ]),
        el('div', { class: 'row' }, [
          submitBtn,
          el('button', { class: 'btn ghost', text: 'Clear', onclick: () => reset() }),
        ]),
      ]),
    );
  }

  paint();
  return wrap;
}
