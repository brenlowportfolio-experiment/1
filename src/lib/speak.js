// Pronunciation, through the browser's own speech synthesis.
//
// No audio files ship with the app and nothing is fetched: the voice belongs to
// the device. That makes it free, offline and instant — and also means quality
// and availability depend on what the device has installed. iPhone, iPad and
// Mac carry a good Mandarin voice out of the box; Android and Chrome generally
// do; Windows may need its Chinese language pack. Where no Mandarin voice
// exists the speaker buttons simply don't appear.
//
// It speaks the *characters*, never the pinyin string. A Mandarin voice reads
// 陈述与保证 with the right tones and the right tone sandhi — 你好 comes out as
// ní hǎo, not nǐ hǎo — whereas handing it "chén shù yǔ bǎo zhèng" would get the
// romanisation read aloud as if it were English.

const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;

let voices = [];
const listeners = new Set();

function refresh() {
  voices = synth ? synth.getVoices() || [] : [];
  // One class on <html> shows or hides every speaker button at once. Buttons
  // are created and thrown away on every hover, so giving each its own
  // subscription would leak a listener per word looked at.
  document.documentElement.classList.toggle('no-speech', !available());
  listeners.forEach((fn) => fn(available()));
}

refresh();
if (synth) {
  // Chrome populates voices asynchronously; the first getVoices() is often
  // empty and the list only arrives with this event.
  synth.addEventListener?.('voiceschanged', refresh);
}

/** Subscribe to voice availability, which can change after page load. */
export function onVoicesChanged(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * The best Mandarin voice on this device, or null. Mainland voices first,
 * then on-device over network voices (they start faster and work offline),
 * then voices known to be good.
 */
export function pickVoice() {
  const zh = voices.filter((v) => /^zh|^cmn/i.test(v.lang));
  if (!zh.length) return null;
  const score = (v) =>
    (/zh[-_]CN|cmn/i.test(v.lang) ? 100 : /zh[-_]TW|zh[-_]HK/i.test(v.lang) ? 0 : 50) +
    (v.localService ? 20 : 0) +
    (/Tingting|Ting-Ting|Huihui|Yaoyao|Xiaoxiao|Yunxi|普通话|Mandarin/i.test(v.name) ? 10 : 0) +
    (/Cantonese|粤|Sin-ji|Hong Kong/i.test(v.name) ? -200 : 0);
  return zh.slice().sort((a, b) => score(b) - score(a))[0];
}

export function available() {
  return !!(synth && pickVoice());
}

export function voiceName() {
  const v = pickVoice();
  return v ? `${v.name} (${v.lang})` : null;
}

let current = null;

/**
 * Say a Chinese word or phrase.
 * @param {string} text   characters — not pinyin
 * @param {{rate?: number, onend?: Function}} opts
 */
export function speak(text, { rate = 0.85, onend } = {}) {
  if (!synth || !text) return false;
  const voice = pickVoice();
  if (!voice) return false;

  // A second click should restart, not queue behind the first.
  synth.cancel();

  // Strip punctuation and stray Latin so the voice doesn't pause on "：" or
  // try to pronounce a clause number.
  const clean = text.replace(/[^一-鿿㐀-䶿]/g, '');
  if (!clean) return false;

  const u = new SpeechSynthesisUtterance(clean);
  u.voice = voice;
  u.lang = voice.lang;
  u.rate = rate;
  u.onend = () => {
    if (current === u) current = null;
    onend?.();
  };
  u.onerror = u.onend;
  current = u;
  synth.speak(u);
  return true;
}

export function stop() {
  synth?.cancel();
  current = null;
}

/**
 * A small speaker button. Hidden, not merely disabled, on devices without a
 * Mandarin voice (via html.no-speech) — a button that does nothing is worse
 * than no button.
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
    const ok = speak(getText(), {
      rate: typeof rate === 'function' ? rate() : rate,
      onend: () => btn.classList.remove('playing'),
    });
    if (!ok) btn.classList.remove('playing');
  });
  return btn;
}
