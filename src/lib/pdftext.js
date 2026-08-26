// PDF text extraction, loaded on demand.
//
// pdf.js is 1.6 MB — far bigger than the rest of the app put together — so it
// is imported dynamically and only when someone actually opens a PDF. Nothing
// is fetched on startup.

let pdfjs = null;

async function load() {
  if (pdfjs) return pdfjs;
  pdfjs = await import('../../vendor/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    '../../vendor/pdf.worker.min.mjs',
    import.meta.url,
  ).href;
  return pdfjs;
}

/**
 * @param {ArrayBuffer} buffer
 * @param {(done:number,total:number)=>void} [onProgress]
 * @returns {Promise<string>} text with line breaks reconstructed from layout
 */
export async function extractPdfText(buffer, onProgress) {
  const { getDocument } = await load();
  const doc = await getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();

    // A PDF has no lines, only positioned glyph runs. Reconstruct line breaks
    // from vertical position: a jump in y means a new line.
    let out = '';
    let line = '';
    let lastY = null;
    for (const item of content.items) {
      if (typeof item.str !== 'string') continue;
      const y = item.transform[5];
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        out += line + '\n';
        line = '';
      }
      line += item.str;
      lastY = y;
    }
    out += line;
    pages.push(out);
    onProgress?.(i, doc.numPages);
  }

  return pages.join('\n');
}
