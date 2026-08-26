// Library — browse contexts and the hypotheticals inside them.

import { el, clear } from '../lib/dom.js';
import { contextsWithDocs } from '../data/contexts/index.js';
import * as store from '../lib/store.js';

export function render(root, { navigate }) {
  clear(root);

  const cards = store.getCards();
  const perDoc = new Map();
  for (const c of cards) {
    for (const s of c.sources) {
      perDoc.set(s.docId, (perDoc.get(s.docId) || 0) + 1);
    }
  }

  root.append(
    el('header', { class: 'page-head' }, [
      el('h1', { text: 'Contexts' }),
      el('p', {
        class: 'lede',
        text:
          'Each context is a register of legal Chinese with its own conventions. Read a document, gloss what you don’t know, and turn the useful phrases into cards.',
      }),
    ]),
  );

  for (const ctx of contextsWithDocs()) {
    const section = el('section', { class: 'ctx' });
    section.append(
      el('div', { class: 'ctx-head' }, [
        el('span', { class: 'ctx-icon', text: ctx.icon }),
        el('div', {}, [
          el('h2', {}, [ctx.nameZh, el('span', { class: 'ctx-en', text: ctx.name })]),
          el('p', { class: 'ctx-blurb', text: ctx.blurb }),
        ]),
      ]),
    );

    const list = el('div', { class: 'doc-grid' });
    for (const d of ctx.docs) {
      const n = perDoc.get(d.id) || 0;
      list.append(
        el(
          'button',
          {
            class: 'doc-card',
            onclick: () => navigate({ view: 'reader', docId: d.id }),
          },
          [
            el('span', { class: 'doc-card-level' }, [
              d.level,
              d.custom && el('span', { class: 'mine-tag', text: 'yours' }),
            ]),
            el('span', { class: 'doc-card-zh', text: d.titleZh }),
            el('span', { class: 'doc-card-en', text: d.title }),
            el('span', { class: 'doc-card-sum', text: d.summary }),
            el('span', {
              class: `doc-card-count${n ? ' has' : ''}`,
              text: n ? `${n} card${n === 1 ? '' : 's'} from this text` : 'No cards yet',
            }),
          ],
        ),
      );
    }
    section.append(list);
    root.append(section);
  }

  root.append(
    el('p', {
      class: 'corpus-note',
      text:
        'Emails, contracts and judgments here are hypothetical — written to mirror the language of real PRC practice without reproducing any actual document. Statutes are the exception: enacted text carries no copyright and its exact wording is the thing being learned, so it is quoted as written.',
    }),
  );
}
