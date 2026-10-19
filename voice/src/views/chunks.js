// Chunks: the library of reusable blocks. Cards are draggable to reorder,
// and can be dropped on a tag to tag them.

import { el, clear, countWords, sortable, move, toast } from '../lib/dom.js';
import * as store from '../lib/store.js';
import * as claude from '../lib/claude.js';
import { splitPrompt, SPLIT_SCHEMA } from '../lib/prompts.js';

const view = { tag: null, kind: '', q: '', editing: null };

export function render(outlet) {
  const tagBar = el('div', { class: 'tagbar' });
  const grid = el('div', { class: 'cards' });
  const search = el('input', {
    type: 'search',
    placeholder: 'Search chunks',
    value: view.q,
    oninput: (e) => {
      view.q = e.target.value;
      drawCards();
    },
  });
  const kind = el(
    'select',
    {
      onchange: (e) => {
        view.kind = e.target.value;
        drawCards();
      },
    },
    [
      el('option', { value: '', text: 'All kinds' }),
      ...store.KINDS.map((k) => el('option', { value: k.id, text: k.label, selected: view.kind === k.id })),
    ],
  );

  function visible() {
    const q = view.q.toLowerCase();
    return store.get().chunks.filter(
      (c) =>
        (!view.tag || c.tags.includes(view.tag)) &&
        (!view.kind || c.kind === view.kind) &&
        (!q || `${c.title} ${c.text}`.toLowerCase().includes(q)),
    );
  }

  function drawTags() {
    clear(tagBar);
    const chunks = store.get().chunks;
    tagBar.append(
      el('button', {
        class: `chip ${view.tag ? '' : 'chip-on'}`,
        text: `All ${chunks.length}`,
        onclick: () => {
          view.tag = null;
          drawAll();
        },
      }),
    );
    for (const t of store.get().tags) {
      const n = chunks.filter((c) => c.tags.includes(t)).length;
      const chip = el('button', {
        class: `chip droppable ${view.tag === t ? 'chip-on' : ''}`,
        title: 'Click to filter. Drop a card here to tag it.',
        onclick: () => {
          view.tag = view.tag === t ? null : t;
          drawAll();
        },
      }, [t, el('span', { class: 'chip-n', text: n })]);
      chip.addEventListener('dragover', (e) => {
        e.preventDefault();
        chip.classList.add('drop-hover');
      });
      chip.addEventListener('dragleave', () => chip.classList.remove('drop-hover'));
      chip.addEventListener('drop', (e) => {
        e.preventDefault();
        chip.classList.remove('drop-hover');
        const c = store.chunk(e.dataTransfer.getData('text/plain'));
        if (c && !c.tags.includes(t)) {
          store.patchChunk(c.id, { tags: [...c.tags, t] });
          toast(`Tagged “${c.title || 'chunk'}” ${t}`);
          drawAll();
        }
      });
      tagBar.append(chip);
    }
    const input = el('input', { type: 'text', class: 'tag-input', placeholder: '+ New tag' });
    input.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      store.addTag(input.value);
      drawTags();
      tagBar.querySelector('.tag-input')?.focus();
    });
    tagBar.append(input);
    if (view.tag) {
      tagBar.append(
        el('button', {
          class: 'btn btn-ghost small',
          text: `Delete tag “${view.tag}”`,
          onclick: () => {
            if (!confirm(`Delete the tag “${view.tag}” from every chunk?`)) return;
            store.removeTag(view.tag);
            view.tag = null;
            drawAll();
          },
        }),
      );
    }
  }

  function drawCards() {
    clear(grid);
    const list = visible();
    if (!store.get().chunks.length) {
      grid.append(
        el('div', { class: 'empty' }, [
          el('p', { text: 'No chunks yet. A chunk is one reusable piece of your story: a project and its result, a claim about what you bring, the way you introduce yourself.' }),
          el('p', { text: 'Write them one at a time with New chunk, or paste a résumé or LinkedIn profile into Split with Claude and review what comes back.' }),
        ]),
      );
      return;
    }
    if (!list.length) grid.append(el('p', { class: 'empty', text: 'Nothing matches this filter.' }));
    list.forEach((c, i) =>
      grid.append(
        view.editing === c.id
          ? editor(c, () => {
              view.editing = null;
              drawAll();
            })
          : card(c, i, list),
      ),
    );
  }

  function card(c, i, list) {
    const kindLabel = store.KINDS.find((k) => k.id === c.kind)?.label || c.kind;
    const reorder = (delta) => {
      store.reorderChunks(move(list.map((x) => x.id), i, delta));
      drawCards();
    };
    return el('article', { class: `card kind-${c.kind}`, draggable: 'true', dataset: { id: c.id } }, [
      el('div', { class: 'card-top' }, [
        el('span', { class: 'grip', 'aria-hidden': 'true', text: '⋮⋮' }),
        el('span', { class: 'kind', text: kindLabel }),
        el('span', { class: 'muted small', text: `${countWords(c.text)} words` }),
      ]),
      el('h3', { text: c.title || 'Untitled' }),
      el('p', { class: 'card-text', text: c.text }),
      el(
        'div',
        { class: 'card-tags' },
        c.tags.map((t) =>
          el('span', { class: 'tag' }, [
            t,
            el('button', {
              class: 'tag-x',
              'aria-label': `Remove tag ${t}`,
              text: '×',
              onclick: () => {
                store.patchChunk(c.id, { tags: c.tags.filter((x) => x !== t) });
                drawAll();
              },
            }),
          ]),
        ),
      ),
      el('div', { class: 'card-actions' }, [
        el('button', { class: 'btn btn-ghost small', text: '↑', 'aria-label': 'Move up', onclick: () => reorder(-1), disabled: i === 0 }),
        el('button', { class: 'btn btn-ghost small', text: '↓', 'aria-label': 'Move down', onclick: () => reorder(1), disabled: i === list.length - 1 }),
        el('span', { class: 'spacer' }),
        el('button', {
          class: 'btn btn-ghost small',
          text: 'Edit',
          onclick: () => {
            view.editing = c.id;
            drawCards();
          },
        }),
        el('button', {
          class: 'btn btn-ghost small danger',
          text: 'Delete',
          onclick: () => {
            if (!confirm(`Delete “${c.title || 'this chunk'}”?`)) return;
            store.removeChunk(c.id);
            drawAll();
          },
        }),
      ]),
    ]);
  }

  function drawAll() {
    drawTags();
    drawCards();
  }

  sortable(grid, (ids) => store.reorderChunks(ids));

  const splitHost = el('div');

  outlet.append(
    el('div', { class: 'page' }, [
      el('header', { class: 'page-head' }, [
        el('h1', { text: 'Chunks' }),
        el('p', {
          text: 'Write each piece of your history once. Tag it by theme, then let the assembler pick and order the right ones for each job.',
        }),
      ]),
      el('div', { class: 'toolbar' }, [
        search,
        kind,
        el('span', { class: 'spacer' }),
        el('button', {
          class: 'btn',
          text: 'Split with Claude',
          onclick: () => {
            clear(splitHost);
            splitHost.append(splitPanel(() => {
              clear(splitHost);
              drawAll();
            }));
          },
        }),
        el('button', {
          class: 'btn btn-primary',
          text: 'New chunk',
          onclick: () => {
            const c = store.addChunk({ tags: view.tag ? [view.tag] : [], kind: view.kind || 'experience' });
            view.editing = c.id;
            view.q = '';
            search.value = '';
            drawAll();
            grid.querySelector('.card-edit input')?.focus();
          },
        }),
      ]),
      splitHost,
      tagBar,
      grid,
    ]),
  );
  drawAll();
}

