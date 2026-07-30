// Tiny DOM helpers — enough structure to keep the views readable without
// pulling in a framework.

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'html') node.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'dataset') {
      Object.assign(node.dataset, v);
    } else node.setAttribute(k, v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

/** append() that ignores null/false, so `cond && el(...)` is safe inline. */
export function append(node, ...children) {
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.removeChild(node.firstChild);
  return node;
}

/**
 * Render Chinese with pinyin above it, aligned syllable-to-character where the
 * counts line up and as a single run above the word where they don't.
 */
export function ruby(term, pinyin, { size = '' } = {}) {
  const wrap = el('span', { class: `ruby ${size}`.trim() });
  const syllables = (pinyin || '').trim().split(/\s+/).filter(Boolean);
  const chars = [...term];

  if (syllables.length === chars.length && syllables.length > 0) {
    chars.forEach((ch, i) => {
      wrap.append(
        el('span', { class: 'ruby-unit' }, [
          el('span', { class: 'ruby-pinyin', text: syllables[i] }),
          el('span', { class: 'ruby-base', text: ch }),
        ]),
      );
    });
  } else {
    wrap.append(
      el('span', { class: 'ruby-unit' }, [
        el('span', { class: 'ruby-pinyin', text: pinyin || '' }),
        el('span', { class: 'ruby-base', text: term }),
      ]),
    );
  }
  return wrap;
}

export function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}
