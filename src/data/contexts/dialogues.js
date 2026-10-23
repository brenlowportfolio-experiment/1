// Context: scenes — legal Chinese as it is spoken under pressure.
//
// Everything else in the corpus is a document: something written, revised,
// filed. This context is talk — a client meeting, a negotiation, a mediation,
// a witness under questioning, a dismissal, an appeal — because that is where
// a lawyer's Chinese is tested in real time, and because conflict is
// memorable in a way a clause is not.
//
// The scenes come in stories, each in its own file under ../scenes/. A story
// runs across contexts: its scenes live here, and it ends in (or passes
// through) documents filed elsewhere — a judgment, an email, a contract —
// whose facts the scenes are written to agree with.
//
// Each paragraph is one turn, written `说话人：台词`. The prefix must match a key
// in the scene's `speakers` for the reader to render it as a speaker; a
// paragraph wrapped in full-width brackets （…） is a stage direction.
// `moments` marks the turns worth producing yourself — see docs/AUTHORING.md.

import * as hongtu from '../scenes/hongtu.js';
import * as jinyang from '../scenes/jinyang.js';
import * as yuanjian from '../scenes/yuanjian.js';

const SOURCES = [hongtu, jinyang, yuanjian];

export const STORIES = SOURCES.map((s) => s.story);

export default {
  id: 'dialogues',
  name: 'Scenes',
  nameZh: '情景对话',
  blurb:
    'Legal Chinese spoken under pressure, told as continuing stories: negotiations, a mediation, hearings, a dismissal. Play a scene aloud, take a role and speak your own lines, or stop at the key moments and say what you would say.',
  icon: '❝',
  docs: SOURCES.flatMap((s) => s.docs),
};
