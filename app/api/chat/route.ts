import { NextRequest, NextResponse } from "next/server";
import { createAiAnswer } from "@/lib/ai";
import { searchMaterials } from "@/lib/search";

const LIMIT = 3;
const COOKIE = "buhexpert_demo_queries";

export async function GET(request: NextRequest) {
  const used = Math.max(0, Number.parseInt(request.cookies.get(COOKIE)?.value || "0", 10) || 0);
  return NextResponse.json({ remainingQueries: Math.max(0, LIMIT - used), demoMode: !process.env.AI_API_KEY });
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный формат запроса." }, { status: 400 });
  }
  const question = typeof body === "object" && body && "question" in body ? String(body.question).trim() : "";
  if (question.length < 4 || question.length > 600) {
    return NextResponse.json({ error: "Введите вопрос длиной от 4 до 600 символов." }, { status: 400 });
  }
  const used = Math.max(0, Number.parseInt(request.cookies.get(COOKIE)?.value || "0", 10) || 0);
  if (used >= LIMIT) {
    return NextResponse.json({ error: "Бесплатные вопросы закончились.", code: "LIMIT_REACHED", remainingQueries: 0 }, { status: 429 });
  }
  const remainingQueries = LIMIT - used - 1;
  try {
    const answer = await createAiAnswer(question, searchMaterials(question), remainingQueries);
    const response = NextResponse.json(answer);
    response.cookies.set(COOKIE, String(used + 1), { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 30, path: "/" });
    return response;
  } catch (error) {
    console.error("Chat request failed", error);
    return NextResponse.json({ error: "Не удалось получить ответ. Попробуйте ещё раз." }, { status: 502 });
  }
}

export async function DELETE() {
  if (process.env.NODE_ENV === "production") return NextResponse.json({ error: "Недоступно." }, { status: 404 });
  const response = NextResponse.json({ remainingQueries: LIMIT });
  response.cookies.set(COOKIE, "0", { httpOnly: true, sameSite: "lax", path: "/" });
  return response;
}
