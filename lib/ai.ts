import type { ChatResponse, Material } from "@/types";

const insufficient = "В базе недостаточно данных для точного ответа. Уточните конфигурацию 1С и подробнее опишите ситуацию.";

export function createDemoAnswer(materials: Material[], remainingQueries: number): ChatResponse {
  if (!materials.length) return {
    shortAnswer: insufficient,
    explanation: ["AI-помощник отвечает только по найденным материалам и не будет придумывать рекомендации.", "Укажите конфигурацию — например, 1С:Бухгалтерия 3.0 или 1С:ЗУП 3.1 — и опишите исходные документы."],
    stepsPreview: [], sources: [], locked: true, remainingQueries, confidence: "low", demoMode: true, insufficient: true,
  };
  const primary = materials[0];
  return {
    shortAnswer: primary.summary,
    explanation: [
      `По материалам базы сначала проверьте исходные документы и настройки в ${primary.configuration}.`,
      "Работайте последовательно и контролируйте результат после проведения документа. Точный порядок зависит от версии программы и вашей учетной ситуации.",
    ],
    stepsPreview: [
      `Откройте подходящий раздел в ${primary.configuration} и проверьте организацию, период и исходные документы.`,
      "Создайте или откройте нужный документ, заполните реквизиты по первичным документам и проверьте результат перед проведением.",
    ],
    sources: materials.slice(0, 3).map(({ id, title, url, category, updatedAt }) => ({ id, title, url, category, updatedAt })),
    locked: true, remainingQueries, confidence: materials.length > 1 ? "medium" : "low", demoMode: true,
  };
}

export async function createAiAnswer(question: string, materials: Material[], remainingQueries: number): Promise<ChatResponse> {
  if (!process.env.AI_API_KEY || !materials.length) return createDemoAnswer(materials, remainingQueries);
  const endpoint = `${(process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "")}/chat/completions`;
  const context = materials.map((m) => `[${m.id}] ${m.title}\n${m.summary}\n${m.content}\nКонфигурация: ${m.configuration}`).join("\n\n");
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.AI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "gpt-4.1-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "Ты помощник БухЭксперта. Отвечай только по контексту, не выдумывай источники, нормы и проводки. Верни JSON: shortAnswer string, explanation string[2-3], stepsPreview string[1-2], sourceIds string[], confidence low|medium|high. Предлагай уточнить конфигурацию 1С." },
        { role: "user", content: `Вопрос: ${question}\n\nКонтекст:\n${context}` },
      ],
    }),
  });
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const payload = await response.json();
  const parsed = JSON.parse(payload.choices?.[0]?.message?.content || "{}");
  const allowed = new Map(materials.map((m) => [m.id, m]));
  const selected = (Array.isArray(parsed.sourceIds) ? parsed.sourceIds : []).map((id: string) => allowed.get(id)).filter(Boolean) as Material[];
  const safeSources = (selected.length ? selected : materials.slice(0, 3)).map(({ id, title, url, category, updatedAt }) => ({ id, title, url, category, updatedAt }));
  return {
    shortAnswer: String(parsed.shortAnswer || createDemoAnswer(materials, remainingQueries).shortAnswer),
    explanation: Array.isArray(parsed.explanation) ? parsed.explanation.slice(0, 3).map(String) : [],
    stepsPreview: Array.isArray(parsed.stepsPreview) ? parsed.stepsPreview.slice(0, 2).map(String) : [],
    sources: safeSources, locked: true, remainingQueries,
    confidence: ["low", "medium", "high"].includes(parsed.confidence) ? parsed.confidence : "medium",
    demoMode: false,
  };
}
