// Every prompt the app sends. The voice block comes first and is marked for
// caching: it is identical across every call in a session, so repeated
// drafts only pay full price for the job specific part.

const BANNED = [
  'I am excited to',
  "I'm thrilled",
  'passionate about',
  'leverage',
  'spearheaded',
  'synergy',
  'dynamic',
  'fast-paced',
  'proven track record',
  'results-driven',
  'delve',
  'testament to',
  'tapestry',
  'navigate the complexities',
  'in today’s',
  'I believe I would be a great fit',
  'unique blend',
];

function esc(s) {
  return String(s || '').replace(/</g, '‹');
}

export function voiceBlock(samples, notes) {
  const usable = samples.filter((s) => s.text.trim());
  const body = usable
    .map(
      (s, i) =>
        `<sample index="${i + 1}" title="${esc(s.title || 'Untitled')}">\n${esc(s.text.trim())}\n</sample>`,
    )
    .join('\n\n');
  return [
    'You write job application material as one specific person, in their own voice. You are not writing about them and you are not a careers coach polishing their prose. The reader should not be able to tell that anyone but this person wrote it.',
    '',
    'Below are samples of their real writing. Before writing anything, study them for:',
    '- vocabulary: which words they reach for, which register, how often they use jargon',
    '- sentence rhythm: typical length, how much it varies, how sentences open',
    '- structure: how they open and close a piece, paragraph length, use of lists',
    '- punctuation habits: dashes, semicolons, parentheses, contractions',
    '- stance: how direct they are, how they hedge, whether they use humour',
    'Match all of it. Where the samples and the conventions of a cover letter disagree, follow the samples.',
    '',
    `<writing_samples>\n${body || '(none provided yet: write plainly and concretely)'}\n</writing_samples>`,
    notes?.trim() ? `\n<voice_notes>\n${esc(notes.trim())}\n</voice_notes>` : '',
    '',
    'Standing rules for everything you write as this person:',
    '- Use only facts present in the experience chunks you are given. Never invent employers, titles, dates, numbers or outcomes. If a requirement has no supporting chunk, do not claim it.',
    `- Avoid the stock phrasing of generated application text, including: ${BANNED.map((b) => `"${b}"`).join(', ')}. Avoid any phrase you would expect to find in a hundred other applications.`,
    '- Do not use em dashes unless the samples do.',
    '- Do not copy the job description’s phrasing wholesale. Borrow at most a few of its key terms, where they fit naturally.',
    '- Chunks are raw material, not paragraphs to paste. Rewrite them, merge them, cut what does not serve the question, and supply the connective reasoning that makes one point lead to the next.',
  ].join('\n');
}

function chunkXML(chunks) {
  return chunks
    .map(
      (c) =>
        `<chunk id="${c.id}" kind="${c.kind}" tags="${esc(c.tags.join(', '))}" title="${esc(c.title)}">\n${esc(c.text)}\n</chunk>`,
    )
    .join('\n');
}

// Analysis: JD versus chunk library. Structured output so the UI can render
// the result without parsing prose.

export const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['role_summary', 'angle', 'requirements', 'sequence', 'gaps'],
  properties: {
    role_summary: { type: 'string' },
    angle: { type: 'string' },
    requirements: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['requirement', 'priority', 'chunk_ids'],
        properties: {
          requirement: { type: 'string' },
          priority: { type: 'string', enum: ['must', 'nice'] },
          chunk_ids: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    sequence: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['chunk_id', 'purpose'],
        properties: {
          chunk_id: { type: 'string' },
          purpose: { type: 'string' },
        },
      },
    },
    gaps: { type: 'array', items: { type: 'string' } },
  },
};

