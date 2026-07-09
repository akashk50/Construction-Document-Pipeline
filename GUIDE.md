# Plain-English Guide: Talk to Your PDF

## 1. What is this thing?

This is a small website where you open a PDF, such as a bid package, project spec, or plan document, and then chat with it like you are texting a coworker who has already read the whole thing. You ask a normal question in plain English, and the chat gives you an answer with a page number so you can check the original PDF yourself.

## 2. Why would I want it?

Construction PDFs are long, dense, and full of details that matter. This tool helps an owner, estimator, project manager, or client get to those details faster without digging through 30 pages. You can ask things like:

- "What color is the fence coating?"
- "What is the warranty?"
- "What are the bid submission requirements?"

It does not replace reading the document carefully before you bid or sign anything, but it points you to the right page much faster.

## 3. How does it actually work (the plain version)?

### Reading the PDF

The helper script, `build_rag_corpus.py`, reads the PDF and pulls out the text page by page. It saves that text into `rag_corpus.json`, a searchable file the website can load. Each chunk is basically one page of text with its page number attached.

### Finding the right part (this is RAG)

When you ask a question, the website searches those chunks and ranks the best matches. The ranking method is called BM25. In plain English, BM25 is a smart search ranking system that decides which pages are most related to your words.

This is part of a common AI pattern called RAG, which stands for Retrieval-Augmented Generation. The idea is simple: first RETRIEVE the relevant pages, then have the AI GENERATE an answer from only those pages. Think of it as a super-fast Ctrl+F, followed by an assistant that turns the found text into a useful answer.

### The answer

After the app finds the best passage, it sends only your question and that passage to the AI service through `/api/chat`. It does not send the whole PDF or your secret key. The AI writes a short answer and cites the page, such as `p.31`. The citation includes a page-jump button, so clicking it moves the PDF viewer to that page.

## 4. The design choices (and why they matter)

### Why a server-side key

The AI key is kept on the server, not in the web page. The file `functions/api/chat.js` reads `context.env.OPENROUTER_API_KEY`, a secret set in Cloudflare Pages. The browser never sees that key, so someone cannot steal it from the page. That is why this project has a `functions/` folder and a secret.

### Why RAG instead of just "ask the AI the whole PDF"

AI models have limits on how much text they can handle at once. Sending the whole PDF every time would be slower, less focused, and would expose more of the document than needed. RAG keeps the answer grounded in the real PDF because the AI answers from the retrieved page text and shows a citation.

### Why PDF.js renders in the browser

The app uses PDF.js, stored in `vendor/pdfjs`, to draw the PDF inside the browser. You see the actual page, not just copied text, and the page-jump button can move the PDF pane to the cited page.

### Offline / demo mode

If the AI key is not set, the app still works in demo mode. It searches `rag_corpus.json` and shows the best matching passage with a note that it is "running offline (demo mode)." This keeps the page from feeling broken during setup.

### Mobile-friendly

The page is built to work on a phone. On smaller screens, the PDF viewer and chat stack into a split screen.

## 5. What is in this repository

- `spec-chat-standalone/index.html` is the page people see: PDF viewer, chat, search, and page-jump behavior.
- `spec-chat-standalone/vendor/pdfjs` is the PDF display engine.
- `spec-chat-standalone/functions/api/chat.js` is the secure AI middleman. It receives the question and retrieved passage, then calls OpenRouter.
- `spec-chat-standalone/rag_corpus.json` is the searchable index built from the sample PDF.
- `spec-chat-standalone/rag_corpus.js` is a backup loader version of the same search data.
- `build_rag_corpus.py` (in the full project repository, not this standalone folder) is the tool that turns your PDF into `rag_corpus.json` and `rag_corpus.js`. The standalone folder ships with a pre-built corpus so it runs on its own.
- `spec-chat-standalone/README.md` has exact setup and deployment steps.
- `template.html.j2` and `build.py` belong to the larger dashboard, which can embed this chat app.

## 6. How do I make this work for MY PDFs?

Short version:

1. Put your PDF where the script can find it.
2. Run the ingestion script:

   ```sh
   python3 build_rag_corpus.py your-file.pdf
   ```

3. Copy the new `rag_corpus.json`, `rag_corpus.js`, and your PDF into the chat app folder.
4. Update the `PDF_URL` value in `index.html` so it matches your PDF filename.
5. Deploy the folder to Cloudflare Pages.
6. Set `OPENROUTER_API_KEY` as a Cloudflare Pages secret so the live AI answers work.

Use `spec-chat-standalone/README.md` for the exact commands. The README is the checklist; this guide is the plain-English explanation.

## 7. Common questions / troubleshooting

Blank PDF: The browser could not load or draw the PDF. Check that the PDF is beside `index.html`, the filename matches `PDF_URL`, and `vendor/pdfjs/pdf.min.js` plus `vendor/pdfjs/pdf.worker.min.js` are present. Serving the folder from a web server can also help.

No real AI answers: The app is probably in offline demo mode because `OPENROUTER_API_KEY` is not set yet. Search can still show a passage, but live AI answers need the secret.

Wrong page citations: Rebuild `rag_corpus.json` from the exact PDF shown in the viewer. The search file and visible PDF need to match.

PDF text cannot be found: The PDF may be a scan or image-only file. Run OCR first. OCR means "optical character recognition," which turns picture-based text into selectable text a computer can search.

Costs: The AI key is pay-per-use through the AI provider. Occasional questions should usually be small because the app sends only a short passage instead of the whole PDF. Still check pricing and set spending limits.

## 8. Friendly closing

This is a starting point, not a finished product. It already shows the important idea: your team can ask plain-English questions and jump back to the cited PDF page. From here, you can swap in your own PDFs, improve the search, change the design, or connect it to a larger estimating or operations workflow.
