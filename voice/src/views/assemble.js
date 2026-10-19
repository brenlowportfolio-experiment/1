// Assemble: paste a job description, match chunks to it, order them, and
// draft each application question in your voice at its own length.

import { el, clear, measure, sortable, move, toast, uid, ask } from '../lib/dom.js';
import * as store from '../lib/store.js';
import * as claude from '../lib/claude.js';
import { score } from '../lib/match.js';
import { analysisPrompt, draftPrompt, ANALYSIS_SCHEMA } from '../lib/prompts.js';

const PRESETS = [
  { prompt: 'Cover letter', limit: 300, unit: 'words' },
  { prompt: 'Why do you want to work here?', limit: 150, unit: 'words' },
  { prompt: 'Tell us about yourself.', limit: 100, unit: 'words' },
  { prompt: 'Describe a difficult problem you solved and how.', limit: 250, unit: 'words' },
  { prompt: 'LinkedIn note to the hiring manager', limit: 300, unit: 'chars' },
];

let aborters = new Map();

export function render(outlet) {
  let a = store.app();
  if (!a) a = store.newApplication();

  const page = el('div', { class: 'page' });
  outlet.append(page);

  function draw() {
    clear(page);
    a = store.app();
    page.append(
      el('header', { class: 'page-head' }, [
        el('h1', { text: 'Assemble' }),
        el('p', {
          text: 'Paste the job description. Chunks are ranked as you type; Claude then picks the evidence, orders it and drafts each answer from the same material without repeating itself.',
        }),
      ]),
      appPicker(draw),
      jobPanel(a, draw),
      matchPanel(a, draw),
      sequencePanel(a, draw),
      questionsPanel(a, draw),
    );
  }
  draw();

  return () => {
    for (const ctl of aborters.values()) ctl.abort();
    aborters = new Map();
  };
}

function appPicker(redraw) {
  const st = store.get();
  const label = (x) => [x.company, x.role].filter(Boolean).join(' · ') || 'Untitled application';
  return el('div', { class: 'toolbar' }, [
    el(
      'select',
      {
        'aria-label': 'Application',
        onchange: (e) => {
          store.update((s) => (s.currentApp = e.target.value));
          redraw();
        },
      },
      st.applications.map((x) => el('option', { value: x.id, text: label(x), selected: x.id === st.currentApp })),
    ),
    el('span', { class: 'spacer' }),
    el('button', {
      class: 'btn',
      text: 'New application',
      onclick: () => {
        store.newApplication();
        redraw();
      },
    }),
    el('button', {
      class: 'btn btn-ghost danger',
      text: 'Delete',
      onclick: async () => {
        if (!(await ask('Delete this application and its drafts?'))) return;
        store.removeApp(st.currentApp);
        redraw();
      },
    }),
  ]);
}

function jobPanel(a, redraw) {
  const input = (key, placeholder) =>
    el('input', {
      type: 'text',
      placeholder,
      value: a[key],
      oninput: (e) => store.patchApp(a.id, { [key]: e.target.value }),
    });
  const jd = el('textarea', {
    rows: 12,
    placeholder: 'Paste the full job description.',
    value: a.jd,
  });
  let t;
  jd.addEventListener('input', () => {
    store.patchApp(a.id, { jd: jd.value });
    clearTimeout(t);
    t = setTimeout(() => {
      const host = document.getElementById('match-panel');
      host?.replaceWith(matchPanel(store.app(), redraw));
    }, 400);
  });
  const go = el('button', { class: 'btn btn-primary', text: a.analysis ? 'Re-analyze with Claude' : 'Analyze with Claude' });
  go.addEventListener('click', async () => {
    const st = store.get();
    if (!jd.value.trim()) return toast('Paste a job description first.', 'error');
    if (!st.chunks.length) return toast('Add some chunks first.', 'error');
    go.disabled = true;
    go.textContent = 'Matching your chunks…';
    try {
      const res = await claude.structured(analysisPrompt(store.app(), st.chunks), ANALYSIS_SCHEMA);
      const known = new Set(st.chunks.map((c) => c.id));
      res.requirements.forEach((r) => (r.chunk_ids = r.chunk_ids.filter((id) => known.has(id))));
      const sequence = res.sequence
        .filter((s) => known.has(s.chunk_id))
        .map((s) => ({ chunkId: s.chunk_id, purpose: s.purpose }));
      store.patchApp(a.id, { analysis: res, sequence });
      redraw();
    } catch (err) {
      toast(claude.friendlyError(err), 'error');
      go.disabled = false;
      go.textContent = 'Analyze with Claude';
    }
  });
  return el('section', { class: 'panel' }, [
    el('h2', { text: 'Job' }),
    el('div', { class: 'row' }, [input('company', 'Company'), input('role', 'Role title')]),
    jd,
    go,
  ]);
}

