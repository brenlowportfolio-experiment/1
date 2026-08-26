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
import * as store from '../../lib/store.js';

export const CONTEXTS = [emails, contracts, judgments, statutes];

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
