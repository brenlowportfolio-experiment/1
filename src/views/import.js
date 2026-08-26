// Import — mine a real document for vocabulary, then turn it into study
// material one of two ways.
//
// Which way depends on what the document is, and the distinction is the whole
// design:
//
//   Verbatim   — for public law and text you hold the rights to. A statute's
//                exact wording is the object of study; paraphrasing 第五百七十七条
//                and still calling it 第五百七十七条 would be pointless. Sections
//                are quoted as enacted.
//
//   Hypothetical — for anything belonging to a client or counterparty. The
//                document contributes its language and never its text; what
//                gets saved is a fresh document written to exercise the same
//                vocabulary.
//
// Either way the source itself is analysed in memory and never persisted.

import { el, clear, append, ruby } from '../lib/dom.js';
import { discover, verbatimOverlap } from '../lib/discover.js';
import { segment } from '../lib/segment.js';
import { builtInCount } from '../lib/lexicon.js';
import { sectionize, classify, cnToArabic } from '../lib/sectionize.js';
import { normalizeText } from '../lib/normalize.js';
import { loadGlossary, glossTerm, glossaryReady, SOURCE_LABEL } from '../lib/translate.js';
import { extractPdfText } from '../lib/pdftext.js';
import * as userdict from '../lib/userdict.js';
import * as store from '../lib/store.js';
import { CONTEXTS } from '../data/contexts/index.js';
import { toast } from './reader.js';

const TYPE_LABEL = {
  judgments: '民事判决书 / civil judgment',
  contracts: '合同 / contract',
  emails: '往来邮件 / professional correspondence',
  statutes: '法律法规 / statute or regulation',
};

