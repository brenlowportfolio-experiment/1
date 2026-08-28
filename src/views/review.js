// Review — due cards in random order, graded on an SM-2 schedule.

import { el, clear, ruby, append } from '../lib/dom.js';
import * as store from '../lib/store.js';
import { GRADE, isDue, schedule, previewIntervals, shuffle, daysUntil } from '../lib/srs.js';
import { getDoc } from '../data/contexts/index.js';

export function buildQueue() {
  const s = store.getSettings();
  const cards = store.getCards().filter((c) => !c.suspended);
  const due = cards.filter((c) => c.srs.state !== 'new' && isDue(c.srs));
  const fresh = cards.filter((c) => c.srs.state === 'new').slice(0, s.newPerDay);
  return shuffle([...due, ...fresh]).slice(0, s.reviewLimit);
}

export function render(root, { navigate }) {
  clear(root);

  let queue = buildQueue();
  let revealed = false;
  let done = 0;
  const total = queue.length;

  const stage = el('div', { class: 'review' });
  root.append(stage);

  // The toggle lives at render scope, not inside draw(), because it used to
  // exist only while a card was on screen — open Review with nothing due and
  // there was no way to find it at all.
  let cardEl = null;

  const pinToggle = el('button', {
    class: 'pin-toggle',
    title: 'Show or hide the pinyin above the characters (p)',
    onclick: togglePinyin,
  });

  function paintToggle() {
    const on = store.getSettings().showPinyinOnFront;
    pinToggle.className = `pin-toggle ${on ? 'on' : 'off'}`;
    pinToggle.setAttribute('aria-pressed', String(on));
    clear(pinToggle);
    pinToggle.append(
      el('span', { class: 'pt-dot' }),
      el('span', { class: 'pt-label', text: '拼音' }),
      el('span', { class: 'pt-state', text: on ? 'Pinyin on' : 'Pinyin off' }),
    );
  }

  function togglePinyin() {
    const next = !store.getSettings().showPinyinOnFront;
    store.updateSettings({ showPinyinOnFront: next });
    if (cardEl) cardEl.classList.toggle('hide-pinyin', !next);
    paintToggle();
  }

  paintToggle();

  function finish() {
    cardEl = null;
    clear(stage);
    stage.append(
      el('div', { class: 'review-progress done' }, [
        el('span', { class: 'counter', text: done ? `${done} reviewed` : 'Nothing due' }),
        pinToggle,
      ]),
    );
    stage.append(
      el('div', { class: 'review-done' }, [
        el('div', { class: 'done-mark', text: '完' }),
        el('h2', { text: done ? 'Session complete' : 'Nothing due right now' }),
        el('p', {
          class: 'lede',
          text: done
            ? `${done} card${done === 1 ? '' : 's'} reviewed. Come back tomorrow — the schedule spaces them out for you.`
            : 'Add some cards from a document, or come back when today’s cards fall due.',
        }),
        el('div', { class: 'row' }, [
          el('button', {
            class: 'btn primary',
            text: 'Read a document',
            onclick: () => navigate({ view: 'library' }),
          }),
          el('button', {
            class: 'btn ghost',
            text: 'Browse deck',
            onclick: () => navigate({ view: 'deck' }),
          }),
        ]),
      ]),
    );
  }

  function next() {
    revealed = false;
    if (!queue.length) return finish();
    draw(queue[0]);
  }

  function grade(card, g) {
    const nextSrs = schedule(card.srs, g, new Date(), store.getSettings().maxInterval);
    store.recordReview(card.id, nextSrs);
    done++;
    const [head, ...rest] = queue;
    if (g === GRADE.AGAIN) {
      // Put it back a few cards later, still inside this session.
      const at = Math.min(rest.length, 2 + Math.floor(Math.random() * 3));
      rest.splice(at, 0, head);
      queue = rest;
    } else {
      queue = rest;
    }
    next();
  }

  function draw(card) {
    const settings = store.getSettings();
    clear(stage);

    const progress = el('div', { class: 'review-progress' }, [
      el('div', {
        class: 'bar',
        style: `--p:${total ? Math.round((done / (done + queue.length)) * 100) : 0}%`,
      }),
      el('span', {
        class: 'counter',
        text: `${done} done · ${queue.length} left`,
      }),
      pinToggle,
    ]);

    // The pinyin is always rendered and hidden with CSS rather than being
    // conditionally built. Toggling mid-card therefore costs no re-render, so
    // it can't reset the reveal state or lose your place in the queue.
    const front = el('div', { class: 'card-face' }, [
      ruby(card.term, card.pinyin, { size: 'xl' }),
    ]);

    const back = el('div', { class: 'card-back', hidden: 'hidden' });
    append(
      back,
      el('div', { class: 'answer-pinyin', text: card.pinyin }),
      el('div', { class: 'answer-meaning', text: card.meaning || '—' }),
      card.note && el('div', { class: 'answer-note', text: card.note }),
    );

    // The context toggle: see the phrase back in the hypothetical it came from.
    const ctxWrap = el('div', { class: 'card-context', hidden: 'hidden' });
    const ctxBtn = el('button', {
      class: 'btn ghost small',
      text: `语境 Context (${card.sources.length})`,
      onclick: () => {
        ctxWrap.hidden = !ctxWrap.hidden;
      },
    });
    for (const s of card.sources) {
      const doc = getDoc(s.docId);
      ctxWrap.append(
        el('figure', { class: 'ctx-quote' }, [
          el('blockquote', {}, highlightSentence(s.sentence, card.term)),
          el('figcaption', {}, [
            `${doc ? doc.titleZh : s.docTitle} · ${doc ? doc.contextName : s.contextId}`,
            el('button', {
              class: 'linkish',
              text: '打开全文 →',
              onclick: () =>
                navigate({
                  view: 'reader',
                  docId: s.docId,
                  focus: { paraIndex: s.paraIndex, start: s.start, end: s.end },
                }),
            }),
          ]),
        ]),
      );
    }

    const revealBtn = el('button', {
      class: 'btn primary wide',
      text: 'Show meaning',
      onclick: reveal,
    });

    const grades = el('div', { class: 'grades', hidden: 'hidden' });
    const previews = previewIntervals(card.srs, new Date(), settings.maxInterval);
    [
      ['Again', GRADE.AGAIN, 'again'],
      ['Hard', GRADE.HARD, 'hard'],
      ['Good', GRADE.GOOD, 'good'],
      ['Easy', GRADE.EASY, 'easy'],
    ].forEach(([label, g, cls]) => {
      grades.append(
        el('button', { class: `btn grade ${cls}`, onclick: () => grade(card, g) }, [
          el('span', { class: 'g-label', text: label }),
          el('span', { class: 'g-when', text: previews[g] }),
        ]),
      );
    });

    function reveal() {
      if (revealed) return;
      revealed = true;
      back.hidden = false;
      revealBtn.hidden = true;
      grades.hidden = false;
    }

    cardEl = el('div', {
      class: `card${settings.showPinyinOnFront ? '' : ' hide-pinyin'}`,
    }, [
        el('div', { class: 'card-meta' }, [
          el('span', { class: `pill ${card.srs.state}`, text: stateLabel(card.srs) }),
          el('span', { class: 'pill quiet', text: card.sources[0]?.docTitle || '' }),
        ]),
        front,
        back,
        el('div', { class: 'card-actions' }, [revealBtn, grades]),
        el('div', { class: 'card-ctx-row' }, [ctxBtn]),
        ctxWrap,
    ]);

    stage.append(progress, cardEl);

    keyHandler = (ev) => {
      if (ev.key === ' ' || ev.key === 'Enter') {
        ev.preventDefault();
        if (!revealed) reveal();
        else grade(card, GRADE.GOOD);
      } else if (revealed && ['1', '2', '3', '4'].includes(ev.key)) {
        grade(card, Number(ev.key) - 1);
      } else if (ev.key.toLowerCase() === 'c') {
        ctxWrap.hidden = !ctxWrap.hidden;
      } else if (ev.key.toLowerCase() === 'p') {
        togglePinyin();
      }
    };
  }

  let keyHandler = null;
  const onKey = (ev) => keyHandler && keyHandler(ev);
  document.addEventListener('keydown', onKey);

  next();

  return () => document.removeEventListener('keydown', onKey);
}

function stateLabel(srs) {
  if (srs.state === 'new') return 'new';
  if (srs.state === 'learning') return 'relearning';
  const d = daysUntil(srs.due);
  return d <= 0 ? 'due' : `in ${d}d`;
}

function highlightSentence(sentence, term) {
  const out = [];
  let i = 0;
  while (i < sentence.length) {
    const at = sentence.indexOf(term, i);
    if (at === -1) {
      out.push(sentence.slice(i));
      break;
    }
    if (at > i) out.push(sentence.slice(i, at));
    out.push(el('mark', { text: term }));
    i = at + term.length;
  }
  return out;
}
