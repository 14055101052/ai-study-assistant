import https from "https";
import http from "http";

function isAIConfigured() { const k = process.env.OPENAI_API_KEY; return !!k && k !== "your-api-key-here" && k !== ""; }

function callOpenAI(messages, temperature = 0.7, maxTokens = 1000) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === "your-api-key-here" || apiKey === "") { reject(new Error("AI service is not configured. Please set OPENAI_API_KEY in your .env file.")); return; }
    const baseUrl = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const body = JSON.stringify({ model, messages, temperature, max_tokens: maxTokens });
    const url = new URL(baseUrl + "/chat/completions");
    const options = { hostname: url.hostname, port: url.port || (url.protocol === "https:" ? 443 : 80), path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}`, "Content-Length": Buffer.byteLength(body) } };
    const lib = url.protocol === "https:" ? https : http;
    const req = lib.request(options, (res) => { let data = ""; res.on("data", (c) => data += c); res.on("end", () => { try { const p = JSON.parse(data); if (res.statusCode >= 400) reject(new Error(p.error?.message || `API error: ${res.statusCode}`)); else resolve(p.choices?.[0]?.message?.content || "I couldn't generate a response."); } catch { reject(new Error("Failed to parse AI response")); } }); });
    req.on("error", (e) => reject(new Error(`Network error: ${e.message}`)));
    req.write(body); req.end();
  });
}

export async function chatWithAI(message, history, context) {
  if (!isAIConfigured()) throw new Error("AI service is not configured. Please set OPENAI_API_KEY in your .env file.");
  const sys = `You are an AI Study Assistant. Answer clearly, explain simply, use examples.${context ? `\n\nContext:\n${context}` : ""}`;
  return callOpenAI([{ role: "system", content: sys }, ...history.slice(-10).map(m => ({ role: m.role, content: m.content })), { role: "user", content: message }], 0.7, 1000);
}

export async function explainConcept(concept, context) {
  if (!isAIConfigured()) throw new Error("AI service is not configured. Please set OPENAI_API_KEY in your .env file.");
  return callOpenAI([{ role: "system", content: `Explain concepts in simple language with analogies.${context ? `\nContext: ${context}` : ""}` }, { role: "user", content: `Explain: ${concept}` }], 0.7, 800);
}

export async function summarizeTopic(topicName, topicContent) {
  if (!isAIConfigured()) throw new Error("AI service is not configured. Please set OPENAI_API_KEY in your .env file.");
  return callOpenAI([{ role: "system", content: "Create concise summaries with key concepts and takeaways." }, { role: "user", content: `Topic: ${topicName}\n\nContent:\n${topicContent}` }], 0.5, 800);
}

export async function generateQuiz(topicName, topicContent, numQuestions = 5) {
  if (!isAIConfigured()) throw new Error("AI service is not configured. Please set OPENAI_API_KEY in your .env file.");
  const sys = `Generate ${numQuestions} MCQ questions. Return ONLY a JSON array. Each: {question, options[4], correctIndex(0-3), explanation}.`;
  const raw = await callOpenAI([{ role: "system", content: sys }, { role: "user", content: `Topic: ${topicName}\n\nMaterial:\n${topicContent}` }], 0.7, 2000);
  try { let c = raw.trim(); if (c.startsWith("```")) c = c.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, ""); const p = JSON.parse(c); if (!Array.isArray(p)) throw new Error(); return p.filter(q => q.question && Array.isArray(q.options) && q.options.length === 4 && typeof q.correctIndex === "number" && q.explanation); } catch { throw new Error("Failed to generate valid quiz. Please try again."); }
}

export { isAIConfigured };
