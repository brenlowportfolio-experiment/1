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

## Layout

```
index.html            shell
styles.css
src/
  main.js             hash router
  lib/
    segment.js        forward maximum-matching segmenter
    srs.js            SM-2 scheduling (pure functions)
    store.js          localStorage persistence, import/export
    dom.js            element helpers, pinyin-above-characters rendering
  views/
    library.js        browse contexts
    reader.js         read, hover, select, make cards
    review.js         flashcards
    deck.js           browse/edit cards, settings, data
  data/
    dictionary.js     820 entries — glosses AND word boundaries
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
