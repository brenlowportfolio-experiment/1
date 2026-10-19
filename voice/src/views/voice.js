// Voice: API settings, the 3 to 5 writing samples that get injected into
// every system prompt, optional voice notes, and backup.

import { el, clear, countWords, toast, ask, refresh } from '../lib/dom.js';
import * as store from '../lib/store.js';
import * as claude from '../lib/claude.js';
import { voiceNotesPrompt } from '../lib/prompts.js';

export function render(outlet) {
  const st = store.get();

  const settings = el('section', { class: 'panel' }, [
    el('h2', { text: claude.NEEDS_KEY ? 'Connection' : 'Model' }),
    el('p', { class: 'muted', text: claude.CONNECTION_NOTE }),
    claude.NEEDS_KEY && field('API key', keyInput(st)),
    el('div', { class: 'row' }, [
      field(
        'Model',
        select(
          claude.MODEL_CHOICES,
          st.settings[claude.MODEL_SETTING] || claude.MODEL_CHOICES[0][0],
          (v) => store.update((s) => (s.settings[claude.MODEL_SETTING] = v)),
        ),
      ),
      field(
        'Effort',
        select(
          [
            ['low', 'Low: fastest'],
            ['medium', 'Medium'],
            ['high', 'High: most careful'],
          ],
          st.settings.effort,
          (v) => store.update((s) => (s.settings.effort = v)),
        ),
      ),
    ]),
  ]);

  const samplesList = el('div', { class: 'samples' });
  const counter = el('span', { class: 'pill' });
  const addBtn = el('button', { class: 'btn', text: 'Add sample' });

  function drawCounter() {
    const samples = store.get().samples;
    const n = samples.filter((s) => s.text.trim()).length;
    counter.textContent = `${n} of ${store.MIN_SAMPLES} to ${store.MAX_SAMPLES}`;
    counter.className = `pill ${n >= store.MIN_SAMPLES ? 'pill-ok' : 'pill-warn'}`;
    addBtn.disabled = samples.length >= store.MAX_SAMPLES;
  }

  function drawSamples() {
    clear(samplesList);
    const samples = store.get().samples;
    drawCounter();
    if (!samples.length) {
      samplesList.append(
        el('p', {
          class: 'empty',
          text: 'Paste 3 to 5 pieces you wrote yourself, unedited by anyone else: an article, an essay, a long email to a colleague. Mixed lengths and occasions give the best read of your voice.',
        }),
      );
    }
    samples.forEach((s, i) => samplesList.append(sampleCard(s, i, drawSamples, drawCounter)));
  }
  addBtn.addEventListener('click', () => {
    store.addSample();
    drawSamples();
    samplesList.querySelector('.sample:last-child input')?.focus();
  });
  drawSamples();

  const notes = el('textarea', {
    rows: 7,
    placeholder: '- Short declarative sentences, rarely over 20 words\n- Never uses exclamation marks\n- Opens with the point, not with context',
    value: st.voiceNotes,
    oninput: (e) => store.update((s) => (s.voiceNotes = e.target.value)),
  });
  const distil = el('button', { class: 'btn', text: 'Distil from samples' });
  distil.addEventListener('click', async () => {
    distil.disabled = true;
    distil.textContent = 'Reading your samples…';
    try {
      notes.value = await claude.text(voiceNotesPrompt(), 2000);
      store.update((s) => (s.voiceNotes = notes.value));
    } catch (err) {
      toast(claude.friendlyError(err), 'error');
    } finally {
      distil.disabled = false;
      distil.textContent = 'Distil from samples';
    }
  });

  outlet.append(
    el('div', { class: 'page' }, [
      el('header', { class: 'page-head' }, [
        el('h1', { text: 'Voice' }),
        el('p', {
          text: 'Every request to Claude starts with these samples, so drafts take on your vocabulary, sentence rhythm and habits instead of a generic application register.',
        }),
      ]),
      settings,
      el('section', { class: 'panel' }, [
        el('div', { class: 'panel-head' }, [el('h2', { text: 'Writing samples' }), counter]),
        samplesList,
        addBtn,
      ]),
      el('section', { class: 'panel' }, [
        el('h2', { text: 'Voice notes' }),
        el('p', {
          class: 'muted',
          text: 'Optional. Explicit rules sent alongside the samples. Distil a first pass, then correct anything that is not you.',
        }),
        notes,
        distil,
      ]),
      dataPanel(),
    ]),
  );
}

function sampleCard(s, i, redraw, recount) {
  const count = el('span', { class: 'muted small', text: `${countWords(s.text)} words` });
  return el('div', { class: 'sample' }, [
    el('div', { class: 'row' }, [
      el('input', {
        type: 'text',
        placeholder: `Sample ${i + 1} title, e.g. "Blog post on pricing"`,
        value: s.title,
        oninput: (e) => store.patchSample(s.id, { title: e.target.value }),
      }),
      el('button', {
        class: 'btn btn-ghost',
        text: 'Remove',
        onclick: async () => {
          if (s.text.trim() && !(await ask('Remove this sample?', 'Remove'))) return;
          store.removeSample(s.id);
          redraw();
        },
      }),
    ]),
    el('textarea', {
      rows: 8,
      placeholder: 'Paste the full text.',
      value: s.text,
      oninput: (e) => {
        store.patchSample(s.id, { text: e.target.value });
        count.textContent = `${countWords(e.target.value)} words`;
        recount();
      },
    }),
    count,
  ]);
}

function keyInput(st) {
  const input = el('input', {
    type: 'password',
    autocomplete: 'off',
    spellcheck: 'false',
    placeholder: 'sk-ant-…',
    value: st.settings.apiKey,
    oninput: (e) => store.update((s) => (s.settings.apiKey = e.target.value.trim())),
  });
  const toggle = el('button', {
    class: 'btn btn-ghost',
    type: 'button',
    text: 'Show',
    onclick: () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      toggle.textContent = input.type === 'password' ? 'Show' : 'Hide';
    },
  });
  return el('div', { class: 'row' }, [input, toggle]);
}

function dataPanel() {
  const file = el('input', { type: 'file', accept: 'application/json', hidden: true });
  file.addEventListener('change', async () => {
    const f = file.files[0];
    if (!f) return;
    try {
      store.importJSON(await f.text());
      toast('Backup restored.');
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
  return el('section', { class: 'panel' }, [
    el('h2', { text: 'Data' }),
    el('p', {
      class: 'muted',
      text: claude.STORAGE_NOTE,
    }),
    el('div', { class: 'row wrap' }, [
      el('button', {
        class: 'btn',
        text: 'Export',
        onclick: () =>
          claude
            .saveFile(`voicebank-${new Date().toISOString().slice(0, 10)}.json`, store.exportJSON())
            .catch((err) => toast(err.message, 'error')),
      }),
      el('button', { class: 'btn', text: 'Import', onclick: () => file.click() }),
      file,
    ]),
  ]);
}

export function field(label, control) {
  return el('label', { class: 'field' }, [el('span', { class: 'field-label', text: label }), control]);
}

export function select(options, value, onChange) {
  const s = el(
    'select',
    { onchange: (e) => onChange(e.target.value) },
    options.map(([v, l]) => el('option', { value: v, text: l, selected: v === value })),
  );
  return s;
}