function matchPanel(a, redraw) {
  const st = store.get();
  const panel = el('section', { class: 'panel', id: 'match-panel' }, [el('h2', { text: 'Match' })]);
  const an = a.analysis;
  if (an) {
    const title = (id) => store.chunk(id)?.title || 'Untitled';
    panel.append(
      el('p', { text: an.role_summary }),
      el('p', { class: 'angle' }, [el('strong', { text: 'Through line: ' }), an.angle]),
      el(
        'ul',
        { class: 'reqs' },
        an.requirements.map((r) =>
          el('li', { class: r.chunk_ids.length ? '' : 'req-gap' }, [
            el('span', { class: `pri pri-${r.priority}`, text: r.priority === 'must' ? 'Must' : 'Nice' }),
            el('span', { class: 'req-text', text: r.requirement }),
            el(
              'span',
              { class: 'req-chunks' },
              r.chunk_ids.length
                ? r.chunk_ids.map((id) => el('span', { class: 'tag', text: title(id) }))
                : el('span', { class: 'muted small', text: 'No evidence yet' }),
            ),
          ]),
        ),
      ),
    );
    if (an.gaps.length) {
      panel.append(
        el('div', { class: 'gaps' }, [
          el('strong', { text: 'Gaps worth a new chunk' }),
          el('ul', {}, an.gaps.map((g) => el('li', { text: g }))),
        ]),
      );
    }
  }

  if (!st.chunks.length) {
    panel.append(el('p', { class: 'empty' }, ['No chunks yet. ', el('a', { href: '#chunks', text: 'Add some' }), ' to match against.']));
    return panel;
  }
  const scores = score(a.jd, st.chunks);
  const inSeq = new Set(a.sequence.map((s) => s.chunkId));
  const ranked = st.chunks
    .slice()
    .sort((x, y) => (scores.get(y.id)?.score || 0) - (scores.get(x.id)?.score || 0));
  const list = el('ul', { class: 'library' });
  for (const c of ranked) {
    const s = scores.get(c.id);
    const item = el('li', { class: `lib-item ${inSeq.has(c.id) ? 'in-seq' : ''}`, draggable: inSeq.has(c.id) ? 'false' : 'true', dataset: { chunk: c.id } }, [
      el('span', { class: 'meter', title: `Keyword overlap ${s.score}%` }, [el('span', { style: `width:${s.score}%` })]),
      el('div', { class: 'lib-body' }, [
        el('strong', { text: c.title || 'Untitled' }),
        el('span', { class: 'muted small', text: [c.tags.join(', '), s.hits.length ? `matches: ${s.hits.join(', ')}` : ''].filter(Boolean).join(' · ') }),
      ]),
      inSeq.has(c.id)
        ? el('span', { class: 'muted small', text: 'In sequence' })
        : el('button', {
            class: 'btn btn-ghost small',
            text: 'Add',
            onclick: () => {
              store.patchApp(a.id, { sequence: [...a.sequence, { chunkId: c.id, purpose: '' }] });
              redraw();
            },
          }),
    ]);
    item.addEventListener('dragstart', (e) => {
      e.dataTransfer.setData('application/x-chunk', c.id);
      e.dataTransfer.effectAllowed = 'copy';
    });
    list.append(item);
  }
  panel.append(
    el('h3', { text: a.jd.trim() ? 'Library ranked by keyword overlap' : 'Library' }),
    el('p', { class: 'muted small', text: 'Drag a chunk into the sequence, or press Add.' }),
    list,
  );
  return panel;
}