function editor(c, done) {
  const title = el('input', { type: 'text', placeholder: 'Short title, e.g. “Cut churn 18% at Northwind”', value: c.title });
  const kind = el(
    'select',
    {},
    store.KINDS.map((k) => el('option', { value: k.id, text: k.label, selected: c.kind === k.id })),
  );
  const text = el('textarea', {
    rows: 7,
    placeholder: 'What happened, what you did, what changed. Concrete facts and numbers; write it the way you would say it.',
    value: c.text,
  });
  const chosen = new Set(c.tags);
  const tagPick = el('div', { class: 'tag-pick' });
  function drawPick() {
    clear(tagPick);
    for (const t of store.get().tags) {
      tagPick.append(
        el('button', {
          type: 'button',
          class: `chip ${chosen.has(t) ? 'chip-on' : ''}`,
          text: t,
          onclick: () => {
            chosen.has(t) ? chosen.delete(t) : chosen.add(t);
            drawPick();
          },
        }),
      );
    }
    const add = el('input', { type: 'text', class: 'tag-input', placeholder: '+ New tag' });
    add.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      const v = add.value.trim();
      if (!v) return;
      store.addTag(v);
      chosen.add(store.get().tags.find((t) => t.toLowerCase() === v.toLowerCase()));
      drawPick();
    });
    tagPick.append(add);
  }
  drawPick();

  const save = () => {
    store.patchChunk(c.id, {
      title: title.value.trim(),
      kind: kind.value,
      text: text.value.trim(),
      tags: [...chosen],
    });
    done();
  };
  return el('article', { class: 'card card-edit', dataset: { id: c.id } }, [
    el('div', { class: 'row' }, [title, kind]),
    text,
    tagPick,
    el('div', { class: 'card-actions' }, [
      el('span', { class: 'spacer' }),
      el('button', {
        class: 'btn btn-ghost',
        text: 'Cancel',
        onclick: () => {
          if (!c.title && !c.text) store.removeChunk(c.id);
          done();
        },
      }),
      el('button', { class: 'btn btn-primary', text: 'Save', onclick: save }),
    ]),
  ]);
}

