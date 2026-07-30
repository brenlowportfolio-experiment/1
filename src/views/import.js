// Import — mine a real document for vocabulary, then build a fresh
// hypothetical that exercises it.
//
// The uploaded text is analysed in memory and deliberately never persisted:
// what survives the session is the derived vocabulary and whatever hypothetical
// you generate from it, not the source. That keeps a real client document from
// turning into study material.

import { el, clear, append, ruby } from '../lib/dom.js';
import { discover, verbatimOverlap, guessPinyin } from '../lib/discover.js';
import { segment } from '../lib/segment.js';
import { lexicon, builtInCount } from '../lib/lexicon.js';
import * as userdict from '../lib/userdict.js';
import * as store from '../lib/store.js';
import { CONTEXTS } from '../data/contexts/index.js';
import { toast } from './reader.js';

const TYPE_LABEL = {
  judgments: '民事判决书 / civil judgment',
  contracts: '合同 / contract',
  emails: '往来邮件 / professional correspondence',
};

export function render(root, { navigate }) {
  clear(root);

  let sourceText = '';
  let analysis = null;
  let picks = new Map(); // term -> {pinyin, meaning, tag, on}

  root.append(
    el('header', { class: 'page-head' }, [
      el('h1', { text: 'Import & generate' }),
      el('p', {
        class: 'lede',
        text:
          'Feed the app a real judgment, contract or email. It finds the vocabulary it doesn’t yet know, learns it, then helps you build a hypothetical that drills those terms.',
      }),
    ]),
  );

  const sourceSec = el('section', { class: 'panel' });
  const reportSec = el('section', { class: 'panel', hidden: 'hidden' });
  const genSec = el('section', { class: 'panel', hidden: 'hidden' });
  const manageSec = el('section', { class: 'panel' });
  root.append(sourceSec, reportSec, genSec, manageSec);

  // ── 1. source ────────────────────────────────────────────────────────────
  const textarea = el('textarea', {
    class: 'source-input',
    rows: '10',
    placeholder:
      '把判决书、合同或邮件正文粘贴到这里…\n\nPaste the Chinese text of a judgment, contract or email here (or drop a .txt file).',
    spellcheck: 'false',
  });

  const fileInput = el('input', {
    type: 'file',
    accept: '.txt,.md,.csv,text/plain',
    onchange: async (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const text = await f.text();
      if (/\u0000/.test(text) || countHan(text) < 20) {
        alert(
          'That file doesn’t look like readable Chinese text.\n\nPDF and Word files need to be opened in their own application first — copy the text and paste it in.',
        );
        return;
      }
      textarea.value = text;
      analyse();
    },
  });

  textarea.addEventListener('dragover', (e) => {
    e.preventDefault();
    textarea.classList.add('dropping');
  });
  textarea.addEventListener('dragleave', () => textarea.classList.remove('dropping'));
  textarea.addEventListener('drop', async (e) => {
    e.preventDefault();
    textarea.classList.remove('dropping');
    const f = e.dataTransfer.files[0];
    if (!f) return;
    textarea.value = await f.text();
    analyse();
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
    el('div', { class: 'row' }, [
      el('button', { class: 'btn primary', text: 'Analyse', onclick: () => analyse() }),
      el('label', { class: 'btn ghost file' }, ['Upload .txt', fileInput]),
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
          reportSec.hidden = true;
          genSec.hidden = true;
        },
      }),
    ]),
  );

  // ── 2. analysis ──────────────────────────────────────────────────────────
  function analyse() {
    sourceText = textarea.value.trim();
    if (countHan(sourceText) < 30) {
      alert('Paste a bit more text — at least a paragraph or two of Chinese.');
      return;
    }
    analysis = discover(sourceText);
    picks = new Map();
    for (const c of analysis.candidates) {
      picks.set(c.term, {
        pinyin: c.pinyin,
        meaning: '',
        tag: 'law',
        on: c.route === 'statistical' && c.freq >= 2,
      });
    }
    paintReport();
    reportSec.hidden = false;
    genSec.hidden = true;
    reportSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      s.docType &&
        el('p', { class: 'panel-note' }, [
          'Reads like a ',
          el('b', { text: TYPE_LABEL[s.docType] || s.docType }),
          s.outline.length
            ? `. Structural markers, in order: ${s.outline.join(' → ')}`
            : '',
        ]),
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
          'Candidates are ranked by how word-like they look: how often they repeat, how tightly the characters bind, how freely the span moves between contexts, and how much of it the current lexicon failed to group. Add a meaning before saving — that’s the bit no algorithm here can do for you.',
      }),
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
              !c.pinyinComplete &&
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
                class: 'cand-meaning',
                value: p.meaning,
                placeholder: 'English meaning',
                oninput: (e) => {
                  p.meaning = e.target.value;
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
            paintGenerator(chosen.map(([term, v]) => ({ term, ...v })));
            genSec.hidden = false;
            genSec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          },
        }),
        missing
          ? el('span', { class: 'hint', text: `${missing} selected without a meaning` })
          : null,
      );
    }

    paintCandidates();
  }

  // ── 3. generate a hypothetical ───────────────────────────────────────────
  function paintGenerator(chosenTerms) {
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
