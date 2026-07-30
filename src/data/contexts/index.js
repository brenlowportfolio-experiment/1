// Context registry.
//
// To add a new context (e.g. 立法/statutes, 尽调报告/DD reports, 庭审/hearings):
//   1. create ./my-context.js exporting the same shape as emails.js
//   2. import it here and add it to CONTEXTS
// Nothing else in the app needs to change.

import emails from './emails.js';
import contracts from './contracts.js';
import judgments from './judgments.js';

export const CONTEXTS = [emails, contracts, judgments];

const docIndex = new Map();
for (const ctx of CONTEXTS) {
  for (const doc of ctx.docs) {
    docIndex.set(doc.id, { ...doc, contextId: ctx.id, contextName: ctx.name });
  }
}

export function getContext(id) {
  return CONTEXTS.find((c) => c.id === id) || null;
}

export function getDoc(id) {
  return docIndex.get(id) || null;
}

export function allDocs() {
  return [...docIndex.values()];
}
