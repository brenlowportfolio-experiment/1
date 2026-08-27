# 法律中文 · Legal Chinese for Lawyers

A spaced-repetition trainer for lawyers who are already intermediate in
Mandarin and need the language of practice: the register you use to mark up an
agreement, chase a counterparty, or read a judgment.

The premise is that vocabulary sticks when it stays attached to the sentence it
came from. So you read a document, gloss anything you don't know, select the
phrase that's actually worth owning, and drill it — with a button on every
flashcard that puts the phrase back in the document it came from.

## Running it

Live at **https://brenlowportfolio-experiment.github.io/1/** (GitHub Pages,
served from the default branch — `.nojekyll` keeps Pages from preprocessing
the source).

To run it locally instead: no build step, no dependencies, but it needs a
static server because it uses ES modules — opening `index.html` directly from
the filesystem gives a blank page, as browsers block module loading over
`file://`.

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Everything is stored in your browser's `localStorage`. Nothing leaves the
machine; there's no account and no server. Use **Deck → Settings & data →
Export** for a backup.

## How it works

**Contexts** are registers of legal Chinese, each with its own conventions.
Four ship today, and the design assumes more:

| Context | 中文 | What it drills |
|---|---|---|
| Emails | 往来邮件 | Polite register, hedged disagreement, the fixed openings and closings of Chinese business letters |
| Contracts | 合同条款 | Operative language — 应当 / 不得 / 除非 / 但…除外, definitions, carve-outs |
| Judgments | 裁判文书 | The fixed architecture of a civil judgment and the connectives that carry its reasoning (遂、故、据此、综上) |
| Statutes | 法律法规 | Enacted text, quoted as written: 的-clauses as protases, 应当/不得/可以 as operators, 但是…除外 as the carve-out |

Emails, contracts and judgments are **hypothetical** — parties, firms, courts,
case numbers and facts invented, imitating the language and structure of real
PRC practice without reproducing any actual document. **Statutes are the
deliberate exception**, for the reasons set out under *Importing* below. See
[`docs/AUTHORING.md`](docs/AUTHORING.md) for the rules each kind follows.

**Reading.** Hover any word for its pinyin, meaning and register tag. The
documents themselves are unannotated — clean Chinese, as you'd meet it — so
the gloss appears only when you ask for it.

**Making cards.** Click a word, or drag across several words, to take a
selection. The popup pre-fills pinyin and a meaning; edit it and add it. Words
already in your deck get a green underline in the text, so a re-read shows you
what you've mined. Adding a word you already have attaches the new sentence to
the existing card as a second context rather than duplicating it.

A dragged selection is glossed **as a phrase**, not word by word:

| | |
|---|---|
| 不得向任何第三方披露 | may not disclose to any third party |
| 任何一方未能履行本协议项下的 | where either party fails to perform this Agreement under |
| 关于第八条陈述与保证 | regarding Article 8 representations and warranties |
| 除因不可抗力外 | other than by reason of force majeure |

Three things get it there. The span is split into the *fewest, longest* known
units by shortest path rather than greedily left to right, so whole terms stay
intact. Statutory references and numbers are pulled out whole — 第一百四十二条
is "Article 142", not "first hundred four twelve article". And a small set of
templates handles the function words that carry legal Chinese: 的 closing a
clause becomes "where …", 除…外 wraps rather than precedes, modals take a bare
infinitive, and 向 moves its object after the verb the way English wants.

It is still a gloss, not a translation, and long multi-clause selections
degrade — two to five words is where it earns its keep. The popup shows how it
split the phrase (`任何一方 · 未能 · 履行 · 本协议 · 项下`) so a wrong reading is
obvious immediately rather than after a week of reviews, and the field is
editable as always.

**Reviewing.** Due cards come up in random order, so you're testing recall
rather than sequence. The front shows the characters with **pinyin above
them**; reveal gives the meaning, and 语境 opens the sentence it came from with
the term highlighted — 打开全文 jumps to that exact spot in the document.

The **拼音** button above the card turns the pinyin off, so the characters
stand alone and you're testing whether you can read them rather than whether
you recognise a romanisation. With it off, the pinyin moves to the answer side
and appears on reveal, so you can still check the reading. The choice sticks
across cards and sessions, and matches the setting in Deck → Settings.

Scheduling is an SM-2 variant at day granularity: a new card you grade *Good*
returns tomorrow, then in three days, then at intervals multiplied by the
card's ease factor. *Again* resets the interval **and** requeues the card later
in the same session, so a word you blanked on gets tested twice before you
leave.

Keyboard: `space` reveals then grades *Good*; `1`–`4` grade directly; `c`
toggles context; `p` toggles pinyin.

## Importing a real document

Upload a PDF or `.txt`, or paste text. The app works out what the document is,
then offers one of two routes depending on the answer.

PDFs are read in the browser (pdf.js, vendored, loaded only when you actually
open one). Extracted text is repaired before anything else touches it, because
PDF extraction routinely returns characters that *look* right and aren't:
当事人 comes back as 当事⼈, built from Kangxi radicals rather than the ordinary
codepoints. The Civil Code PDF this was built against contained 5,168 of them.
Nothing downstream can match those — the dictionary misses, segmentation
shatters — so they are mapped back first. Scanned PDFs hold images rather than
text and would need OCR; the app says so rather than failing silently.

### Verbatim — statutes and text you hold the rights to

A statute is the case where paraphrasing defeats the purpose: you cannot
rewrite 第五百七十七条 and still be learning 第五百七十七条, because the exact
wording is what gets argued over. Enacted text also carries no copyright under
Article 5 of the PRC Copyright Law, and nothing in it is confidential. So it is
quoted as written.

