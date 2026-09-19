"use client";

import { KeyboardEvent, useEffect, useState } from "react";
import type { ChatResponse } from "@/types";
import { trackEvent } from "@/lib/analytics";
import { AiAnswer } from "./AiAnswer";

const suggestions = ["Как провести лизинг в 1С?", "Как начислить НДФЛ?", "Как оформить увольнение?", "Как отразить расходы на подписку?"];

export function AiAssistant({ onSubscribe, onConsult }: { onSubscribe: (location: string) => void; onConsult: (location: string) => void }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState("");
  const [answer, setAnswer] = useState<ChatResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [remaining, setRemaining] = useState(3);
  const [demoMode, setDemoMode] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    trackEvent("ai_assistant_view");
    fetch("/api/chat").then((res) => res.json()).then((data) => { setRemaining(data.remainingQueries); setDemoMode(data.demoMode); }).catch(() => {});
  }, []);

  const submit = async (value = question) => {
    const normalized = value.trim();
    if (loading || normalized.length < 4) return;
    if (remaining <= 0) { trackEvent("ai_free_limit_reached", { remaining_queries: 0 }); onSubscribe("free_limit"); return; }
    setQuestion(normalized); setAsked(normalized); setAnswer(null); setError(""); setLoading(true);
    trackEvent("ai_query_submit", { remaining_queries: remaining });
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: normalized }) });
      const data = await response.json();
      if (response.status === 429) { setRemaining(0); trackEvent("ai_free_limit_reached", { remaining_queries: 0 }); onSubscribe("free_limit"); return; }
      if (!response.ok) throw new Error(data.error || "Не удалось получить ответ.");
      setAnswer(data); setRemaining(data.remainingQueries); setDemoMode(data.demoMode);
      trackEvent(data.insufficient ? "ai_no_answer" : "ai_answer_view", { remaining_queries: data.remainingQueries, answer_confidence: data.confidence });
      trackEvent("ai_paywall_view", { remaining_queries: data.remainingQueries });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось получить ответ. Попробуйте ещё раз."); }
    finally { setLoading(false); }
  };
  const reset = () => { setAsked(""); setAnswer(null); setError(""); setQuestion(""); document.querySelector<HTMLInputElement>("#question")?.focus(); };
  const keydown = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter") submit(); };
  const resetLimit = async () => { await fetch("/api/chat", { method: "DELETE" }); setRemaining(3); reset(); };

  return <section className="card ai" id="ai">
    <div className="ai-orbit" aria-hidden="true"><span>✦</span><span>✦</span><span>✦</span></div>
    <div className="ai-kicker"><span className="ai-kicker-dot" />БУХЭКСПЕРТ AI · ПОИСК ПО БАЗЕ ЗНАНИЙ</div>
    <div className="ai-heading"><div><h1>Спросите — и получите готовое решение</h1>
      <p className="lead">AI-помощник ищет по материалам БухЭксперта, объясняет логику учёта и находит нужную инструкцию в 1С.</p></div>
      <div className="owl" aria-hidden="true">✦</div></div>
    <div className="ask-shell">
      <span className="ask-icon" aria-hidden="true">⌕</span>
      <input id="question" value={question} maxLength={600} onChange={(e) => setQuestion(e.target.value)} onKeyDown={keydown} disabled={loading || remaining === 0} placeholder="Например: как отразить лизинг в 1С?" aria-label="Вопрос AI-помощнику" />
      <button className="primary-btn ask-button" disabled={loading || question.trim().length < 4 || remaining === 0} onClick={() => submit()}>{loading ? "Ищу…" : <><span>Спросить AI</span><b>↗</b></>}</button>
    </div>
    <div className="chips">{suggestions.map((item) => <button className="chip" key={item} disabled={loading || remaining === 0} onClick={() => { setQuestion(item); submit(item); }}>{item}</button>)}</div>
    <div className="ai-meta"><span>Осталось бесплатных вопросов: <b>{remaining}</b></span>{demoMode && <span className="demo-label">Демонстрационный режим</span>}
      {process.env.NODE_ENV === "development" && <button className="reset-limit" onClick={resetLimit}>Сбросить demo-лимит</button>}</div>
    <p className="fine">Ответ формируется по проверенной демонстрационной базе. AI-помощник может уточнить конфигурацию и версию 1С.</p>
    {(asked || loading || error) && <div className="result show">{loading && <><div className="query"><span>?</span><div>{asked}</div></div><div className="loader show"><i className="spinner" />Ищу по материалам БухЭксперта…</div></>}
      {error && <div className="error-state"><b>Не удалось получить ответ</b><p>{error}</p><button className="outline modal-button" onClick={() => submit(asked)}>Повторить запрос</button></div>}
      {answer && <AiAnswer question={asked} answer={answer} onReset={reset} onSubscribe={() => onSubscribe("answer_paywall")} onConsult={() => onConsult("answer_paywall")} />}</div>}
    {remaining === 0 && !answer && <div className="limit-state"><b>Бесплатные вопросы закончились</b><p>Откройте полный доступ, чтобы продолжить работу с AI-помощником.</p><button className="primary-btn modal-button" onClick={() => onSubscribe("limit_inline")}>Открыть полный доступ</button></div>}
  </section>;
}
