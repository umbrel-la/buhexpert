"use client";

import type { ChatResponse } from "@/types";
import { trackEvent } from "@/lib/analytics";

export function Paywall({ onSubscribe, onConsult }: { onSubscribe: () => void; onConsult: () => void }) {
  return <div className="locked-solution">
    <div className="locked-preview" aria-hidden="true"><span>3. Проверьте движения документа и связанные регистры</span><span>4. Выполните контрольные операции перед закрытием периода</span><span>5. Сопоставьте результат с исходными документами</span></div>
    <div className="paywall"><strong>Полное пошаговое решение в 1С</strong><p>Полный алгоритм, пошаговые действия в 1С и связанные материалы доступны по подписке.</p>
      <div className="result-actions"><button className="primary-btn action-button" onClick={onSubscribe}>Открыть полный доступ</button><button className="secondary-link" onClick={onConsult}>Получить консультацию</button></div>
    </div>
  </div>;
}

export function AiAnswer({ question, answer, onReset, onSubscribe, onConsult }: { question: string; answer: ChatResponse; onReset: () => void; onSubscribe: () => void; onConsult: () => void }) {
  return <div className="answer show">
    <div className="query"><span>?</span><div>{question}</div></div>
    <h2>Краткий ответ</h2><p className="short-answer">{answer.shortAnswer}</p>{answer.explanation.map((text) => <p key={text}>{text}</p>)}
    {answer.sources.length > 0 && <><h2>Найденные материалы</h2><div className="materials">{answer.sources.map((source) => <article className="material" key={source.id}>
      <span className="tag">{source.category}</span><h3>{source.title}</h3><small>Обновлено: {new Date(source.updatedAt).toLocaleDateString("ru-RU")}</small><br />
      <a className="text-link" href={source.url} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("ai_source_click", { source_id: source.id })}>Открыть материал →</a>
    </article>)}</div></>}
    {answer.stepsPreview.length > 0 && <><h2>Пошаговое решение в 1С</h2><ol className="steps">{answer.stepsPreview.map((step) => <li key={step}>{step}</li>)}</ol></>}
    <p className="disclaimer">Демонстрационный ответ. Применимость рекомендаций необходимо проверить с учётом версии 1С и конкретной ситуации.</p>
    <Paywall onSubscribe={onSubscribe} onConsult={onConsult} />
    <button className="other" onClick={onReset}>Задать другой вопрос</button>
  </div>;
}
