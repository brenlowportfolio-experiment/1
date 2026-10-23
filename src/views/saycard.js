// "What would you say?" — production cards made from the key moments of a scene.
//
// Every other card shows Chinese and asks what it means. These run the other
// way, the way a hearing does: here is the situation, here is what was just
// said to you, here is what you need to achieve — say it. The answer is the
// line a lawyer actually said there, with the phrases that carry it marked.

import { el, ruby } from '../lib/dom.js';
import { segment, describeSpan } from '../lib/segment.js';
import { momentsOf, leadIn, sideClass } from '../lib/turns.js';
import { getDoc, storyFor } from '../data/contexts/index.js';
import { speakerButton } from '../lib/speak.js';
import * as store from '../lib/store.js';

export function momentKey(docId, p) {
  return `${docId}#${p}`;
}

/** Everything the store needs to make a card from one moment of a scene. */
export function momentCardInput(doc, m) {
  return {
    kind: 'say',
    momentKey: momentKey(doc.id, m.p),
    term: m.line,
    meaning: m.en,
    cue: m.cue,
    speaker: m.who,
    speakerEn: doc.speakers?.[m.who]?.en || '',
    keys: m.keys,
    lead: leadIn(doc, m.p),
    source: {
      docId: doc.id,
      contextId: doc.contextId,
      docTitle: doc.titleZh,
      paraIndex: m.p,
      start: m.prefixEnd,
      end: m.prefixEnd + m.line.length,
      sentence: m.line,
    },
  };
}

export function addMoment(doc, m) {
  return store.addCard(momentCardInput(doc, m));
}

/**
 * The card's moment as the scene has it now, falling back to the snapshot
 * taken when the card was made if the scene has since changed under it.
 */
export function resolveMoment(card) {
  const src = card.sources[0];
  const doc = src && getDoc(src.docId);
  const live = doc && momentsOf(doc).get(src.paraIndex);
  if (doc && live && live.who === card.speaker) {
    return {
      doc,
      line: live.line,
      cue: live.cue,
      en: card.meaning || live.en,
      keys: live.keys,
      speaker: live.who,
      speakerEn: doc.speakers[live.who]?.en || card.speakerEn,
      side: doc.speakers[live.who]?.side,
      lead: leadIn(doc, src.paraIndex),
      paraIndex: src.paraIndex,
      start: live.prefixEnd,
      end: live.prefixEnd + live.line.length,
    };
  }
  return {
    doc: doc || null,
    line: card.term,
    cue: card.cue,
    en: card.meaning,
    keys: card.keys || [],
    speaker: card.speaker,
    speakerEn: card.speakerEn,
    side: null,
    lead: card.lead || [],
    paraIndex: src?.paraIndex,
    start: src?.start ?? 0,
    end: src?.end ?? 0,
  };
}

/**
 * A line of Chinese with pinyin over each word, taken from the same dictionary
 * that glosses the reader. Words inside a key phrase are marked.
 */
export function rubyLine(text, keys = []) {
  const ranges = [];
  for (const k of keys) {
    let at = text.indexOf(k);
    while (k && at !== -1) {
      ranges.push([at, at + k.length]);
      at = text.indexOf(k, at + k.length);
    }
  }
  const inKey = (t) => ranges.some(([a, b]) => t.start < b && t.end > a);

  const wrap = el('span', { class: 'ruby-line' });
  for (const t of segment(text)) {
    const node = t.han && t.entry
      ? ruby(t.text, t.entry.pinyin)
      : el('span', { class: `rl-plain${t.han ? ' zh' : ''}`, text: t.text });
    if (inKey(t)) node.classList.add('rl-key');
    wrap.append(node);
  }
  return wrap;
}

const rate = () => store.getSettings().speechRate || 0.85;

/** Front: the scene, what was just said, who you are, what you must do. */
export function sayFace(card, m) {
  const story = m.doc && storyFor(m.doc.id);
  const face = el('div', { class: 'card-face say-face' });

  face.append(
    el('div', { class: 'say-scene' }, [
      el('span', { class: 'say-tag', text: 'What would you say?' }),
      el('span', {
        class: 'say-where',
        text: [m.doc?.titleZh || card.sources[0]?.docTitle, story?.story.titleZh].filter(Boolean).join(' · '),
      }),
    ]),
  );

  if (m.lead.length) {
    const lead = el('div', { class: 'say-lead' });
    for (const l of m.lead) {
      if (l.stage) {
        lead.append(el('div', { class: 'say-stage', text: l.text }));
        continue;
      }
      lead.append(
        el('div', { class: `say-turn ${sideClass(l.side)}` }, [
          el('b', { class: 'say-who', text: l.speaker }),
          el('div', { class: 'say-text' }, [
            rubyLine(l.text),
            speakerButton(() => l.text, { el, rate, label: `Hear ${l.speaker}` }),
          ]),
        ]),
      );
    }
    face.append(lead);
  }

  face.append(
    el('div', { class: 'say-brief' }, [
      el('div', { class: 'say-you' }, [
        'You are ',
        el('b', { class: 'zh', text: m.speaker }),
        m.speakerEn && el('span', { class: 'say-you-en', text: ` — ${m.speakerEn}` }),
      ]),
      el('p', { class: 'say-cue', text: m.cue }),
      el('p', { class: 'say-do', text: 'Say it aloud in Chinese, then check.' }),
    ]),
  );
  return face;
}

/** Back: the line as it was said, its translation, the phrases to own. */
export function sayAnswer(card, m, { navigate } = {}) {
  const back = el('div', { class: 'card-back say-back', hidden: 'hidden' });
  back.append(
    el('div', { class: `say-model ${sideClass(m.side)}` }, [
      el('b', { class: 'say-who', text: m.speaker }),
      el('div', { class: 'say-text' }, [
        rubyLine(m.line, m.keys),
        speakerButton(() => m.line, { el, rate, label: 'Hear the model answer' }),
      ]),
    ]),
    el('div', { class: 'answer-meaning say-en', text: m.en || '—' }),
  );

  if (m.keys.length) {
    back.append(
      el('div', { class: 'say-keys' }, [
        el('span', { class: 'say-keys-label', text: 'Did you use' }),
        ...m.keys.map((k) =>
          el('span', { class: 'say-key', title: describeSpan(k).pinyin }, [
            el('span', { class: 'zh', text: k }),
            el('span', { class: 'say-key-py', text: describeSpan(k).pinyin }),
          ]),
        ),
      ]),
    );
  }

  if (m.doc && navigate) {
    back.append(
      el('button', {
        class: 'linkish say-open',
        text: '在场景中查看 · See it in the scene →',
        onclick: () =>
          navigate({
            view: 'reader',
            docId: m.doc.id,
            focus: { paraIndex: m.paraIndex, start: m.start, end: m.end },
          }),
      }),
    );
  }
  return back;
}
