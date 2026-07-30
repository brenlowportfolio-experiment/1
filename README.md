# 法律中文 · Legal Chinese for Lawyers

A spaced-repetition trainer for lawyers who are already intermediate in
Mandarin and need the language of practice: the register you use to mark up an
agreement, chase a counterparty, or read a judgment.

The premise is that vocabulary sticks when it stays attached to the sentence it
came from. So you read a document, gloss anything you don't know, select the
phrase that's actually worth owning, and drill it — with a button on every
flashcard that puts the phrase back in the document it came from.

## Running it

No build step, no dependencies. It needs a static server only because it uses
ES modules:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Everything is stored in your browser's `localStorage`. Nothing leaves the
machine; there's no account and no server. Use **Deck → Settings & data →
Export** for a backup.

## How it works

**Contexts** are registers of legal Chinese, each with its own conventions.
Three ship today, and the design assumes more:

| Context | 中文 | What it drills |
|---|---|---|
| Emails | 往来邮件 | Polite register, hedged disagreement, the fixed openings and closings of Chinese business letters |
| Contracts | 合同条款 | Operative language — 应当 / 不得 / 除非 / 但…除外, definitions, carve-outs |
| Judgments | 裁判文书 | The fixed architecture of a civil judgment and the connectives that carry its reasoning (遂、故、据此、综上) |

Every document is **hypothetical**. Parties, firms, courts, case numbers and
facts are invented; the documents imitate the language and structure of real
PRC practice without reproducing any actual email, contract or judgment. See
[`docs/AUTHORING.md`](docs/AUTHORING.md) for the rules new documents follow.

**Reading.** Hover any word for its pinyin, meaning and register tag. The
documents themselves are unannotated — clean Chinese, as you'd meet it — so
the gloss appears only when you ask for it.

**Making cards.** Click a word, or drag across several words, to take a
selection. The popup pre-fills pinyin and a meaning; edit it and add it. Words
already in your deck get a green underline in the text, so a re-read shows you
what you've mined. Adding a word you already have attaches the new sentence to
the existing card as a second context rather than duplicating it.

**Reviewing.** Due cards come up in random order, so you're testing recall
rather than sequence. The front shows the characters with **pinyin above
them**; reveal gives the meaning, and 语境 opens the sentence it came from with
the term highlighted — 打开全文 jumps to that exact spot in the document.

Scheduling is an SM-2 variant at day granularity: a new card you grade *Good*
returns tomorrow, then in three days, then at intervals multiplied by the
card's ease factor. *Again* resets the interval **and** requeues the card later
in the same session, so a word you blanked on gets tested twice before you
leave.

Keyboard: `space` reveals then grades *Good*; `1`–`4` grade directly; `c`
toggles context.

## Importing a real document

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

Pinyin is assembled automatically from the character dictionary, so in practice
you supply meanings and nothing else. Accepted terms go into a user dictionary
layered over the built-in one — and because the lexicon *is* the segmenter,
teaching it 融资租赁 immediately changes how every document in the app is
chunked and glossed.

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
    dictionary.js     ~1,150 entries — glosses AND word boundaries
    contexts/         one file per context + registry
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