export function render(root, { navigate }) {
  clear(root);

  let sourceText = '';
  let analysis = null;
  let cut = null; // sectionize() result
  let kind = null; // classify() result
  let picks = new Map(); // term -> {pinyin, meaning, tag, on}
  let mode = 'verbatim';

  root.append(
    el('header', { class: 'page-head' }, [
      el('h1', { text: 'Import' }),
      el('p', {
        class: 'lede',
        text:
          'Feed the app a real statute, judgment, contract or email. It works out what the document is, finds the vocabulary it doesn’t yet know, and turns a manageable section into study material.',
      }),
    ]),
  );

  const sourceSec = el('section', { class: 'panel' });
  const reportSec = el('section', { class: 'panel', hidden: 'hidden' });
  const makeSec = el('section', { class: 'panel', hidden: 'hidden' });
  const manageSec = el('section', { class: 'panel' });
  root.append(sourceSec, reportSec, makeSec, manageSec);

  // ── 1. source ────────────────────────────────────────────────────────────
  const textarea = el('textarea', {
    class: 'source-input',
    rows: '10',
    placeholder:
      '把判决书、合同或邮件正文粘贴到这里…\n\nPaste the Chinese text of a judgment, contract or email here (or drop a .txt file).',
    spellcheck: 'false',
  });

  const status = el('p', { class: 'panel-note file-status', hidden: 'hidden' });

  async function loadFile(f) {
    if (!f) return;
    try {
      if (/\.pdf$/i.test(f.name) || f.type === 'application/pdf') {
        status.hidden = false;
        status.textContent = `Reading ${f.name} \u2014 loading the PDF engine\u2026`;
        const buf = await f.arrayBuffer();
        const text = await extractPdfText(buf, (done, total) => {
          status.textContent = `Reading ${f.name} \u2014 page ${done} of ${total}\u2026`;
        });
        if (countHan(text) < 20) {
          status.textContent =
            'No Chinese text found. If this PDF is a scan it holds images rather than text, and would need OCR first.';
          return;
        }
        textarea.value = text;
        status.textContent = `${f.name}: ${countHan(text).toLocaleString()} Chinese characters extracted.`;
      } else {
        const text = await f.text();
        if (/\u0000/.test(text) || countHan(text) < 20) {
          status.hidden = false;
          status.textContent =
            'That file does not look like readable Chinese text. Word files need opening in Word first \u2014 copy the text and paste it in.';
          return;
        }
        textarea.value = text;
        status.hidden = true;
      }
      analyse();
    } catch (err) {
      status.hidden = false;
      status.textContent = `Could not read that file: ${err.message}`;
    }
  }

  const fileInput = el('input', {
    type: 'file',
    accept: '.pdf,.txt,.md,.csv,application/pdf,text/plain',
    onchange: (e) => loadFile(e.target.files[0]),
  });

  textarea.addEventListener('dragover', (e) => {
    e.preventDefault();
    textarea.classList.add('dropping');
  });
  textarea.addEventListener('dragleave', () => textarea.classList.remove('dropping'));
  textarea.addEventListener('drop', (e) => {
    e.preventDefault();
    textarea.classList.remove('dropping');
    loadFile(e.dataTransfer.files[0]);
  });

  append(
    sourceSec,
    el('h2', { text: '1 · Source document' }),
    el('p', {
      class: 'panel-note',
      text:
        'Analysed entirely in your browser. The source text is held in memory for this session only — it is never written to storage and never becomes a study document.',
    }),
    textarea,
    status,
    el('div', { class: 'row' }, [
      el('button', { class: 'btn primary', text: 'Analyse', onclick: () => analyse() }),
      el('label', { class: 'btn ghost file' }, ['Upload PDF or .txt', fileInput]),
      el('button', {
        class: 'btn ghost',
        text: 'Try a sample',
        onclick: () => {
          textarea.value = SAMPLE;
          analyse();
        },
      }),
      el('button', {
        class: 'btn ghost',
        text: 'Clear',
        onclick: () => {
          textarea.value = '';
          sourceText = '';
          analysis = null;
          cut = null;
          kind = null;
          status.hidden = true;
          reportSec.hidden = true;
          makeSec.hidden = true;
        },
      }),
    ]),
  );

  // ── 2. analysis ──────────────────────────────────────────────────────────
  function analyse() {
    // Normalise first. PDF extraction hands back Kangxi radicals that look
    // like ordinary characters but match nothing, so everything downstream
    // depends on repairing them before a single lookup happens.
    sourceText = normalizeText(textarea.value).trim();
    if (countHan(sourceText) < 30) {
      alert('Paste a bit more text \u2014 at least a paragraph or two of Chinese.');
      return;
    }
    textarea.value = sourceText;

    kind = classify(sourceText);
    cut = sectionize(sourceText);
    analysis = discover(sourceText);

    // Public law is quoted; anything else defaults to the safer path.
    mode = kind.contextId === 'statutes' ? 'verbatim' : 'hypothetical';

    picks = new Map();
    for (const c of analysis.candidates) {
      const g = glossTerm(c.term);
      picks.set(c.term, {
        pinyin: g.pinyin || c.pinyin,
        meaning: g.meaning,
        source: g.source,
        touched: false,
        userSet: false,
        tag: 'law',
        on: shouldPreselect(c, g.source),
      });
    }
    paintReport();
    fillTranslations();
    paintMake();
    reportSec.hidden = false;
    makeSec.hidden = false;
    reportSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Which candidates arrive already ticked.
  //
  // Repetition alone is not enough. 权人 repeats constantly and binds tightly,
  // but it is the tail of 抵押权人 and 质权人 rather than a word — and once
  // every row carries a plausible-looking English gloss, a pre-ticked fragment
  // is easy to save without noticing. A whole-word hit in either dictionary is
  // far better evidence that the span is real, so only those are preselected.
  // Terms that could only be composed from their parts still appear, ranked
  // where they were, waiting to be judged.
  function shouldPreselect(candidate, source) {
    if (source !== 'cedict' && source !== 'curated') return false;
    return candidate.route === 'statistical' && candidate.freq >= 2;
  }

  // The fallback glossary is a few megabytes, so the candidate list is painted
  // immediately from what is already in memory and improved when it lands.
  // Anything the user has already typed is left alone.
  async function fillTranslations() {
    if (glossaryReady()) return;
    const note = reportSec.querySelector('.gloss-status');
    if (note) {
      note.hidden = false;
      note.textContent = 'Looking up English for the rest…';
    }
    try {
      await loadGlossary();
    } catch {
      if (note) note.textContent = 'Could not load the translation glossary — meanings below are built from the parts where possible.';
      return;
    }
    if (!analysis) return;
    for (const c of analysis.candidates) {
      const p = picks.get(c.term);
      if (!p || p.touched) continue;
      const g = glossTerm(c.term);
      if (g.meaning) {
        p.meaning = g.meaning;
        p.pinyin = g.pinyin || p.pinyin;
        p.source = g.source;
      }
      if (!p.userSet) p.on = shouldPreselect(c, p.source);
    }
    paintReport();
  }

  function paintReport() {
    clear(reportSec);
    const s = analysis.stats;

    append(
      reportSec,
      el('h2', { text: '2 · What the app found' }),
      el('div', { class: 'stats' }, [
        stat(s.hanChars, 'Chinese characters'),
        stat(`${Math.round(s.coverage * 100)}%`, 'already in known words'),
        stat(s.knownTerms, 'known terms used'),
        stat(analysis.candidates.length, 'novel candidates'),
      ]),
      classBanner(),
    );

    // Known terms — evidence the lexicon is doing its job, and a quick way to
    // spot terms worth carding even though they aren't new.
    if (s.topKnown.length) {
      const known = el('details', { class: 'known-terms' });
      known.append(el('summary', { text: `Legal terms it already knows (${s.knownTerms})` }));
      const grid = el('div', { class: 'known-grid' });
      for (const k of s.topKnown) {
        grid.append(
          el('div', { class: 'known-item' }, [
            el('span', { class: 'kt-term', text: k.term }),
            el('span', { class: 'kt-n', text: `×${k.n}` }),
            el('span', { class: 'kt-meaning', text: k.meaning }),
          ]),
        );
      }
      known.append(grid);
      reportSec.append(known);
    }

    reportSec.append(
      el('h3', { class: 'sub', text: 'Novel terms — tick what’s worth learning' }),
      el('p', {
        class: 'panel-note',
        text:
          'Candidates are ranked by how word-like they look: how often they repeat, how tightly the characters bind, how freely the span moves between contexts, and how much of it the current lexicon failed to group. English is filled in automatically — treat it as a first draft and correct anything that reads wrong before saving.',
      }),
      el('p', { class: 'hint gloss-status', hidden: 'hidden' }),
    );

    const bulk = el('div', { class: 'row bulk' }, [
      el('button', {
        class: 'btn ghost small',
        text: 'Select all',
        onclick: () => {
          picks.forEach((v) => (v.on = true));
          paintCandidates();
        },
      }),
      el('button', {
        class: 'btn ghost small',
        text: 'Select none',
        onclick: () => {
          picks.forEach((v) => (v.on = false));
          paintCandidates();
        },
      }),
    ]);
    reportSec.append(bulk);

    const list = el('div', { class: 'cand-list' });
    reportSec.append(list);

    const saveRow = el('div', { class: 'row save-row' });
    reportSec.append(saveRow);

    function paintCandidates() {
      clear(list);
      if (!analysis.candidates.length) {
        list.append(
          el('p', { class: 'empty', text: 'No novel terms found — this text is already well covered.' }),
        );
      }
      for (const c of analysis.candidates) {
        const p = picks.get(c.term);
        const row = el('div', { class: `cand${p.on ? ' on' : ''}` });

        const check = el('input', {
          type: 'checkbox',
          checked: p.on,
          onchange: (e) => {
            p.on = e.target.checked;
            p.userSet = true;
            row.classList.toggle('on', p.on);
            paintSave();
          },
        });

        append(
          row,
          el('label', { class: 'cand-pick' }, [check]),
          el('div', { class: 'cand-main' }, [
            el('div', { class: 'cand-head' }, [
              el('span', { class: 'cand-term', text: c.term }),
              el('span', { class: 'cand-freq', text: `×${c.freq}` }),
              el('span', {
                class: `cand-route ${c.route}`,
                text: c.route === 'statistical' ? 'repeated + cohesive' : 'ungrouped span',
                title:
                  c.route === 'statistical'
                    ? `cohesion ${c.cohesion.toFixed(1)}, edge freedom ${c.freedom.toFixed(2)}`
                    : 'The lexicon could not group any of these characters into a word',
              }),
              p.source && p.source !== 'none' &&
                el('span', {
                  class: `cand-src ${p.touched ? 'edited' : p.source}`,
                  text: p.touched ? 'edited' : SOURCE_LABEL[p.source],
                }),
              p.pinyin.includes('?') &&
                el('span', { class: 'cand-warn', text: 'pinyin needs checking' }),
            ]),
            el('div', { class: 'cand-fields' }, [
              el('input', {
                class: 'cand-pinyin',
                value: p.pinyin,
                placeholder: 'pinyin',
                spellcheck: 'false',
                oninput: (e) => (p.pinyin = e.target.value),
              }),
              el('input', {
                class: `cand-meaning src-${p.source || 'none'}`,
                value: p.meaning,
                placeholder: 'English meaning',
                title: SOURCE_LABEL[p.source] || '',
                oninput: (e) => {
                  p.meaning = e.target.value;
                  p.touched = true;
                  p.userSet = true;
                  e.target.className = 'cand-meaning src-edited';
                  const chip = row.querySelector('.cand-src');
                  if (chip) {
                    chip.className = 'cand-src edited';
                    chip.textContent = 'edited';
                  }
                  // Typing a meaning is itself a vote to keep the term.
                  if (e.target.value && !p.on) {
                    p.on = true;
                    check.checked = true;
                    row.classList.add('on');
                  }
                  paintSave();
                },
              }),
              el(
                'select',
                {
                  class: 'cand-tag',
                  onchange: (e) => (p.tag = e.target.value),
                },
                ['law', 'biz', 'gen', 'func'].map((t) =>
                  el('option', { value: t, selected: p.tag === t, text: t }),
                ),
              ),
            ]),
            c.example && el('div', { class: 'cand-example', text: c.example }),
          ]),
        );
        list.append(row);
      }
      paintSave();
    }

    const selected = () => [...picks.entries()].filter(([, v]) => v.on);

    function paintSave() {
      const chosen = selected();
      const missing = chosen.filter(([, v]) => !v.meaning.trim()).length;
      clear(saveRow);
      append(
        saveRow,
        el('button', {
          class: 'btn primary',
          disabled: chosen.length === 0,
          text: `Add ${chosen.length} term${chosen.length === 1 ? '' : 's'} to the dictionary`,
          onclick: () => {
            // Recompute at click time — meanings may have been typed since.
            const chosen = selected();
            const missing = chosen.filter(([, v]) => !v.meaning.trim()).length;
            if (missing) {
              const ok = confirm(
                `${missing} of the ${chosen.length} selected terms have no meaning yet.\n\nAdd them anyway? You can fill the meanings in later under “Vocabulary you’ve added”.`,
              );
              if (!ok) return;
            }
            const added = userdict.addUserTerms(
              chosen.map(([term, v]) => ({ term, pinyin: v.pinyin, meaning: v.meaning, tag: v.tag })),
            );
            toast(`${added} new term${added === 1 ? '' : 's'} learned`);
            paintManage();
            paintMake();
            makeSec.hidden = false;
            makeSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        }),
        missing
          ? el('span', { class: 'hint', text: `${missing} selected without a meaning` })
          : null,
      );
    }

    paintCandidates();
  }

  // ── classification banner ────────────────────────────────────────────────
  function classBanner() {
    if (!kind || !kind.contextId) return null;
    const ctx = CONTEXTS.find((c) => c.id === kind.contextId);
    const line = el('div', { class: `class-banner ${kind.confident ? 'sure' : 'unsure'}` }, [
      el('span', { class: 'cb-icon', text: ctx ? ctx.icon : '?' }),
      el('div', {}, [
        el('div', { class: 'cb-head' }, [
          kind.confident ? 'This is a ' : 'This looks like a ',
          el('b', { text: TYPE_LABEL[kind.contextId] || kind.contextId }),
          kind.confident ? '' : ' — check before saving',
        ]),
        el('div', {
          class: 'cb-sub',
          text: cut && cut.meta.articles
            ? `${cut.meta.articles} articles across ${cut.meta.chapters.length} chapters, cut into ${cut.sections.length} readable sections.`
            : `Filed under ${ctx ? ctx.name : kind.contextId}.`,
        }),
      ]),
    ]);
    return line;
  }

  // ── 3. turn it into study material ───────────────────────────────────────
  function paintMake() {
    clear(makeSec);
    const chosenTerms = [...picks.entries()]
      .filter(([, v]) => v.on)
      .map(([term, v]) => ({ term, ...v }));

    const body = el('div', { class: 'make-body' });

    const tab = (id, label, sub) =>
      el('button', {
        class: `make-tab${mode === id ? ' on' : ''}`,
        onclick: () => {
          mode = id;
          paintMake();
        },
      }, [
        el('span', { class: 'mt-label', text: label }),
        el('span', { class: 'mt-sub', text: sub }),
      ]);

    append(
      makeSec,
      el('h2', { text: '3 · Turn it into study material' }),
      el('div', { class: 'make-tabs' }, [
        tab('verbatim', 'Use verbatim', 'Public law, or text you hold the rights to'),
        tab('hypothetical', 'Generate a hypothetical', "Anything belonging to a client or counterparty"),
      ]),
      body,
    );

    if (mode === 'verbatim') paintVerbatim(body);
    else paintGenerator(body, chosenTerms);
  }

  // ── verbatim: pick sections and save them as they stand ──────────────────
  function paintVerbatim(root) {
    if (!cut || !cut.sections.length) {
      root.append(el('p', { class: 'empty', text: 'Nothing to cut into sections — the document is too short.' }));
      return;
    }

    const m = cut.meta;
    const chosen = new Set();
    let attested = false;

    append(
      root,
      el('p', {
        class: 'panel-note',
        text:
          'The document is cut at its own seams — never mid-article — into sections of roughly 400 characters. Pick the ones you want; each becomes a study document you can read, gloss and make cards from, quoted exactly as written.',
      }),
      el('div', { class: 'stats' }, [
        stat(m.articles || m.units, m.articles ? 'articles' : 'passages'),
        stat(cut.sections.length, 'sections'),
        stat(Math.round(m.han / Math.max(cut.sections.length, 1)), 'chars each (avg)'),
        stat(m.translationLinesDropped, 'translation lines dropped'),
      ]),
    );

    if (m.translationLinesDropped > 20) {
      root.append(
        el('p', {
          class: 'hint',
          text: `This looks like a bilingual source. ${m.translationLinesDropped} English lines were removed so the sections are Chinese throughout — the translation would otherwise halve the Chinese in every one.`,
        }),
      );
    }

    // Source naming — the labels every saved section inherits.
    const fSourceZh = genField('出处 Source (Chinese)', el('input', {
      class: 'gen-in', value: m.sourceTitle || '', placeholder: '例：中华人民共和国民法典',
    }));
    const fSourceEn = genField('Source (English)', el('input', {
      class: 'gen-in', placeholder: 'e.g. PRC Civil Code, Book III',
    }));
    const fContext = genField('Context', selectEl(
      CONTEXTS.map((c) => c.id),
      kind?.contextId || 'statutes',
      CONTEXTS.map((c) => c.name),
    ));
    const fLevel = genField('Level', selectEl(['B1', 'B2', 'B2+', 'C1'], 'B2+'));
    root.append(el('div', { class: 'gen-fields' }, [fSourceZh, fSourceEn, fContext, fLevel]));

    // Chapter filter — 100+ sections is unusable as one flat list.
    const chapters = [...new Set(cut.sections.map((x) => x.chapter).filter(Boolean))];
    let chapterFilter = 'all';
    const filterRow = el('div', { class: 'row' });
    const list = el('div', { class: 'section-list' });
    const footer = el('div', { class: 'row save-row' });

    if (chapters.length > 1) {
      filterRow.append(
        el('label', { class: 'gen-field inline' }, [
          el('span', { text: 'Chapter' }),
          el('select', {
            class: 'gen-in',
            onchange: (e) => {
              chapterFilter = e.target.value;
              paintList();
            },
          }, [
            el('option', { value: 'all', text: `All chapters (${chapters.length})` }),
            ...chapters.map((c) => el('option', { value: c, text: c })),
          ]),
        ]),
      );
    }
    filterRow.append(
      el('button', {
        class: 'btn ghost small',
        text: 'Select visible',
        onclick: () => {
          visible().forEach((x) => chosen.add(x.i));
          paintList();
        },
      }),
      el('button', {
        class: 'btn ghost small',
        text: 'Clear selection',
        onclick: () => {
          chosen.clear();
          paintList();
        },
      }),
    );
    root.append(filterRow, list, footer);

    function visible() {
      return cut.sections
        .map((sec, i) => ({ sec, i }))
        .filter(({ sec }) => chapterFilter === 'all' || sec.chapter === chapterFilter);
    }

    function paintList() {
      clear(list);
      for (const { sec, i } of visible()) {
        const on = chosen.has(i);
        const row = el('label', { class: `sect${on ? ' on' : ''}` });
        append(
          row,
          el('input', {
            type: 'checkbox',
            checked: on,
            onchange: (e) => {
              if (e.target.checked) chosen.add(i);
              else chosen.delete(i);
              row.classList.toggle('on', e.target.checked);
              paintFooter();
            },
          }),
          el('div', { class: 'sect-main' }, [
            el('div', { class: 'sect-head' }, [
              el('span', { class: 'sect-title', text: sec.titleZh }),
              el('span', { class: 'sect-meta', text: `${sec.han} chars · ${sec.articleCount || sec.paragraphs.length} ${sec.articleCount ? 'articles' : 'paras'}` }),
            ]),
            el('div', { class: 'sect-preview', text: sec.paragraphs[0].slice(0, 110) }),
          ]),
        );
        list.append(row);
      }
      paintFooter();
    }

    function paintFooter() {
      clear(footer);
      const attest = el('label', { class: 'attest' }, [
        el('input', {
          type: 'checkbox',
          checked: attested,
          onchange: (e) => {
            attested = e.target.checked;
            paintFooter();
          },
        }),
        el('span', {
          text:
            'This is public law, or I hold the rights to reproduce it. It will be stored verbatim in this browser.',
        }),
      ]);
      append(
        footer,
        attest,
        el('button', {
          class: 'btn primary',
          disabled: !attested || chosen.size === 0,
          text: chosen.size
            ? `Add ${chosen.size} section${chosen.size === 1 ? '' : 's'} as study documents`
            : 'Select some sections',
          onclick: save,
        }),
      );
    }

    function save() {
      const zh = fSourceZh.querySelector('input').value.trim();
      const en = fSourceEn.querySelector('input').value.trim();
      const contextId = fContext.querySelector('select').value;
      const level = fLevel.querySelector('select').value;
      const ids = [...chosen].sort((a, b) => a - b);
      let first = null;

      for (const i of ids) {
        const sec = cut.sections[i];
        const arabic = arabicRange(sec.range);
        const doc = store.addUserDoc({
          contextId,
          level,
          titleZh: [zh && `《${zh}》`, sec.titleZh].filter(Boolean).join(''),
          title: [en || 'Imported source', arabic && `Arts. ${arabic}`].filter(Boolean).join(' — '),
          summary: `Verbatim extract　${sec.chapter || ''}　${sec.range || ''}`.trim(),
          meta: [
            zh ? ['出处', zh] : null,
            sec.book ? ['编', sec.book] : null,
            sec.chapter ? ['章', sec.chapter] : null,
            sec.range ? ['条文', sec.range] : null,
            ['性质', '原文引用（未改写）'],
          ].filter(Boolean),
          paragraphs: sec.paragraphs,
          verbatim: true,
        });
        if (!first) first = doc;
      }

      toast(`${ids.length} section${ids.length === 1 ? '' : 's'} added`);
      paintManage();
      if (first) navigate({ view: 'reader', docId: first.id });
    }

    paintList();
  }

  // ── 3. generate a hypothetical ───────────────────────────────────────────
  function paintGenerator(genSec, chosenTerms) {
    clear(genSec);
    const s = analysis.stats;
    const ctxId = s.docType || 'judgments';

    const prompt = buildPrompt({
      docType: ctxId,
      outline: s.outline,
      terms: chosenTerms.length ? chosenTerms : analysis.stats.topKnown.slice(0, 10),
    });

    const promptBox = el('textarea', { class: 'prompt-box', rows: '14', readonly: 'readonly' });
    promptBox.value = prompt;

    append(
      genSec,
      el('h2', { text: '3 · Build a hypothetical from it' }),
      el('p', {
        class: 'panel-note',
        text:
          'The app can’t write the document itself — it ships with no model and no network calls. What it does is assemble the brief: the vocabulary you just learned, the structural skeleton of the source, and the confidentiality rules. Run this prompt through whichever assistant you use, then paste the result back below and it becomes a study document like any other.',
      }),
      promptBox,
      el('div', { class: 'row' }, [
        el('button', {
          class: 'btn primary',
          text: 'Copy prompt',
          onclick: async () => {
            try {
              await navigator.clipboard.writeText(prompt);
              toast('Prompt copied');
            } catch {
              promptBox.select();
              toast('Select and copy manually');
            }
          },
        }),
      ]),
      el('h3', { class: 'sub', text: 'Paste the generated document' }),
    );

    const fTitleZh = field('中文标题', el('input', { class: 'gen-in', placeholder: '例：设备买卖合同纠纷一审民事判决书（节选）' }));
    const fTitleEn = field('English title', el('input', { class: 'gen-in', placeholder: 'Equipment sale dispute — first instance' }));
    const fSummary = field('One-line summary', el('input', { class: 'gen-in', placeholder: 'What the reader is looking at' }));
    const fLevel = field('Level', selectEl(['B1', 'B2', 'B2+', 'C1'], 'B2'));
    const fContext = field(
      'Context',
      selectEl(CONTEXTS.map((c) => c.id), ctxId, CONTEXTS.map((c) => c.name)),
    );
    const body = el('textarea', {
      class: 'source-input',
      rows: '10',
      placeholder: '把生成的文书粘贴到这里，一段一行。\n\nPaste the generated document, one paragraph per line.',
      spellcheck: 'false',
    });

    const verdict = el('div', { class: 'verdict', hidden: 'hidden' });

    append(
      genSec,
      el('div', { class: 'gen-fields' }, [fTitleZh, fTitleEn, fSummary, fLevel, fContext]),
      body,
      verdict,
      el('div', { class: 'row' }, [
        el('button', {
          class: 'btn primary',
          text: 'Check & save as a study document',
          onclick: () => checkAndSave(),
        }),
      ]),
    );

    function checkAndSave(force = false) {
      const paragraphs = body.value
        .split('\n')
        .map((p) => p.trim())
        .filter(Boolean);

      if (!paragraphs.length || countHan(paragraphs.join('')) < 30) {
        alert('Paste the generated document first.');
        return;
      }

      clear(verdict);
      verdict.hidden = false;
      const generated = paragraphs.join('');
      const problems = [];

      // (a) does it echo the source verbatim?
      const overlap = verbatimOverlap(sourceText, generated);
      const tooClose = overlap.maxRun >= 12 || overlap.ratio > 0.15;
      if (tooClose) {
        problems.push(
          el('div', { class: 'verdict-item bad' }, [
            el('b', { text: 'Too close to the source. ' }),
            `Longest identical run: ${overlap.maxRun} characters (${Math.round(overlap.ratio * 100)}% of the text overlaps).`,
            el('div', { class: 'verdict-quote', text: overlap.longest }),
            el('div', {
              class: 'hint',
              text: 'Regenerate with different facts and parties. The point is to reuse the language, not the document.',
            }),
          ]),
        );
      } else {
        verdict.append(
          el('div', { class: 'verdict-item good' }, [
            el('b', { text: 'No verbatim reuse. ' }),
            `Longest distinctive run shared with the source: ${overlap.maxRun} characters.`,
            overlap.formulaic
              ? el('div', {
                  class: 'hint',
                  text: `${overlap.formulaic} shared passages were stock legal phrasing (判决如下, 本院认为 and the like) and were not counted — reusing those is the point.`,
                })
              : null,
          ]),
        );
      }

      // (b) which of the terms you just learned actually made it in?
      const used = chosenTerms.filter((t) => generated.includes(t.term));
      verdict.append(
        el('div', { class: `verdict-item ${used.length ? 'good' : 'warn'}` }, [
          el('b', { text: `${used.length}/${chosenTerms.length} new terms used. ` }),
          used.length ? used.map((t) => t.term).join('、') : 'None of the harvested vocabulary appears.',
        ]),
      );

      // (c) can every character be glossed?
      const unglossed = new Set();
      for (const p of paragraphs) {
        for (const t of segment(p)) if (t.han && !t.entry) unglossed.add(t.text);
      }
      if (unglossed.size) {
        verdict.append(
          el('div', { class: 'verdict-item warn' }, [
            el('b', { text: `${unglossed.size} characters have no gloss yet: ` }),
            [...unglossed].join(' '),
            el('div', {
              class: 'hint',
              text: 'They’ll show in the reader without a tooltip. Add them under “Vocabulary you’ve added” if they matter.',
            }),
          ]),
        );
      }

      problems.forEach((p) => verdict.prepend(p));

      if (tooClose && !force) {
        verdict.append(
          el('div', { class: 'row' }, [
            el('button', {
              class: 'btn ghost danger',
              text: 'Save anyway',
              onclick: () => checkAndSave(true),
            }),
          ]),
        );
        return;
      }

      const doc = store.addUserDoc({
        contextId: fContext.querySelector('select').value,
        title: fTitleEn.querySelector('input').value.trim() || 'Generated hypothetical',
        titleZh: fTitleZh.querySelector('input').value.trim() || '生成的练习文书',
        level: fLevel.querySelector('select').value,
        summary: fSummary.querySelector('input').value.trim() || 'Generated from an imported source document.',
        meta: [['来源', '由上传文书提炼生成（虚构内容）']],
        paragraphs,
      });

      toast('Saved as a study document');
      paintManage();
      navigate({ view: 'reader', docId: doc.id });
    }
  }

  // ── 4. manage what's been added ──────────────────────────────────────────
  function paintManage() {
    clear(manageSec);
    const terms = userdict.getUserTerms();
    const entries = Object.entries(terms);
    const docs = store.getUserDocs();

    append(
      manageSec,
      el('h2', { text: 'Your additions' }),
      el('p', {
        class: 'panel-note',
        text: `The built-in dictionary has ${builtInCount()} entries. Yours are layered on top and take precedence — they change how every document in the app is segmented and glossed.`,
      }),
    );

    const termsBlock = el('details', { class: 'known-terms', open: entries.length ? 'open' : null });
    termsBlock.append(el('summary', { text: `Vocabulary you’ve added (${entries.length})` }));

    if (!entries.length) {
      termsBlock.append(el('p', { class: 'hint', text: 'Nothing yet — analyse a document above.' }));
    } else {
      const rows = el('div', { class: 'user-terms' });
      for (const [term, [pinyin, meaning, tag]] of entries) {
        rows.append(
          el('div', { class: 'user-term' }, [
            el('div', { class: 'ut-ruby' }, [ruby(term, pinyin)]),
            el('input', {
              class: 'ut-meaning',
              value: meaning,
              placeholder: 'meaning',
              onchange: (e) => {
                userdict.addUserTerms([{ term, pinyin, meaning: e.target.value, tag }]);
                toast('Saved');
              },
            }),
            el('span', { class: `tag tag-${tag}`, text: tag }),
            el('button', {
              class: 'icon-btn danger',
              text: '✕',
              title: 'Remove',
              onclick: () => {
                userdict.removeUserTerm(term);
                paintManage();
              },
            }),
          ]),
        );
      }
      termsBlock.append(
        rows,
        el('div', { class: 'row' }, [
          el('button', {
            class: 'btn ghost small',
            text: 'Export vocabulary (.json)',
            onclick: () => download('vocabulary.json', userdict.exportUserTerms()),
          }),
          el('label', { class: 'btn ghost small file' }, [
            'Import vocabulary',
            el('input', {
              type: 'file',
              accept: 'application/json',
              onchange: async (e) => {
                const f = e.target.files[0];
                if (!f) return;
                try {
                  userdict.importUserTerms(await f.text());
                  toast('Vocabulary imported');
                  paintManage();
                } catch (err) {
                  alert(`Import failed: ${err.message}`);
                }
              },
            }),
          ]),
        ]),
      );
    }
    manageSec.append(termsBlock);

    const docsBlock = el('details', { class: 'known-terms', open: docs.length ? 'open' : null });
    docsBlock.append(el('summary', { text: `Documents you’ve generated (${docs.length})` }));
    if (!docs.length) {
      docsBlock.append(el('p', { class: 'hint', text: 'Nothing yet.' }));
    } else {
      for (const d of docs) {
        docsBlock.append(
          el('div', { class: 'user-doc' }, [
            el('button', {
              class: 'linkish',
              text: d.titleZh,
              onclick: () => navigate({ view: 'reader', docId: d.id }),
            }),
            el('span', { class: 'hint', text: d.title }),
            el('button', {
              class: 'icon-btn danger',
              text: '✕',
              title: 'Delete',
              onclick: () => {
                if (confirm(`Delete “${d.titleZh}”? Cards made from it will keep their snippets but lose the link.`)) {
                  store.deleteUserDoc(d.id);
                  paintManage();
                }
              },
            }),
          ]),
        );
      }
    }
    manageSec.append(docsBlock);
  }

  paintManage();
}

// ── prompt construction ────────────────────────────────────────────────────

function buildPrompt({ docType, outline, terms }) {
  const label = TYPE_LABEL[docType] || 'legal document';
  const termLines = terms
    .map((t) => `  - ${t.term}${t.meaning ? ` — ${t.meaning}` : ''}`)
    .join('\n');

  return `Draft a HYPOTHETICAL Chinese ${label} of roughly 300–400 characters, in the register a practising PRC lawyer would actually use.

Rules — these matter:
- Invent every party, company, law firm, court, judge, address, date and case number. Mark any case number 虚构.
- Invent the facts. Do not paraphrase any real dispute closely enough to be identifiable.
- Do not reproduce wording from any specific real document. Statutes and institutions may be named generically (《中华人民共和国民法典》, 仲裁委员会), but cite their effect rather than quoting their text.
- Keep the formulaic scaffolding authentic — that is the thing being taught.

Work these terms in naturally, in context, more than once where it reads well:
${termLines}

${outline.length ? `Follow this structural skeleton (structure only — none of the source's wording):\n  ${outline.join(' → ')}\n` : ''}
Output only the finished document in Chinese. One paragraph per line, no blank lines, no pinyin, no translation, no commentary.`;
}

// ── small helpers ──────────────────────────────────────────────────────────

function stat(n, label) {
  return el('div', { class: 'stat' }, [el('b', { text: String(n) }), el('span', { text: label })]);
}

function field(label, input) {
  return el('label', { class: 'gen-field' }, [el('span', { text: label }), input]);
}

const genField = field;

/** '第四百六十三条-第四百六十八条' -> '463-468', for the English title. */
function arabicRange(range) {
  if (!range) return '';
  const nums = [...range.matchAll(/第([\u3007\u96f6\u4e00-\u9fff\d]+?)\u6761/g)]
    .map((m) => cnToArabic(m[1]))
    .filter((n) => n > 0);
  if (!nums.length) return '';
  return nums.length > 1 ? `${nums[0]}\u2013${nums[nums.length - 1]}` : String(nums[0]);
}

function selectEl(values, current, labels) {
  return el(
    'select',
    { class: 'gen-in' },
    values.map((v, i) =>
      el('option', { value: v, selected: v === current, text: labels ? labels[i] : v }),
    ),
  );
}

function countHan(s) {
  return (s.match(/[㐀-䶿一-鿿]/g) || []).length;
}

function download(name, text) {
  const blob = new Blob([text], { type: 'application/json' });
  const a = el('a', { href: URL.createObjectURL(blob), download: name });
  document.body.append(a);
  a.click();
  a.remove();
}

// A short invented judgment, so the pipeline can be tried without pasting
// anything real. Deliberately uses vocabulary the shipped dictionary lacks.
const SAMPLE = `原告：世通融资租赁有限公司。
被告：安平食品加工有限公司。
本院经审理查明：2023年9月5日，原告与被告签订《融资租赁合同》，约定采用售后回租方式，由原告受让被告名下生产线设备并回租予被告，租赁期限三十六个月，租金总额人民币八百六十万元。合同同时约定，被告以其持有的仓储用房提供抵押担保，并办理抵押登记。
2024年3月起，被告连续三期未按期支付租金。原告依约宣布租金加速到期，并主张行使抵押权。被告经催收后仍未清偿，原告遂诉至本院。
被告辩称，案涉设备存在权利瑕疵，且原告未按约定办理抵押登记手续，故其有权拒绝支付剩余租金。
本院认为：融资租赁合同的效力应就当事人的真实意思与合同目的综合判断。被告主张权利瑕疵，但未举证证明其已就此向原告提出异议，该抗辩不能成立。关于加速到期条款，系当事人意思自治的体现，不违反法律强制性规定，应认定有效。抵押登记虽有迟延，但不影响主债权的履行请求。
依照有关融资租赁合同及担保物权的法律规定，判决如下：一、被告安平食品加工有限公司于本判决生效之日起十日内向原告支付剩余租金及逾期利息；二、原告对案涉抵押财产折价或者拍卖、变卖所得价款享有优先受偿权；三、驳回原告的其他诉讼请求。`;
