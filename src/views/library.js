// Library — browse contexts and the hypotheticals inside them.

import { el, clear } from '../lib/dom.js';
import { contextsWithDocs, storyFor, STORIES, getDoc } from '../data/contexts/index.js';
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

    // Scenes read in order, so a context made of stories is laid out story by
    // story; anything not in a story follows in a grid of its own.
    const groups = storyGroups(ctx.docs);
    for (const g of groups) {
      if (g.story) {
        section.append(
          el('div', { class: 'story-head' }, [
            el('h3', {}, [g.story.titleZh, el('span', { class: 'ctx-en', text: g.story.title })]),
            el('p', { class: 'story-blurb', text: g.story.blurb }),
            storyRoute(g.story),
          ]),
        );
      }
      section.append(docGrid(g.docs));
    }
    root.append(section);
  }

  /** The whole story in order — scenes and the documents between them. */
  function storyRoute(story) {
    const route = el('ol', { class: 'story-route' });
    story.parts.forEach((id) => {
      const d = getDoc(id);
      if (!d) return;
      route.append(
        el('li', {}, [
          el('button', {
            class: `route-step${d.dialogue ? '' : ' is-doc'}`,
            title: d.title,
            onclick: () => navigate({ view: 'reader', docId: d.id }),
          }, [
            el('span', { class: 'zh', text: d.titleZh }),
            !d.dialogue && el('span', { class: 'route-ctx', text: d.contextName }),
          ]),
        ]),
      );
    });
    return route;
  }

  function docGrid(docs) {
    const list = el('div', { class: 'doc-grid' });
    for (const d of docs) {
      const n = perDoc.get(d.id) || 0;
      const moments = d.moments?.length || 0;
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
              storyBadge(d.id),
            ]),
            el('span', { class: 'doc-card-zh', text: d.titleZh }),
            el('span', { class: 'doc-card-en', text: d.title }),
            el('span', { class: 'doc-card-sum', text: d.summary }),
            el('span', { class: 'doc-card-foot' }, [
              el('span', {
                class: `doc-card-count${n ? ' has' : ''}`,
                text: n ? `${n} card${n === 1 ? '' : 's'} from this text` : 'No cards yet',
              }),
              moments > 0 &&
                el('span', {
                  class: 'moment-count',
                  title: `${moments} key moments to practise: “what would you say?”`,
                  text: `💬 ${moments}`,
                }),
            ]),
          ],
        ),
      );
    }
    return list;
  }

  root.append(
    el('p', {
      class: 'corpus-note',
      text:
        'Emails, contracts, judgments and the scenes here are hypothetical — written to mirror the language of real PRC practice without reproducing any actual document or proceeding. Statutes are the exception: enacted text carries no copyright and its exact wording is the thing being learned, so it is quoted as written.',
    }),
  );
}

/**
 * Split a context's scenes into stories (in story order) and the rest. A
 * context with no scenes comes back as one plain group.
 */
function storyGroups(docs) {
  const byId = new Map(docs.map((d) => [d.id, d]));
  const used = new Set();
  const groups = [];
  for (const story of STORIES) {
    // Only scenes are grouped: a story's emails or judgment stay filed in
    // their own context, and the story heading's route links out to them.
    const mine = story.parts.map((id) => byId.get(id)).filter((d) => d?.dialogue);
    if (!mine.length) continue;
    mine.forEach((d) => used.add(d.id));
    groups.push({ story, docs: mine });
  }
  const rest = docs.filter((d) => !used.has(d.id));
  if (rest.length || !groups.length) groups.push({ story: null, docs: rest });
  return groups;
}

/** "宏图诉瑞泽 · 2/5" on documents that belong to a story — including the
 *  judgment, which lives in another context but ends the same story. */
function storyBadge(id) {
  const st = storyFor(id);
  if (!st) return null;
  return el('span', {
    class: 'story-tag',
    title: `${st.story.title}, part ${st.index + 1} of ${st.story.parts.length}`,
    text: `${st.story.titleZh} · ${st.index + 1}/${st.story.parts.length}`,
  });
}
