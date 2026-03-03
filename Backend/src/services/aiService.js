const OPENROUTER_API_URL =
  process.env.OPENROUTER_API_URL ||
  "https://openrouter.ai/api/v1/chat/completions";
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || "gpt-4o-mini";

if (!OPENROUTER_API_KEY) {
  console.warn(
    "OPENROUTER_API_KEY is not set — AI calls will fail without it. Set OPENROUTER_API_KEY in your .env",
  );
}

async function callOpenRouter(payload) {
  const res = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    const err = new Error(`OpenRouter error: ${res.status} ${text}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

exports.queryAI = async (message) => {
  if (!message) throw new Error("No message provided");

  // First API call with reasoning enabled
  const firstPayload = {
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
    reasoning: { enabled: true },
  };

  const first = await callOpenRouter(firstPayload);
  const assistantMessage = first.choices?.[0]?.message;
  console.log("First response from AI:", assistantMessage);
  if (!assistantMessage) throw new Error("Empty response from AI");

  // Preserve reasoning details
  const messages = [
    { role: "user", content: message },
    {
      role: "assistant",
      content: assistantMessage.content,
      reasoning_details: assistantMessage.reasoning_details,
    },
    { role: "user", content: "Are you sure? Think carefully." },
  ];

  const secondPayload = {
    model: OPENROUTER_MODEL,
    messages,
  };

  const second = await callOpenRouter(secondPayload);
  const finalContent = second.choices?.[0]?.message?.content;

  return {
    rawFirst: first,
    rawSecond: second,
    content: finalContent,
  };
};
