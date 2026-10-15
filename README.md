# Construction Document Pipeline

A document Q&A prototype for exploring a construction bid package with page-level citations and an embedded PDF viewer.

The sample uses the Port Townsend Skatepark Fence bid package. It demonstrates how document retrieval and an LLM can help someone locate relevant information and check it against the source.

## What it does

- Searches a prebuilt, page-labeled corpus using BM25 keyword ranking and sample Q&A matches
- Displays relevant passages alongside the original PDF
- Links answers to a page-jump button in the viewer
- Requests generated answers through a server-side OpenRouter integration
- Falls back to retrieved passages when the live AI service is unavailable

## Repository layout

- `index.html`: PDF viewer, search, chat interface, and citation navigation
- `rag_corpus.json`: prebuilt search corpus for the sample document
- `rag_corpus.js`: fallback loader for the same corpus
- `functions/api/chat.js`: Cloudflare Pages Function for server-side model calls
- `vendor/pdfjs/`: PDF.js viewer dependencies
- `PortTownsend-SkateparkFence-BidPkg-31pg.pdf`: sample source document

## Running the sample

Serve the repository root through a local web server to load the PDF and search files. A static server can demonstrate retrieval and page navigation; live generated answers also require the server-side `/api/chat` function and an `OPENROUTER_API_KEY` secret.

The API key belongs in the server environment. It must not be added to browser files or committed to this repository.

## Scope and limitations

This repository contains a standalone prototype with a prebuilt corpus. The PDF ingestion script referenced in earlier documentation is not included. Supporting a different document requires a matching page-labeled corpus and an update to the PDF filename in `index.html`.

Retrieval uses keyword matching and may miss relevant context. Generated answers can be incomplete or incorrect; check the cited PDF pages before relying on them. This project is a demonstration, not a substitute for reviewing bid requirements.

Runtime behavior and a live deployment have not been revalidated as part of this documentation update.

