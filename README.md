# Talk to Your PDF: Plain-English Setup Guide

This project lets someone open a PDF in a web page, ask questions about it, and get answers that point back to the page where the answer came from.

The sample app uses a bid package PDF, but the same idea can work for your own PDF.

## The Moving Parts

There are four main pieces:

1. `build_rag_corpus.py`
   This reads a PDF, splits the text into page-labeled chunks, builds a simple search index, and writes `rag_corpus.json`. That file is what the chat page searches before asking the AI to answer.

2. `spec-chat/index.html`
   This is the web page people use. It shows the PDF on one side and the chat on the other. When an answer cites a page, the PDF jumps to that page.

3. `functions/api/chat.js`
   This is the server-side AI helper. The browser sends it the question and the best matching PDF passage. It calls the AI model from the server, so your API key is not exposed in the browser.

4. Cloudflare Pages
   This hosts the web page, PDF, search files, and server-side AI helper on a public URL.

## How It Works

When someone asks a question, the app searches `rag_corpus.json` for the best matching PDF pages. It sends the question plus the most relevant page text to the AI. The AI answers using that page text, and the app shows a page citation. If you click the page button, the PDF viewer jumps to that page.

This keeps the answer grounded in the document instead of asking the AI to guess from memory.

## Set Up Your Own PDF

These steps assume you have this project folder on your computer.

### 1. Install Python

Install Python 3 if you do not already have it.

Then open a terminal in the project folder and run:

```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

If this project does not have a `requirements.txt` file, install PyMuPDF directly:

```sh
pip install pymupdf
```

### 2. Build The Search File For Your PDF

Put your PDF somewhere easy to find. Then run:

```sh
python3 build_rag_corpus.py their.pdf
```

Replace `their.pdf` with the real filename of your PDF.

This creates:

```text
rag_corpus.json
rag_corpus.js
```

Copy those files into the chat app folder, along with your PDF:

```sh
cp rag_corpus.json spec-chat/
cp rag_corpus.js spec-chat/
cp their.pdf spec-chat/
```

If you rename the PDF, update the `PDF_URL` line near the top of `spec-chat/index.html` so it matches your PDF filename.

### 3. Keep The AI API Key Server-Side

Do not put your AI API key in `index.html` or any browser file. Browser files are public.

Set the key as a Cloudflare Pages secret instead:

```sh
npx wrangler pages secret put OPENROUTER_API_KEY --project-name spec-chat-standalone
```

Paste the key when Wrangler asks for it.

### 4. Deploy The Standalone Chat App

Make a standalone folder:

```sh
rm -rf spec-chat-standalone
cp -R spec-chat spec-chat-standalone
cp -R functions spec-chat-standalone/functions
```

Deploy it:

```sh
npx wrangler pages deploy spec-chat-standalone --project-name spec-chat-standalone --branch main
```

Wrangler will print a public URL. It will look similar to:

```text
https://spec-chat-standalone.pages.dev
```

## Troubleshooting

Blank PDF:
The app uses PDF.js to draw the PDF into the page. Make sure the PDF file is in the same folder as `index.html`, the filename matches `PDF_URL`, and `vendor/pdfjs/pdf.min.js` plus `vendor/pdfjs/pdf.worker.min.js` are present.

Chat says it is running offline:
The search file loaded, but the server-side AI key may not be set. Add the Cloudflare secret for `OPENROUTER_API_KEY`, then redeploy.

Deploy gives a 404:
Make sure you deployed the folder that contains `index.html` at its top level. For the standalone app, deploy `spec-chat-standalone`, not the whole dashboard folder.

Answers cite the wrong pages:
Rebuild `rag_corpus.json` from the exact PDF you are showing in the viewer, then copy the new `rag_corpus.json` and `rag_corpus.js` into the deployed folder.

PDF text cannot be found:
Some PDFs are scanned images without selectable text. In that case, run OCR on the PDF first, then build the corpus again.
