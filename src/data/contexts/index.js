// Context registry.
//
// To add a new context (e.g. 立法/statutes, 尽调报告/DD reports, 庭审/hearings):
//   1. create ./my-context.js exporting the same shape as emails.js
//   2. import it here and add it to CONTEXTS
// Nothing else in the app needs to change.
//
// Documents the user has generated from an uploaded source live in the store,
// not in these files, and are folded in at read time.

import emails from './emails.js';
import contracts from './contracts.js';
import judgments from './judgments.js';
import statutes from './statutes.js';
import dialogues from './dialogues.js';
import * as store from '../../lib/store.js';

export const CONTEXTS = [emails, contracts, judgments, statutes, dialogues];

function decorate(doc, ctx) {
  return { ...doc, contextId: ctx.id, contextName: ctx.name };
}

function builtInDocs() {
  return CONTEXTS.flatMap((ctx) => ctx.docs.map((d) => decorate(d, ctx)));
}

function userDocs() {
  return store.getUserDocs().map((d) => {
    const ctx = CONTEXTS.find((c) => c.id === d.contextId) || CONTEXTS[0];
    return { ...decorate(d, ctx), custom: true };
  });
}

export function allDocs() {
  return [...builtInDocs(), ...userDocs()];
}

export function getContext(id) {
  return CONTEXTS.find((c) => c.id === id) || null;
}

export function getDoc(id) {
  return allDocs().find((d) => d.id === id) || null;
}

/**
 * All shipped document text as one string. Used as a boilerplate reference:
 * anything the built-in hypotheticals already say is, by definition, stock
 * legal phrasing rather than something unique to a user's uploaded document.
 */
export function builtInCorpus() {
  return CONTEXTS.flatMap((c) => c.docs.flatMap((d) => d.paragraphs)).join('\n');
}

/** Contexts with their user-generated documents merged in, for the library. */
export function contextsWithDocs() {
  const mine = userDocs();
  return CONTEXTS.map((ctx) => ({
    ...ctx,
    docs: [
      ...ctx.docs.map((d) => decorate(d, ctx)),
      ...mine.filter((d) => d.contextId === ctx.id),
    ],
  }));
}

// ── stories ────────────────────────────────────────────────────────────────
//
// A story is an ordered run of documents about the same people and the same
// dispute, which may cross contexts: 宏图诉瑞泽 begins as dialogue and ends as
// a judgment in Judgments. The reader uses this to show where a document sits
// and to step to the next part.

export const STORIES = [
  {
    id: 'hongtu',
    titleZh: '宏图诉瑞泽',
    title: 'Hongtu v Ruize',
    parts: ['dl-interview', 'dl-mediation', 'dl-cross', 'dl-closing', 'jg-sale-contract'],
  },
];

/** @returns {{story, index, prev, next} | null} */
export function storyFor(docId) {
  for (const story of STORIES) {
    const index = story.parts.indexOf(docId);
    if (index === -1) continue;
    return {
      story,
      index,
      prev: index > 0 ? getDoc(story.parts[index - 1]) : null,
      next: index < story.parts.length - 1 ? getDoc(story.parts[index + 1]) : null,
    };
  }
  return null;
}