function sequencePanel(a, redraw) {
  const list = el('ol', { class: 'sequence' });
  const setSeq = (sequence) => {
    store.patchApp(a.id, { sequence });
    redraw();
  };
  a.sequence.forEach((s, i) => {
    const c = store.chunk(s.chunkId);
    if (!c) return;
    list.append(
      el('li', { class: 'seq-item', draggable: 'true', dataset: { id: s.chunkId } }, [
        el('span', { class: 'grip', 'aria-hidden': 'true', text: '⋮⋮' }),
        el('span', { class: 'seq-n', text: i + 1 }),
        el('div', { class: 'seq-body' }, [
          el('strong', { text: c.title || 'Untitled' }),
          el('input', {
            type: 'text',
            class: 'purpose',
            placeholder: 'What this chunk does in the story',
            value: s.purpose,
            draggable: 'false',
            oninput: (e) => {
              const seq = store.app().sequence.map((x) => (x.chunkId === s.chunkId ? { ...x, purpose: e.target.value } : x));
              store.patchApp(a.id, { sequence: seq });
            },
          }),
        ]),
        el('div', { class: 'seq-actions' }, [
          el('button', { class: 'btn btn-ghost small', text: '↑', 'aria-label': 'Move up', disabled: i === 0, onclick: () => setSeq(move(a.sequence, i, -1)) }),
          el('button', { class: 'btn btn-ghost small', text: '↓', 'aria-label': 'Move down', disabled: i === a.sequence.length - 1, onclick: () => setSeq(move(a.sequence, i, 1)) }),
          el('button', { class: 'btn btn-ghost small', text: 'Remove', onclick: () => setSeq(a.sequence.filter((x) => x.chunkId !== s.chunkId)) }),
        ]),
      ]),
    );
  });

  sortable(list, (ids) => {
    const byId = new Map(store.app().sequence.map((s) => [s.chunkId, s]));
    store.patchApp(a.id, { sequence: ids.map((id) => byId.get(id)).filter(Boolean) });
    redraw();
  });
  // Drops from the library.
  const zone = el('div', { class: 'dropzone' }, [list]);
  zone.addEventListener('dragover', (e) => {
    if (!e.dataTransfer.types.includes('application/x-chunk')) return;
    e.preventDefault();
    zone.classList.add('drop-hover');
  });
  zone.addEventListener('dragleave', () => zone.classList.remove('drop-hover'));
  zone.addEventListener('drop', (e) => {
    const id = e.dataTransfer.getData('application/x-chunk');
    zone.classList.remove('drop-hover');
    if (!id || a.sequence.some((s) => s.chunkId === id)) return;
    e.preventDefault();
    setSeq([...a.sequence, { chunkId: id, purpose: '' }]);
  });
  if (!a.sequence.length) {
    zone.append(el('p', { class: 'empty', text: 'Analyze with Claude for a suggested order, or drag chunks here.' }));
  }
  return el('section', { class: 'panel' }, [
    el('h2', { text: 'Sequence' }),
    el('p', { class: 'muted', text: 'The chunks every answer draws on, in story order. Drag to reorder.' }),
    zone,
  ]);
}

function questionsPanel(a, redraw) {
  const host = el('div', { class: 'questions' });
  a.questions.forEach((q) => host.append(questionCard(a.id, q.id, redraw)));
  const presets = el(
    'select',
    {
      'aria-label': 'Add a question',
      onchange: (e) => {
        const p = e.target.value === 'custom' ? { prompt: '', limit: 200, unit: 'words' } : PRESETS[Number(e.target.value)];
        if (!p) return;
        store.patchApp(a.id, {
          questions: [...store.app().questions, { id: uid('q'), answer: '', note: '', ...p }],
        });
        redraw();
      },
    },
    [
      el('option', { value: '', text: 'Add a question…', selected: true }),
      ...PRESETS.map((p, i) => el('option', { value: i, text: `${p.prompt} (${p.limit} ${p.unit})` })),
      el('option', { value: 'custom', text: 'Custom question' }),
    ],
  );
  return el('section', { class: 'panel' }, [
    el('h2', { text: 'Questions' }),
    el('p', {
      class: 'muted',
      text: 'Each answer is written from the same sequence at its own length. Drafts already written for this application are passed along so the next one takes a different angle.',
    }),
    host,
    presets,
  ]);
}

