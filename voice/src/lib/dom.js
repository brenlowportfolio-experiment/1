// Tiny DOM helpers, same shape as the parent app's.

export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') node.className = v;
    else if (k === 'text') node.textContent = v;
    else if (k === 'value') node.value = v;
    else if (k.startsWith('on') && typeof v === 'function') {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (k === 'dataset') {
      Object.assign(node.dataset, v);
    } else node.setAttribute(k, v === true ? '' : v);
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    node.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return node;
}

export function clear(node) {
  while (node.firstChild) node.firstChild.remove();
  return node;
}

export function uid(prefix = 'x') {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function countWords(text) {
  const t = (text || '').trim();
  return t ? t.split(/\s+/).length : 0;
}

export function measure(text, unit) {
  return unit === 'chars' ? (text || '').length : countWords(text);
}

/** Short status line that fades after a few seconds. */
export function toast(message, kind = 'info') {
  let host = document.getElementById('toasts');
  if (!host) {
    host = el('div', { id: 'toasts', class: 'toasts', 'aria-live': 'polite' });
    document.body.append(host);
  }
  const t = el('div', { class: `toast toast-${kind}`, text: message });
  host.append(t);
  setTimeout(() => t.remove(), kind === 'error' ? 8000 : 3500);
}

/**
 * Make the children of `list` reorderable by drag (mouse) and by the
 * up/down buttons each item renders (touch, keyboard). Items carry
 * data-id; onReorder receives the new id order.
 */
export function sortable(list, onReorder) {
  let dragging = null;
  list.addEventListener('dragstart', (e) => {
    const item = e.target.closest('[data-id]');
    if (!item || item.parentElement !== list) return;
    dragging = item;
    item.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', item.dataset.id);
  });
  list.addEventListener('dragover', (e) => {
    if (!dragging) return;
    e.preventDefault();
    const after = [...list.children].find((c) => {
      if (c === dragging) return false;
      const r = c.getBoundingClientRect();
      return e.clientY < r.top + r.height / 2;
    });
    if (after) list.insertBefore(dragging, after);
    else list.append(dragging);
  });
  list.addEventListener('dragend', () => {
    if (!dragging) return;
    dragging.classList.remove('dragging');
    dragging = null;
    onReorder([...list.children].map((c) => c.dataset.id).filter(Boolean));
  });
}

export function move(arr, index, delta) {
  const j = index + delta;
  if (j < 0 || j >= arr.length) return arr;
  const out = arr.slice();
  [out[index], out[j]] = [out[j], out[index]];
  return out;
}
