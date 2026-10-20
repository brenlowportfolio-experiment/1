// Pronunciation, through the browser's own speech synthesis.
//
// No audio files ship with the app and nothing is fetched: the voice belongs to
// the device. That makes it free, offline and instant — and also means quality
// and availability depend on what the device has installed. iPhone, iPad and
// Mac carry a good Mandarin voice out of the box; Android and Chrome generally
// do; Windows may need its Chinese language pack.
//
// It speaks the *characters*, never the pinyin string. A Mandarin voice reads
// 陈述与保证 with the right tones and the right tone sandhi — 你好 comes out as
// ní hǎo, not nǐ hǎo — whereas handing it "chén shù yǔ bǎo zhèng" would get the
// romanisation read aloud as if it were English.
//
// An earlier version hid the speaker unless the browser *listed* a Mandarin
// voice by name, and refused to speak otherwise. That was wrong on both
// counts: Safari frequently never announces its voice list at all, and phone
// browsers often list only some of what they can speak — yet told the language
// is zh-CN they find a Mandarin voice anyway. The result was a missing button
// on devices that could speak perfectly well. Now the button shows wherever the
// browser has a speech engine, and it tries; if nothing comes out, it says why.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

let voices = [];
const listeners = new Set();

function refresh() {
  voices = synth ? synth.getVoices() || [] : [];
  // Only a browser with no speech engine at all hides the buttons. One class
  // on <html> does it for every button, since tooltip buttons are rebuilt on
  // each hover and per-button listeners would leak.
  document.documentElement.classList.toggle('no-speech', !synth);
  listeners.forEach((fn) => fn(status()));
}

refresh();
if (synth) {
  // Chrome fills the list late and announces it with this event...
  synth.addEventListener?.('voiceschanged', refresh);
  // ...Safari often never announces it. Look again a few times regardless.
  [300, 1000, 2500, 6000].forEach((ms) => setTimeout(refresh, ms));
}