export function analysisPrompt(app, chunks) {
  return [
    `<job_description company="${esc(app.company)}" role="${esc(app.role)}">\n${esc(app.jd)}\n</job_description>`,
    '',
    `<experience_chunks>\n${chunkXML(chunks)}\n</experience_chunks>`,
    '',
    'Match this person’s chunks to the job.',
    '- role_summary: two sentences on what the employer actually needs, read between the lines of the posting.',
    '- angle: one sentence on the single through line that connects this person to the role. This becomes the spine of everything written for this application.',
    '- requirements: the 4 to 8 requirements that matter most, each marked must or nice, with the ids of chunks that give real evidence for it (empty if none).',
    '- sequence: the chunks to use, in the order that tells the strongest story for this role, typically 3 to 6. Usually an introduction or value chunk first, then evidence in descending relevance, then a closing if one fits. purpose says in a few words what that chunk does in the story.',
    '- gaps: requirements with weak or no evidence, phrased so the person knows what chunk to write.',
    'Use only chunk ids that appear above.',
  ].join('\n');
}

// Drafting an answer to one question.

export function draftPrompt({ app, question, chunks, others, instruction, previous }) {
  const unit = question.unit === 'chars' ? 'characters' : 'words';
  const target = Number(question.limit) || 250;
  const low = Math.round(target * 0.85);
  const parts = [
    `<job company="${esc(app.company)}" role="${esc(app.role)}">`,
    app.analysis
      ? `What they need: ${esc(app.analysis.role_summary)}\nThrough line for this application: ${esc(app.analysis.angle)}`
      : `<job_description>\n${esc(app.jd)}\n</job_description>`,
    '</job>',
    '',
    `<chunks_in_order>\n${chunkXML(chunks)}\n</chunks_in_order>`,
  ];
  if (others.length) {
    parts.push(
      '',
      '<already_written_for_this_application>',
      ...others.map((o) => `<answer question="${esc(o.prompt)}">\n${esc(o.answer)}\n</answer>`),
      '</already_written_for_this_application>',
      'These answers go to the same reader. Do not reuse their opening, their lead example, or their distinctive phrases. Where the same experience must appear again, come at it from a different side and keep it brief.',
    );
  }
  if (previous && instruction) {
    parts.push('', `<previous_draft>\n${esc(previous)}\n</previous_draft>`);
  }
  parts.push(
    '',
    `<question>${esc(question.prompt)}</question>`,
    `Length: between ${low} and ${target} ${unit}. Never exceed ${target}. Count before you finish.`,
    'Draw on the chunks in the order given unless the question calls for a different emphasis; lead with whatever answers the question most directly. Drop chunks that do not help this particular question.',
  );
  if (question.note?.trim()) parts.push(`Extra direction from the person: ${esc(question.note.trim())}`);
  if (instruction) parts.push(`Revise the previous draft: ${esc(instruction)}`);
  parts.push('Return only the answer text. No title, no preamble, no sign off unless the question is a letter.');
  return parts.join('\n');
}

// Splitting pasted history into chunks.

export const SPLIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['chunks'],
  properties: {
    chunks: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['kind', 'title', 'text', 'tags'],
        properties: {
          kind: { type: 'string', enum: ['experience', 'value', 'intro', 'closing'] },
          title: { type: 'string' },
          text: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
};

export function splitPrompt(source, tags) {
  return [
    `<source>\n${esc(source)}\n</source>`,
    '',
    `<existing_tags>${tags.map(esc).join(' | ')}</existing_tags>`,
    '',
    'Break this professional history into self contained chunks, one achievement, story or claim per chunk, so each can be reused on its own in different applications.',
    '- kind: experience (a specific thing they did, with context and result), value (a claim about what they bring), intro (how they describe who they are), closing.',
    '- title: 3 to 8 words a person would recognise at a glance, e.g. "Rebuilt pricing model at Acme".',
    '- text: 40 to 120 words, written in the first person, keeping every concrete fact, number and name from the source and adding none. Keep the person’s own wording where the source has it.',
    '- tags: 1 to 3 themes. Prefer existing tags; add a new one only if none fits.',
  ].join('\n');
}

// Distilling voice notes from the samples.

export function voiceNotesPrompt() {
  return 'From the writing samples only, write 6 to 10 short bullet points describing how this person writes: concrete, checkable habits (sentence length, openings, punctuation, words they favour or never use, tone). No praise, no generic advice. Plain text bullets starting with "- ".';
}