Upload 民法典 Book III and the app reports: *statute, 526 articles across 34
chapters, cut into 107 readable sections*. It cuts at the document's own seams
— never mid-article — into pieces of roughly 400 characters, labels each with
its chapter and article range (`第一章 一般规定　第四百六十三条—第四百六十八条`,
`PRC Civil Code — Arts. 463–468`), and files them under **Statutes**. Pick the
sections you want; each becomes a study document like any other.

Saving requires ticking a confirmation that the text is public law or yours to
reproduce. That gate exists because verbatim copying is exactly what the other
route is built to prevent.

### Hypothetical — client and counterparty documents

**Import** takes a real judgment, contract or email and mines it for
vocabulary. Paste the text (or drop a `.txt`), and the app reports what it
already knows, then proposes the terms it doesn't.

Finding unknown words is the hard part: a compound the lexicon has never seen
doesn't announce itself, it just gets shattered into single characters. So
candidates are proposed and scored on four signals — how often the span
repeats, how tightly its characters bind (a PMI-style ratio against how often
each half occurs alone), how freely it moves between contexts, and how much of
it the segmenter failed to group. A span also qualifies structurally if it is
*exactly* a hole in the segmentation, bounded by known words or punctuation;
requiring the whole hole is what stops `平食品加` being proposed out of the
middle of a company name.

**English is filled in automatically.** Every candidate arrives with a draft
meaning from one of three sources, shown on the row so you know how much to
trust it:

| Source | What it means |
|---|---|
| from the legal dictionary | The curated entry in `dictionary.js`. Always preferred — "违约金 liquidated damages, penalty" beats CC-CEDICT's bare "penalty (fee)" |
| auto-translated | A whole-word hit in CC-CEDICT (~111k entries) |
| built from the parts | Composed: 融资租赁 → "financing + lease". Shown in italic, because it is a construction rather than a definition |

None of it is a translator, and it is not meant to be right — it is a first
draft to correct. Every field stays editable, and typing in one marks the row
*edited* so the automatic pass never overwrites your wording. In testing across
a statute and a judgment, no candidate was left blank.

The glossary is ~6.9 MB, so it is fetched only when a document is actually
imported, and the list paints immediately from what's already in memory and
improves when it lands. Rows are pre-ticked only when a dictionary knows the
whole word: repetition alone would pre-tick 权人, which is not a word but the
tail of 抵押权人 and 质权人, and a pre-ticked fragment carrying a plausible
gloss is easy to save without noticing.

Accepted terms go into a user dictionary layered over the built-in one — and
because the lexicon *is* the segmenter, teaching it 融资租赁 immediately changes
how every document in the app is chunked and glossed.

Then it helps you build a hypothetical that drills them. The app ships with no
model and makes no network calls, so it can't write the document itself; what
it does is assemble the brief — the vocabulary you just learned, the structural
skeleton it detected in the source, and the confidentiality rules — as a prompt
to run through whichever assistant you use. Paste the result back and it
becomes a study document like any other, with its own cards and reviews.

Two things happen on the way in:

- **The source text is never persisted.** It's analysed in memory and discarded
  when you leave. What survives is the derived vocabulary and the hypothetical
  you generated — not a client's document sitting in `localStorage`.
- **Paste-back is checked for verbatim reuse.** Anything sharing a long
  identical run with the source is flagged before it can be saved. Stock legal
  phrasing is excluded from that check — 判决如下 and 驳回原告的其他诉讼请求 are
  formulae every judgment shares, and reusing them is the entire point — by
  ignoring any passage the shipped hypotheticals already contain.

The upshot is that a real document contributes its *language* to your study
material without contributing its text.

## Layout

```
index.html            shell
styles.css
src/
  main.js             hash router
  lib/
    segment.js        forward maximum-matching segmenter
    lexicon.js        built-in dictionary + user additions, merged
    userdict.js       vocabulary you've taught it
    discover.js       novel-term discovery, verbatim-overlap guard
    normalize.js      repairs Kangxi radicals and other PDF-extraction damage
    translate.js      automatic English: curated -> CC-CEDICT -> composed
    sectionize.js     cuts a long statute into study-sized sections; classifier
    pdftext.js        PDF text extraction (loads pdf.js on demand)
    srs.js            SM-2 scheduling (pure functions)
    store.js          localStorage persistence, import/export
    dom.js            element helpers, pinyin-above-characters rendering
  views/
    library.js        browse contexts
    reader.js         read, hover, select, make cards
    review.js         flashcards
    deck.js           browse/edit cards, settings, data
    import.js         mine a real document, generate a hypothetical
  data/
    dictionary.js     ~1,170 entries — glosses AND word boundaries
    contexts/         one file per context + registry
vendor/               pdf.js and CC-CEDICT, checked in (see vendor/NOTICE.md)
tools/                build script for the CC-CEDICT glossary
docs/AUTHORING.md     adding contexts, documents and vocabulary
```

There's no Chinese NLP dependency: the glossary that explains a word is the
same table that decides where the word ends, so the reader can never show you a
token it can't define. The shipped corpus is at 100% gloss coverage.

## Extending it

Adding a context is a new file in `src/data/contexts/` plus one line in that
directory's `index.js` — the library, the deck filters and the per-document
card counts all pick it up. Adding vocabulary is a line in `dictionary.js`.
Both are covered in [`docs/AUTHORING.md`](docs/AUTHORING.md).

Natural next steps the current structure already anticipates: production cards
(English → Chinese) alongside the recognition cards, audio, a 汉字-component
view for characters that recur across legal compounds, and generating new
hypotheticals on demand from the prompt in the authoring doc.