function splitPanel(close) {
  const src = el('textarea', {
    rows: 10,
    placeholder: 'Paste a résumé, LinkedIn profile, performance review or old cover letter.',
  });
  const go = el('button', { class: 'btn btn-primary', text: 'Split into chunks' });
  const results = el('div', { class: 'split-results' });
  const panel = el('section', { class: 'panel' }, [
    el('div', { class: 'panel-head' }, [
      el('h2', { text: 'Split with Claude' }),
      el('button', { class: 'btn btn-ghost', text: 'Close', onclick: close }),
    ]),
    el('p', { class: 'muted', text: 'Claude breaks the text into one claim per chunk, keeps your facts and adds none. Review before adding.' }),
    src,
    go,
    results,
  ]);
  go.addEventListener('click', async () => {
    if (!src.value.trim()) return;
    go.disabled = true;
    go.textContent = 'Splitting…';
    clear(results);
    try {
      const { chunks } = await claude.structured(splitPrompt(src.value, store.get().tags), SPLIT_SCHEMA);
      const picks = chunks.map(() => true);
      chunks.forEach((c, i) =>
        results.append(
          el('label', { class: 'split-item' }, [
            el('input', { type: 'checkbox', checked: true, onchange: (e) => (picks[i] = e.target.checked) }),
            el('div', {}, [
              el('strong', { text: c.title }),
              el('span', { class: 'muted small', text: ` · ${c.kind} · ${c.tags.join(', ')}` }),
              el('p', { text: c.text }),
            ]),
          ]),
        ),
      );
      results.append(
        el('button', {
          class: 'btn btn-primary',
          text: 'Add selected',
          onclick: () => {
            const keep = chunks.filter((_, i) => picks[i]);
            for (const c of keep.reverse()) store.addChunk(c);
            toast(`Added ${keep.length} chunks.`);
            close();
          },
        }),
      );
    } catch (err) {
      toast(claude.friendlyError(err), 'error');
    } finally {
      go.disabled = false;
      go.textContent = 'Split into chunks';
    }
  });
  return panel;
}
