const MODELS = [
  "meta-llama/llama-3.3-70b-instruct",
  "meta-llama/llama-3.2-3b-instruct:free",
  "qwen/qwen3-next-80b-a3b-instruct:free",
  "liquid/lfm-2.5-1.2b-instruct:free",
];

const SYSTEM_PROMPT =
  "You answer questions about a construction bid package using ONLY the provided spec excerpts. Cite the page numbers you used (e.g. p.12). If the answer is not in the excerpts, say you cannot find it in the spec. Be concise and practical for a construction executive.";

async function callOpenRouter(apiKey, model, query, specContext, signal) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://fahs-construction.pages.dev",
      "X-Title": "Spec Chat",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Spec excerpts:\n${specContext}\n\nQuestion: ${query}` },
      ],
      temperature: 0.2,
      max_tokens: 400,
    }),
    signal,
  });
  return response;
}

export async function onRequestPost(context) {
  const headers = { "content-type": "application/json" };

  if (!context.env.OPENROUTER_API_KEY) {
    return new Response(JSON.stringify({ offline: true }), { status: 503, headers });
  }

  let body;
  try {
    body = await context.request.json();
  } catch {
    return new Response(JSON.stringify({ offline: true }), { status: 503, headers });
  }
  const query = String(body.query || "").trim();
  const specContext = String(body.context || "").trim();
  if (!query || !specContext) {
    return new Response(JSON.stringify({ offline: true }), { status: 503, headers });
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    // Try each free model; retry once on a 429/5xx to absorb transient throttling.
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const response = await callOpenRouter(
            context.env.OPENROUTER_API_KEY,
            model,
            query,
            specContext,
            controller.signal,
          );
          if (response.ok) {
            const json = await response.json();
            const answer = json?.choices?.[0]?.message?.content;
            if (answer) {
              return new Response(JSON.stringify({ answer, live: true }), { status: 200, headers });
            }
          }
          // 429 or 5xx -> brief pause then retry same/next model
          if (response.status === 429 || response.status >= 500) {
            await new Promise((r) => setTimeout(r, 700));
            continue;
          }
          break; // non-retryable client error on this model; move on
        } catch (err) {
          if (controller.signal.aborted) break;
          await new Promise((r) => setTimeout(r, 500));
        }
      }
    }
    return new Response(JSON.stringify({ offline: true }), { status: 503, headers });
  } finally {
    clearTimeout(timeoutId);
  }
}
