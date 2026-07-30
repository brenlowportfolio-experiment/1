// User-added vocabulary, layered over the built-in dictionary.
//
// Kept in its own storage key (and its own module) so that harvesting terms
// from an uploaded document never risks the deck, and so the built-in
// dictionary file stays a clean, reviewable artefact.

const KEY = 'falv-zhongwen.userdict.v1';

let terms = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(terms));
  } catch (e) {
    console.warn('Could not save vocabulary:', e);
  }
  listeners.forEach((fn) => fn(terms));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** @returns {Object<string, [pinyin, meaning, tag]>} */
export function getUserTerms() {
  return terms;
}

export function userTermCount() {
  return Object.keys(terms).length;
}

/** @param {Array<{term, pinyin, meaning, tag}>} entries */
export function addUserTerms(entries) {
  let added = 0;
  for (const e of entries) {
    if (!e.term) continue;
    if (!terms[e.term]) added++;
    terms[e.term] = [e.pinyin || '', e.meaning || '', e.tag || 'law'];
  }
  persist();
  return added;
}

export function removeUserTerm(term) {
  delete terms[term];
  persist();
}

export function exportUserTerms() {
  return JSON.stringify(terms, null, 2);
}

export function importUserTerms(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('Not a vocabulary file');
  terms = { ...terms, ...parsed };
  persist();
}

export function clearUserTerms() {
  terms = {};
  persist();
}