function questionCard(appId, qid, redraw) {
  const a = store.app(appId);
  const q = a.questions.find((x) => x.id === qid);
  const patch = (p) => store.patchQuestion(appId, qid, p);

  const answer = el('textarea', { rows: 10, class: 'answer', placeholder: 'The draft appears here. Edit freely.', value: q.answer });
  const count = el('span', { class: 'count' });
  const updateCount = () => {
    const cur = store.app(appId).questions.find((x) => x.id === qid);
    const n = measure(answer.value, cur.unit);
    count.textContent = `${n} / ${cur.limit} ${cur.unit}`;
    count.className = `count ${n > cur.limit ? 'over' : n >= cur.limit * 0.85 ? 'ok' : ''}`;
  };
  answer.addEventListener('input', () => {
    patch({ answer: answer.value });
    updateCount();
  });

  const limit = el('input', { type: 'number', min: 10, step: 10, value: q.limit, class: 'limit', 'aria-label': 'Length limit' });
  limit.addEventListener('input', () => {
    patch({ limit: Number(limit.value) || 0 });
    updateCount();
  });
  const unit = el('select', { 'aria-label': 'Unit' }, [
    el('option', { value: 'words', text: 'words', selected: q.unit === 'words' }),
    el('option', { value: 'chars', text: 'characters', selected: q.unit === 'chars' }),
  ]);
  unit.addEventListener('change', () => {
    patch({ unit: unit.value });
    updateCount();
  });

  const gen = el('button', { class: 'btn btn-primary', text: q.answer ? 'Redraft' : 'Draft' });
  const revise = el('input', { type: 'text', placeholder: 'Revise: e.g. lead with the pricing story, less formal' });
  const reviseBtn = el('button', { class: 'btn', text: 'Revise' });
  const buttons = [gen, reviseBtn];

  async function run(instruction) {
    const app = store.app(appId);
    const cur = app.questions.find((x) => x.id === qid);
    const chunks = app.sequence.map((s) => store.chunk(s.chunkId)).filter(Boolean);
    if (!chunks.length) return toast('Put at least one chunk in the sequence first.', 'error');
    if (!cur.prompt.trim()) return toast('Write the question first.', 'error');
    if (aborters.has(qid)) {
      aborters.get(qid).abort();
      return;
    }
    const ctl = new AbortController();
    aborters.set(qid, ctl);
    const before = answer.value;
    const others = app.questions.filter((x) => x.id !== qid && x.answer.trim());
    const prompt = draftPrompt({ app, question: cur, chunks, others, instruction, previous: instruction ? before : '' });
    buttons.forEach((b) => (b.disabled = true));
    gen.disabled = false;
    gen.textContent = 'Stop';
    answer.classList.add('streaming');
    count.textContent = 'Thinking…';
    try {
      const final = await claude.stream(
        prompt,
        (t) => {
          answer.value = t;
          updateCount();
        },
        ctl.signal,
      );
      answer.value = final;
      patch({ answer: final, previous: before });
      revise.value = '';
    } catch (err) {
      const msg = claude.friendlyError(err);
      if (msg === 'Stopped.') patch({ answer: answer.value });
      else {
        answer.value = before;
        toast(msg, 'error');
      }
    } finally {
      aborters.delete(qid);
      answer.classList.remove('streaming');
      buttons.forEach((b) => (b.disabled = false));
      gen.textContent = answer.value ? 'Redraft' : 'Draft';
      updateCount();
      undo.hidden = !store.app(appId).questions.find((x) => x.id === qid).previous;
    }
  }
  gen.addEventListener('click', () => run(''));
  reviseBtn.addEventListener('click', () => revise.value.trim() && run(revise.value.trim()));
  revise.addEventListener('keydown', (e) => e.key === 'Enter' && reviseBtn.click());

  const quick = (label, instr) => el('button', { class: 'chip', text: label, onclick: () => !aborters.has(qid) && answer.value && run(instr) });

  const undo = el('button', {
    class: 'btn btn-ghost small',
    text: 'Undo last draft',
    hidden: !q.previous,
    onclick: () => {
      const cur = store.app(appId).questions.find((x) => x.id === qid);
      answer.value = cur.previous || '';
      patch({ answer: answer.value, previous: '' });
      undo.hidden = true;
      updateCount();
    },
  });

  const card = el('article', { class: 'qcard' }, [
    el('div', { class: 'q-head' }, [
      el('textarea', {
        rows: 2,
        class: 'q-prompt',
        placeholder: 'Paste the application question',
        value: q.prompt,
        oninput: (e) => patch({ prompt: e.target.value }),
      }),
      el('button', {
        class: 'btn btn-ghost small danger',
        text: 'Remove',
        onclick: async () => {
          if (q.answer && !(await ask('Remove this question and its draft?', 'Remove'))) return;
          store.patchApp(appId, { questions: store.app(appId).questions.filter((x) => x.id !== qid) });
          redraw();
        },
      }),
    ]),
    el('div', { class: 'row wrap q-opts' }, [
      el('span', { class: 'muted small', text: 'Up to' }),
      limit,
      unit,
      el('input', {
        type: 'text',
        class: 'grow',
        placeholder: 'Optional direction, e.g. focus on the B2B work',
        value: q.note,
        oninput: (e) => patch({ note: e.target.value }),
      }),
      gen,
    ]),
    answer,
    el('div', { class: 'row wrap q-foot' }, [
      count,
      undo,
      el('span', { class: 'spacer' }),
      el('button', {
        class: 'btn btn-ghost small',
        text: 'Copy',
        onclick: async () => {
          try {
            await navigator.clipboard.writeText(answer.value);
            toast('Copied.');
          } catch {
            answer.select();
          }
        },
      }),
    ]),
    el('div', { class: 'row wrap' }, [
      quick('Tighter', 'Cut filler and make every sentence earn its place. Stay within the length.'),
      quick('More like me', 'Read the writing samples again and bring the rhythm, word choice and punctuation closer to them. Remove anything that sounds like a template.'),
      quick('More specific', 'Replace general claims with the concrete facts and numbers from the chunks.'),
      quick('Warmer', 'Slightly warmer and more personal, without flattery.'),
    ]),
    el('div', { class: 'row' }, [revise, reviseBtn]),
  ]);
  updateCount();
  return card;
}
