# Vendored dependencies

## pdf.js

`pdf.min.mjs` and `pdf.worker.min.mjs` are from [pdfjs-dist][] v6.2.108,
Apache-2.0 licensed, copyright Mozilla Foundation.

They are checked in rather than installed because the app has no build step and
no package manager — GitHub Pages serves this directory as-is. They are also
*not* loaded on startup: `src/lib/pdftext.js` imports them dynamically, so the
1.6 MB only crosses the wire when someone actually opens a PDF.

To update: `npm pack pdfjs-dist`, then copy `build/pdf.min.mjs` and
`build/pdf.worker.min.mjs` here. If the worker filename changes, update
`workerSrc` in `src/lib/pdftext.js` to match.

[pdfjs-dist]: https://www.npmjs.com/package/pdfjs-dist
