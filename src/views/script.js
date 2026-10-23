// Scripts: documents made of spoken turns rather than prose.
//
// A turn is a paragraph written `说话人：台词`. The prefix is kept in the stored
// text — so card offsets, deep links and sentence context all keep working
// exactly as they do for every other document — and is only *rendered*
// differently, as a speaker label rather than as words to gloss.
//
// Two ways to use a scene beyond reading it:
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

import { el, clear } from '../lib/dom.js';
import { speak, stop as stopSpeech, mandarinVoices, available, explainSilence } from '../lib/speak.js';
import * as store from '../lib/store.js';

const SIDE_LABEL = { claimant: 'Claimant side', respondent: 'Respondent side', neutral: 'Neutral' };

// Distinct enough to tell apart on a single voice, close enough to stay natural.
const PITCHES = [1.0, 0.82, 1.18, 0.92, 1.1, 0.88];

// A role chosen in one scene carries into the next, so a whole story can be
// practised as 张律师 without re-choosing at every scene.
let lastRole = '';

/**
 * @returns {{speaker?, side?, en?, prefixEnd?, stage?}} for one paragraph
 */
export function parseTurn(text, speakers) {
  const m = text.match(/^([^：:（(\s]{1,8})[：:]/);
  if (m && speakers[m[1]]) {
    const sp = speakers[m[1]];
    return { speaker: m[1], side: sp.side || 'neutral', en: sp.en || '', prefixEnd: m[0].length };
  }
  if (/^（.*）$/.test(text.trim())) return { stage: true };
  return {};
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
 * Mount the scene bar and wire the player and role practice to the rendered
 * body. Returns a teardown.
 */
export function mountScript({ doc, bar, body }) {
  const speakers = doc.speakers || {};
  const turns = doc.paragraphs
    .map((text, p) => ({ p, text, ...parseTurn(text, speakers) }))
    .filter((t) => t.speaker);

  // Speakers in order of first appearance — that order decides voices and
  // pitches, so the first voice to speak always gets the best voice.
  const cast = [...new Set(turns.map((t) => t.speaker))];

  let role = cast.includes(lastRole) ? lastRole : '';
  let playing = false;
  let index = 0;
  let waiting = null;
  let gapTimer = null;

  const rate = () => store.getSettings().speechRate || 0.85;
  const paraOf = (p) => body.querySelector(`.para[data-p="${p}"]`);
  const lineOf = (t) => t.text.slice(t.prefixEnd);

  function voiceFor(speaker) {
    const voices = mandarinVoices();
    const i = cast.indexOf(speaker);
    return {
      voice: voices.length ? voices[i % voices.length] : undefined,
      // With several voices, speakers already differ; keep pitch near natural.
      pitch: voices.length > 1 ? 1 + (PITCHES[i % PITCHES.length] - 1) * 0.4 : PITCHES[i % PITCHES.length],
    };
  }

  // ── role practice ────────────────────────────────────────────────────────
  function applyRole() {
    for (const t of turns) {
      const para = paraOf(t.p);
      if (!para) continue;
      const mine = role && t.speaker === role;
      para.classList.toggle('mine', !!mine);
      para.classList.toggle('masked', !!mine);
    }
    paintBar();
  }

  function reveal(p) {
    paraOf(p)?.classList.remove('masked');
  }

  // ── playback ─────────────────────────────────────────────────────────────
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

    if (role && t.speaker === role) {
      // Your turn: stop and wait. Nothing is spoken until you've had a go.
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

  // ── the bar ──────────────────────────────────────────────────────────────
  function paintBar() {
    clear(bar);

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
        'aria-label': 'Practise a role',
        onchange: (e) => {
          role = e.target.value;
          lastRole = role;
          halt();
          index = 0;
          applyRole();
        },
      },
      [
        el('option', { value: '', text: 'Nobody — just listen', selected: !role }),
        ...cast.map((name) =>
          el('option', {
            value: name,
            text: `${name} — ${(speakers[name]?.en || '').split('—')[0].trim()}`,
            selected: role === name,
          }),
        ),
      ],
    );

    const row = el('div', { class: 'scene-row' }, [
      playBtn,
      (index > 0 || playing) && el('button', {
        class: 'btn ghost small',
        type: 'button',
        text: '↺ From the top',
        onclick: restart,
      }),
      el('label', { class: 'scene-role-wrap' }, [el('span', { text: 'Practise as' }), roleSel]),
      role &&
        el('button', {
          class: 'btn ghost small',
          type: 'button',
          text: 'Show my lines',
          onclick: () => turns.filter((t) => t.speaker === role).forEach((t) => reveal(t.p)),
        }),
    ]);

    bar.append(row);

    if (waiting) {
      bar.append(
        el('div', { class: 'your-turn', role: 'status' }, [
          el('div', { class: 'yt-text' }, [
            el('b', { text: `Your line, as ${waiting.speaker}.` }),
            ' Say it aloud, then check it.',
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
          text: role
            ? `${role}’s lines are hidden. Play the scene: it stops at each of your turns so you can say the line, then reveal it and hear it said properly.`
            : 'Play the whole exchange aloud, or choose a role to speak one side yourself. ▶ beside any speaker plays just that line.',
        }),
      );
    }
  }

  // Clicking a hidden line reveals it — the reader routes that here.
  body.addEventListener('script:reveal', (e) => reveal(e.detail.p));
  body.addEventListener('script:play', (e) => playOne(e.detail.p));

  applyRole();

  return () => halt();
}

export function sideClass(side) {
  return `side-${side || 'neutral'}`;
}

export { SIDE_LABEL };