/** Subscribe to voice changes, which can land well after page load. */
export function onVoicesChanged(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * The best Mandarin voice the browser lists, or null. Mainland voices first,
 * then on-device over network voices (they start faster and work offline),
 * then voices known to be good. Cantonese is ruled out — it would read the
 * characters correctly in the wrong language.
 */
export function pickVoice() {
  const zh = voices.filter((v) => /^zh|^cmn/i.test(v.lang));
  if (!zh.length) return null;
  const score = (v) =>
    (/zh[-_]CN|cmn/i.test(v.lang) ? 100 : /zh[-_]TW/i.test(v.lang) ? 30 : /zh[-_]HK/i.test(v.lang) ? -100 : 50) +
    (v.localService ? 20 : 0) +
    (/Tingting|Ting-Ting|Huihui|Yaoyao|Xiaoxiao|Yunxi|Lili|Meijia|普通话|Mandarin/i.test(v.name) ? 10 : 0) +
    (/Cantonese|粤|Sin-ji|Sinji|Hong Kong/i.test(v.name) ? -200 : 0);
  const best = zh.slice().sort((a, b) => score(b) - score(a))[0];
  return score(best) > -100 ? best : null;
}

/** Does the browser have a speech engine at all? (Controls whether buttons show.) */
export function available() {
  return !!synth;
}

/** Has the browser told us about a Mandarin voice by name? */
export function hasListedVoice() {
  return !!pickVoice();
}

export function voiceName() {
  const v = pickVoice();
  return v ? `${v.name} (${v.lang})` : null;
}

export function status() {
  if (!synth) return { engine: false, voice: null };
  return { engine: true, voice: voiceName() };
}

let current = null;

/**
 * Say a Chinese word or phrase.
 *
 * @param {string} text   characters — not pinyin
 * @param {{rate?: number, onend?: Function, onfail?: Function}} opts
 *   onfail(reason) is called if the browser refuses or nothing starts.
 */
export function speak(text, { rate = 0.85, onend, onfail } = {}) {
  if (!synth) {
    onfail?.('no-engine');
    return false;
  }

  // Strip punctuation and stray Latin so the voice doesn't pause on "：" or
  // try to pronounce a clause number.
  const clean = String(text || '').replace(/[^一-鿿㐀-䶿]/g, '');
  if (!clean) return false;

  // A second click should restart, not queue behind the first.
  synth.cancel();

  // Safari can leave the engine paused after a tab has been in the background,
  // and then every utterance queues silently. Resume is harmless if not paused.
  try {
    synth.resume();
  } catch {}

  const u = new SpeechSynthesisUtterance(clean);
  const voice = pickVoice();
  if (voice) {
    u.voice = voice;
    u.lang = voice.lang;
  } else {
    // No voice listed by name — still ask for Mandarin by language and let the
    // browser choose. On phones and Safari this usually just works.
    u.lang = 'zh-CN';
  }
  u.rate = rate;

  let started = false;
  let settled = false;
  const finish = (failed, reason) => {
    if (settled) return;
    settled = true;
    if (current === u) current = null;
    if (failed) onfail?.(reason);
    onend?.();
  };

  u.onstart = () => {
    started = true;
  };
  u.onend = () => finish(false);
  u.onerror = (e) => {
    // 'interrupted' / 'canceled' just mean another click took over.
    const reason = e && e.error;
    finish(reason !== 'interrupted' && reason !== 'canceled', reason || 'error');
  };

  current = u;
  synth.speak(u);

  // Some engines neither start nor error when they have no suitable voice —
  // they just sit there. When we had no named voice to give it, treat a long
  // silence as a failure so the user learns *why* rather than hearing nothing.
  // (Not when a voice was named: Chrome's online voices can be slow to start,
  // and cutting one off would turn a working button into an error.)
  if (!voice) {
    setTimeout(() => {
      if (!started && current === u) {
        synth.cancel();
        finish(true, 'timeout');
      }
    }, 3000);
  }

  return true;
}

export function stop() {
  synth?.cancel();
  current = null;
}

// ── user-facing help when nothing can be heard ─────────────────────────────

function platformHelp() {
  const ua = navigator.userAgent || '';
  if (/Windows/i.test(ua)) {
    return 'On Windows: Settings → Time & language → Language & region → Add a language → Chinese (Simplified, China), tick “Text-to-speech”, then reload this page.';
  }
  if (/Android/i.test(ua)) {
    return 'On Android: Settings → System → Languages → Text-to-speech output → Google speech engine → Install voice data → Chinese (Mandarin).';
  }
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return 'On iPhone/iPad: check the ring/silent switch and volume. Voices live under Settings → Accessibility → Spoken Content → Voices → Chinese.';
  }
  if (/Macintosh/i.test(ua)) {
    return 'On a Mac: check the volume. Voices live under System Settings → Accessibility → Spoken Content → System voice → Manage Voices → Chinese (China).';
  }
  return 'Your device needs a Mandarin text-to-speech voice installed.';
}

let notice = null;
let noticeTimer = null;

/**
 * A short explanation in the page itself. Uses the app's toast element so it
 * looks like everything else, but is self-contained — speak.js is imported by
 * views, so it cannot import the reader's toast without a cycle.
 */
export function explainSilence(reason) {
  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'speech-notice';
    notice.setAttribute('role', 'status');
    document.body.append(notice);
  }
  const head =
    reason === 'no-engine'
      ? 'This browser has no speech engine, so it can’t play pronunciation.'
      : 'Couldn’t play that — this device doesn’t seem to have a Mandarin voice.';
  notice.textContent = '';
  const b = document.createElement('b');
  b.textContent = head + ' ';
  notice.append(b, document.createTextNode(platformHelp()));
  notice.classList.add('show');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => notice.classList.remove('show'), 9000);
  notice.onclick = () => notice.classList.remove('show');
}

/**
 * A small speaker button. Shown wherever the browser has a speech engine;
 * on click it tries, and explains if nothing could be played.
 */
export function speakerButton(getText, { el, rate, label = 'Play pronunciation' } = {}) {
  const btn = el('button', {
    class: 'speak-btn',
    type: 'button',
    title: label,
    'aria-label': label,
    text: '🔊',
  });
  // The reader treats mousedown on the page as the start of a selection drag;
  // a click on the speaker must not count as one.
  btn.addEventListener('mousedown', (e) => e.stopPropagation());
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    btn.classList.add('playing');
    speak(getText(), {
      rate: typeof rate === 'function' ? rate() : rate,
      onend: () => btn.classList.remove('playing'),
      onfail: (reason) => {
        btn.classList.remove('playing');
        explainSilence(reason);
      },
    });
  });
  return btn;
}
