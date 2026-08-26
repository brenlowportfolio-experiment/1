# Adding contexts and documents

The corpus is plain data. Adding to it never requires touching the reader, the
scheduler or the UI.

## Adding a document to an existing context

Open `src/data/contexts/<context>.js` and push another object onto `docs`:

```js
{
  id: 'em-engagement-letter',        // unique across the whole app
  title: 'Engagement letter — scope and fees',
  titleZh: '委托代理协议（业务范围与收费）',
  level: 'B2',                       // B1 | B2 | B2+ | C1 — rough difficulty
  summary: 'One line in English on what the reader is looking at.',
  meta: [['发件人', '…'], ['日期', '…']],   // optional label/value rows
  paragraphs: [                      // one string per paragraph, no markup
    '第一条　委托事项',
    '…',
  ],
}
```

Only `paragraphs` matters for the reading experience — each string is segmented
independently, and card locations are stored as `(paragraph index, character
offset)`, so **editing an existing document's paragraphs will move the context
snippets on any cards already made from it.** Prefer appending new documents to
rewriting old ones.

## Adding a whole new context

Candidate contexts: 立法条文 (statutes), 尽调报告 (DD reports), 备忘录 (advice
memos), 庭审记录 (hearing transcripts), 监管问询 (regulator enquiries).

1. Copy `src/data/contexts/emails.js` to `src/data/contexts/memos.js`.
2. Change `id`, `name`, `nameZh`, `blurb`, `icon` and replace `docs`.
3. Register it in `src/data/contexts/index.js`:

```js
import memos from './memos.js';
export const CONTEXTS = [emails, contracts, judgments, memos];
```

The library page, the deck filter chips and the per-document card counts all
pick it up automatically.

## Extending the dictionary

`src/data/dictionary.js` does double duty: it supplies the hover glosses **and**
it decides where word boundaries fall, because the segmenter matches greedily
against its keys. A term that isn't in the dictionary gets split into single
characters.

So when you add a document, add its vocabulary too:

```js
'表决权委托': ['biǎo jué quán wěi tuō', 'voting rights proxy', 'law'],
```

Tags are `law` / `biz` / `gen` / `func` and only affect the tooltip's colour
chip and which parts are used to auto-fill a multi-word card's meaning.

To find what a new document left unglossed:

```js
// node --input-type=module
import { allDocs } from './src/data/contexts/index.js';
import { segment } from './src/lib/segment.js';
const missing = new Set();
for (const d of allDocs())
  for (const p of d.paragraphs)
    for (const t of segment(p)) if (t.han && !t.entry) missing.add(t.text);
console.log([...missing].join(' '));
```

The shipped corpus is at 100% coverage; keep it there.

Two layers matter here, and they behave differently:

- **`dictionary.js`** — reviewed, shipped, shared by everyone. Prefer adding
  *characters* generously and *compounds* deliberately: broad character
  coverage is what lets the importer assemble pinyin for terms it has never
  seen, while every compound you add is one the importer will no longer offer
  as a discovery.
- **The user dictionary** (`userdict.js`, in `localStorage`) — whatever the
  importer has been taught, layered on top and winning ties. Exportable as
  JSON from the Import page, so a curated vocabulary can be moved between
  machines or folded back into `dictionary.js` once it's worth shipping.

Note the tension when editing the shipped dictionary: the sample document on
the Import page is deliberately built around terms the dictionary *lacks*
(融资租赁, 售后回租, 加速到期, 权利瑕疵, 优先受偿权, 案涉). Adding those to
`dictionary.js` would leave the discovery demo with nothing to find. If you add
them, give the sample new vocabulary to expose.

## Generating new hypotheticals

Documents must be **hypothetical**: written in the register and structure of
real practice, never copied from a real email, contract or judgment. When
drafting new ones — by hand or with a model — hold to these rules:

- Invent every party, firm, court, judge, case number and address. Signal it:
  use obviously fictional names and mark case numbers `（虚构）`.
- Invent the facts. Do not paraphrase a specific real dispute closely enough
  that it could be identified.
- Statutes and institutions may be named generically (《中华人民共和国民法典》,
  仲裁委员会) because those are public law, but do not reproduce long passages
  of statutory text — cite the effect, not the wording.
- Keep the *language* authentic: the formulaic scaffolding is the thing being
  taught. 经审理查明 / 本院认为 / 综上 / 判决如下 in judgments; 除本协议另有约定外
  / 应当 / 不得 / 但…除外 in contracts; 顺颂商祺 / 此致 / 烦请 in correspondence.
- Target 150–400 characters per document. Long enough to show structure, short
  enough to mine in one sitting.
- Keep one grammatical or rhetorical focus per document so the reader meets a
  pattern several times rather than once.

A prompt that produces usable output:

> Draft a hypothetical PRC [context] of about 300 characters in the register a
> practising lawyer would actually use. Invent all parties and facts; mark any
> case number as 虚构. The document should exemplify [feature, e.g. 条件句 with
> 的-clauses, or the 抗辩/不予采纳 pattern]. Output only the document, split into
> paragraphs, with no translation or commentary.

Then run the coverage snippet above and add whatever vocabulary is missing.

## Verbatim contexts

`statutes` is the one context whose documents are *not* hypothetical, and the
exception is deliberate on two grounds. Enacted text carries no copyright under
Article 5 of the PRC Copyright Law and contains nothing confidential; and
paraphrasing it would destroy the thing being taught, since the exact wording of
第五百七十七条 is what gets argued over.

Mark such documents `verbatim: true`. The reader uses it to swap the
"hypothetical document" disclaimer for an accurate one — an important detail,
because a statute mislabelled as invented is worse than no label at all.

Do **not** set `verbatim: true` on a document merely to skip the plagiarism
guard. The guard is what keeps a client's contract out of the shipped corpus.

## Generating from a real document

The Import page automates the loop above: it mines a real judgment, contract or
email for vocabulary, then assembles this same prompt pre-filled with the terms
you accepted and the structural skeleton it detected in the source.

Two invariants hold there, and any change to `src/views/import.js` should keep
them:

1. **The source is never persisted.** It lives in a local variable for the
   session. Only the derived vocabulary and the generated hypothetical reach
   `localStorage`.
2. **Paste-back is checked against the source** by `verbatimOverlap()` in
   `src/lib/discover.js` before it can be saved. The check excludes any passage
   that also appears in the shipped corpus, on the basis that anything the
   built-in hypotheticals already say is stock phrasing rather than something
   unique to the user's document — so 判决如下 and 驳回原告的其他诉讼请求 don't
   read as copying, while invented party names and facts do.

If you add documents to the shipped corpus, you widen that boilerplate
whitelist. That's usually right, but don't paste real text into
`src/data/contexts/` to "improve" it — you would be teaching the plagiarism
guard to ignore the very thing it exists to catch.
