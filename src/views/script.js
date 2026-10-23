// Scripts: documents made of spoken turns rather than prose.
//
// A turn is a paragraph written `说话人：台词`. The prefix is kept in the stored
// text — so card offsets, deep links and sentence context all keep working
// exactly as they do for every other document — and is only *rendered*
// differently, as a speaker label rather than as words to gloss.
//
// Three ways to use a scene beyond reading it:
//
//   Play scene   — the whole exchange read aloud, each speaker in their own
//                  voice where the device has several, or their own pitch
//                  where it has one.
//
//   Practise as  — pick a role and that speaker's lines are hidden. Played
//                  through, the scene stops at each of your turns; you say the
//                  line, then reveal it and hear the model version straight
//                  after your own. That gap — producing it, then hearing it
//                  right — is what reading alone never trains.
//
//   Key moments  — the turns that decide the exchange (an objection, a
//                  concession, a witness pinned down) are hidden behind a
//                  brief: what just happened, what you need to achieve. Say
//                  what you would say, then compare. Any moment can become a
//                  review card, so the scene comes back on schedule.

import { el, clear } from '../lib/dom.js';
import { speak, stop as stopSpeech, mandarinVoices, available, explainSilence } from '../lib/speak.js';
import * as store from '../lib/store.js';
import { parseTurn, momentsOf } from '../lib/turns.js';
import { addMoment, momentKey } from './saycard.js';
import { toast } from './reader.js';

// Distinct enough to tell apart on a single voice, close enough to stay natural.
const PITCHES = [1.0, 0.82, 1.18, 0.92, 1.1, 0.88];

// The mode value for key-moment practice. Speaker names are Chinese, so a
// leading @ can never collide with one.
const MOMENTS = '@moments';

// A mode chosen in one scene carries into the next, so a whole story can be
// practised as 张律师, or by its key moments, without re-choosing each time.
let lastRole = '';

/** "Zhang Xiaoyun — partner at Hengda…" → "Zhang Xiaoyun", for a short menu. */
function shortName(en = '') {
  return en.split(/\s+—\s+|,/)[0].trim();
}

/** The label shown in place of the 说话人： prefix. */
export function speakerLabel(turn, onPlay) {
  return el('span', { class: 'speaker', title: turn.en }, [
    el('b', { text: turn.speaker }),
    el('button', {
      class: 'turn-play',
      type: 'button',
      title: `Hear this line`,
      'aria-label': `Hear ${turn.speaker}'s line`,
      text: '▶',
      onclick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        onPlay();
      },
      onmousedown: (e) => e.stopPropagation(),
    }),
    el('span', { class: 'reveal-hint', text: 'Your line — tap to reveal' }),
  ]);
}

/**
 * Mount the scene bar and wire the player, role practice and key moments to
 * the rendered body. Returns a teardown.
 */
export function mountScript({ doc, bar, body }) {
  const speakers = doc.speakers || {};
  const turns = doc.paragraphs
    .map((text, p) => ({ p, text, ...parseTurn(text, speakers) }))
    .filter((t) => t.speaker);
  const moments = momentsOf(doc);

  // Speakers in order of first appearance — that order decides voices and
  // pitches, so the first voice to speak always gets the best voice.
  const cast = [...new Set(turns.map((t) => t.speaker))];

  const valid = (r) => (r === MOMENTS ? moments.size > 0 : cast.includes(r));
  let role = valid(lastRole) ? lastRole : '';
  let playing = false;
  let index = 0;
  let waiting = null;
  let gapTimer = null;

  const rate = () => store.getSettings().speechRate || 0.85;
  const paraOf = (p) => body.querySelector(`.para[data-p="${p}"]`);
  const lineOf = (t) => t.text.slice(t.prefixEnd);
  const inDeck = (p) => !!store.findMomentCard(momentKey(doc.id, p));

  /** Is this a turn the learner speaks, in the current mode? */
  const isMine = (t) => (role === MOMENTS ? moments.has(t.p) : !!role && t.speaker === role);

  function voiceFor(speaker) {
    const voices = mandarinVoices();
    const i = cast.indexOf(speaker);
    return {
      voice: voices.length ? voices[i % voices.length] : undefined,
      // With several voices, speakers already differ; keep pitch near natural.
      pitch: voices.length > 1 ? 1 + (PITCHES[i % PITCHES.length] - 1) * 0.4 : PITCHES[i % PITCHES.length],
    };
  }

  // ── key moments on the page ─────────────────────────────────────────────
  // Each moment turn carries its brief (shown while the line is hidden), its
  // English (shown once you've tried it) and a button to make it a card.
  function decorateMoments() {
    for (const [p, m] of moments) {
      const para = paraOf(p);
      if (!para) continue;
      para.classList.add('has-moment');
      para.append(
        el('div', { class: 'moment-cue' }, [
          el('span', { class: 'moment-tag', text: 'What would you say?' }),
          el('span', { class: 'moment-cue-text', text: m.cue }),
          el('span', { class: 'moment-tap', text: 'Say it, then tap to compare' }),
        ]),
        el('div', { class: 'moment-en', text: m.en }),
      );
      para.querySelector('.speaker')?.append(
        el('button', {
          class: 'moment-add',
          type: 'button',
          onmousedown: (e) => e.stopPropagation(),
          onclick: (e) => {
            e.preventDefault();
            e.stopPropagation();
            const { created } = addMoment(doc, m);
            toast(created ? 'Added to review as a “what would you say?” card' : 'Already in your deck');
            paintAdd(p);
            paintBar();
          },
        }),
      );
      paintAdd(p);
    }
  }

  function paintAdd(p) {
    const btn = paraOf(p)?.querySelector('.moment-add');
    if (!btn) return;
    const has = inDeck(p);
    btn.classList.toggle('added', has);
    btn.textContent = has ? '✓ card' : '＋ card';
    btn.title = has
      ? 'This moment is in your review deck'
      : 'Add this moment to review: you’ll be given the situation and have to say the line';
  }

  function addAll() {
    let n = 0;
    for (const m of moments.values()) if (addMoment(doc, m).created) n++;
    for (const p of moments.keys()) paintAdd(p);
    toast(n ? `Added ${n} card${n === 1 ? '' : 's'} to review` : 'This scene’s moments are already in your deck');
    paintBar();
  }

  // ── hiding and revealing ────────────────────────────────────────────────
  function applyRole() {
    for (const t of turns) {
      const para = paraOf(t.p);
      if (!para) continue;
      const mine = isMine(t);
      para.classList.toggle('mine', mine);
      para.classList.toggle('masked', mine);
      para.classList.remove('moment-open');
    }
    paintBar();
  }

  function reveal(p) {
    const para = paraOf(p);
    if (!para) return;
    // A moment you've just attempted gets its English too, to check the sense.
    if (para.classList.contains('masked') && moments.has(p)) para.classList.add('moment-open');
    para.classList.remove('masked');
  }

  // ── playback ────────────────────────────────────────────────────────────
  function setCurrent(p) {
    body.querySelectorAll('.para.current').forEach((n) => n.classList.remove('current'));
    if (p == null) return;
    const para = paraOf(p);
    para?.classList.add('current');
    para?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function sayTurn(t, then) {
    const { voice, pitch } = voiceFor(t.speaker);
    speak(lineOf(t), {
      rate: rate(),
      voice,
      pitch,
      onend: then,
      onfail: (reason) => {
        halt();
        explainSilence(reason);
      },
    });
  }

  function step() {
    if (!playing) return;
    if (index >= turns.length) return halt();
    const t = turns[index];
    setCurrent(t.p);

    // Your turn — unless you've already revealed it while reading ahead.
    if (isMine(t) && paraOf(t.p)?.classList.contains('masked')) {
      waiting = t;
      paintBar();
      return;
    }

    sayTurn(t, () => {
      if (!playing) return;
      index += 1;
      clearTimeout(gapTimer);
      gapTimer = setTimeout(step, 380); // a breath between speakers
    });
  }

  function play() {
    if (!available()) return explainSilence('no-engine');
    playing = true;
    // Resume from the turn on screen, or from the top after a finished run.
    if (index >= turns.length) index = 0;
    paintBar();
    step();
  }

  function halt() {
    playing = false;
    waiting = null;
    clearTimeout(gapTimer);
    stopSpeech();
    setCurrent(null);
    paintBar();
  }

  function restart() {
    halt();
    index = 0;
    if (role) applyRole();
    play();
  }

  /** After your turn: reveal the line, hear the model, carry on. */
  function afterMyTurn({ hear }) {
    const t = waiting;
    if (!t) return;
    waiting = null;
    reveal(t.p);
    paintBar();
    const next = () => {
      if (!playing) return;
      index += 1;
      clearTimeout(gapTimer);
      gapTimer = setTimeout(step, 380);
    };
    if (hear) sayTurn(t, next);
    else next();
  }

  /** ▶ on a single turn: just that line, outside any running scene. */
  function playOne(p) {
    const t = turns.find((x) => x.p === p);
    if (!t) return;
    if (playing) halt();
    reveal(p); // asking to hear your own hidden line is asking to see it
    setCurrent(p);
    sayTurn(t, () => setCurrent(null));
  }

  // ── the bar ─────────────────────────────────────────────────────────────
  function paintBar() {
    clear(bar);
    // On a phone the bar only pins itself to the screen while a scene runs —
    // otherwise it would sit over half the script you are trying to read.
    bar.classList.toggle('live', playing);

    const playBtn = el('button', {
      class: `btn ${playing ? 'ghost' : 'primary'} small scene-play`,
      type: 'button',
      text: playing ? '■ Stop' : index > 0 && index < turns.length ? '▶ Resume scene' : '▶ Play scene',
      onclick: () => (playing ? halt() : play()),
    });

    const roleSel = el(
      'select',
      {
        class: 'scene-role',
        'aria-label': 'What to practise',
        onchange: (e) => {
          role = e.target.value;
          lastRole = role;
          halt();
          index = 0;
          applyRole();
        },
      },
      [
        el('option', { value: '', text: 'Nothing — just listen', selected: !role }),
        moments.size > 0 &&
          el('option', {
            value: MOMENTS,
            text: `Key moments — what would you say? (${moments.size})`,
            selected: role === MOMENTS,
          }),
        ...cast.map((name) =>
          el('option', {
            value: name,
            text: `As ${name} — ${shortName(speakers[name]?.en)}`,
            selected: role === name,
          }),
        ),
      ],
    );

    const pending = [...moments.keys()].filter((p) => !inDeck(p)).length;

    const row = el('div', { class: 'scene-row' }, [
      playBtn,
      (index > 0 || playing) && el('button', {
        class: 'btn ghost small',
        type: 'button',
        text: '↺ From the top',
        onclick: restart,
      }),
      el('label', { class: 'scene-role-wrap' }, [el('span', { text: 'Practise' }), roleSel]),
      role &&
        el('button', {
          class: 'btn ghost small',
          type: 'button',
          text: role === MOMENTS ? 'Show all answers' : 'Show my lines',
          onclick: () => turns.filter(isMine).forEach((t) => reveal(t.p)),
        }),
      role === MOMENTS &&
        el('button', {
          class: 'btn ghost small scene-add-all',
          type: 'button',
          disabled: pending ? null : 'disabled',
          text: pending
            ? `＋ Add ${pending === moments.size ? 'all ' : ''}${pending} to review`
            : '✓ All in review',
          title: 'Each moment becomes a card: the situation on the front, the line on the back',
          onclick: addAll,
        }),
    ]);

    bar.append(row);

    if (waiting) {
      const m = moments.get(waiting.p);
      bar.append(
        el('div', { class: `your-turn${m ? ' is-moment' : ''}`, role: 'status' }, [
          el('div', { class: 'yt-text' }, [
            el('b', {
              text: m ? `What would you say? — as ${waiting.speaker}` : `Your line, as ${waiting.speaker}.`,
            }),
            m ? el('span', { class: 'yt-cue', text: m.cue }) : ' Say it aloud, then check it.',
          ]),
          el('div', { class: 'yt-actions' }, [
            el('button', {
              class: 'btn primary small',
              type: 'button',
              text: 'Reveal & hear it',
              onclick: () => afterMyTurn({ hear: true }),
            }),
            el('button', {
              class: 'btn ghost small',
              type: 'button',
              text: 'Reveal & carry on',
              onclick: () => afterMyTurn({ hear: false }),
            }),
          ]),
        ]),
      );
    } else {
      bar.append(
        el('p', {
          class: 'hint scene-hint',
          text:
            role === MOMENTS
              ? `The ${moments.size} turns that decide this exchange are hidden behind a brief. Read it, say what you would say, then tap to compare — or play the scene and it stops at each one. ＋ card puts a moment into review.`
              : role
                ? `${role}’s lines are hidden. Play the scene: it stops at each of your turns so you can say the line, then reveal it and hear it said properly.`
                : 'Play the whole exchange aloud, or choose what to practise: the key moments, or one speaker’s whole part. ▶ beside any speaker plays just that line.',
        }),
      );
    }
  }

  // Clicking a hidden line reveals it — the reader routes that here.
  body.addEventListener('script:reveal', (e) => reveal(e.detail.p));
  body.addEventListener('script:play', (e) => playOne(e.detail.p));

  decorateMoments();
  applyRole();

  return () => halt();
}
