"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { ConsultationModal, SubscriptionModal } from "./Modals";
import { getPersonalizedAnswer, type PersonalizedAnswer } from "@/lib/personalized-answer";
import { trackEvent } from "@/lib/analytics";

const demoAnswer: PersonalizedAnswer = {
  articleSlug: "os-v-1c-8-3",
  savedAt: "2026-09-20T00:00:00.000Z",
  question: "Какие документы проверить перед принятием основного средства к учету в 1С?",
  answer: {
    shortAnswer: "Перед принятием основного средства к учету проверьте договор, акт или УПД, первоначальную стоимость, дополнительные расходы, дату ввода в эксплуатацию и параметры амортизации.",
    explanation: ["Эти сведения помогают сверить исходные документы с карточкой объекта и параметрами учета в 1С.", "Подборка сформирована по теме принятия основных средств к учету и не заменяет проверку вашей учетной политики."],
    sources: [
      { id: "fixed-assets", title: "Принятие к учету ОС в 1С 8.3", category: "Инструкция", updatedAt: "2026-09-18", url: "/articles/os-v-1c-8-3" },
      { id: "fixed-assets-cost", title: "Проверка первоначальной стоимости основного средства", category: "Чек-лист", updatedAt: "2026-09-17", url: "/articles/os-v-1c-8-3#before-start" },
      { id: "fixed-assets-depreciation", title: "Настройка амортизации в 1С", category: "Практикум", updatedAt: "2026-09-16", url: "/articles/os-v-1c-8-3#control" },
    ],
    stepsPreview: ["Соберите договор, акт или УПД и документы по дополнительным расходам, затем сопоставьте их с карточкой объекта.", "Проверьте дату ввода в эксплуатацию, первоначальную стоимость и параметры амортизации перед проведением документа."],
    locked: true, remainingQueries: 3, confidence: "medium", demoMode: true,
  },
};

export function PersonalizedAnswersPage() {
  const [item, setItem] = useState<PersonalizedAnswer | undefined>(undefined);
  const [modal, setModal] = useState<"subscription" | "consultation" | null>(null);
  const subscribe = (location: string) => { trackEvent("personalized_full_access_click", { button_location: location }); setModal("subscription"); };
  const consult = () => { trackEvent("consultation_click"); setModal("consultation"); };
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const value = getPersonalizedAnswer() || demoAnswer;
      setItem(value);
      trackEvent("personalized_answer_open", { article_slug: value.articleSlug }); trackEvent("personalized_paywall_view", { article_slug: value.articleSlug });
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  return <><Header onSubscribe={subscribe} /><div className="article-layout"><Sidebar onSubscribe={subscribe} onConsult={consult} /><main className="article-main personalized-main">
    {item === undefined ? <p>Загружаем персональный ответ…</p> : <article className="personalized-card">
      <span className="personalized-badge">Подобрано для вас</span><h1>Вероятно, здесь ответ на ваш вопрос</h1><p className="article-intro">Мы учли ваш вопрос, содержание открытой статьи и материалы базы знаний БухЭксперта.</p>
      <div className="personalized-question"><small>Ваш вопрос</small><b>{item.question}</b></div>
      <h2>Краткий ответ</h2><p className="short-answer">{item.answer.shortAnswer}</p>{item.answer.explanation.map((text) => <p key={text}>{text}</p>)}
      <h2>Почему этот ответ подходит</h2><p>Подборка связана с темой принятия основных средств в 1С и использует совпадения по вашему вопросу и содержанию статьи.</p>
      <h2>Найденные материалы БухЭксперта</h2><div className="materials">{item.answer.sources.map((source) => <article className="material" key={source.id}><span className="tag">{source.category}</span><h3>{source.title}</h3><a className="text-link" href={source.url}>Открыть материал →</a></article>)}</div>
      <h2>Первые шаги решения</h2><ol className="steps">{item.answer.stepsPreview.map((step) => <li key={step}>{step}</li>)}</ol>
      <section className="personalized-lock"><p>Полное пошаговое решение найдено. Оформите подписку, чтобы открыть все действия, примеры и связанные материалы.</p><div className="locked-preview"><span>Проверьте взаимосвязанные документы и параметры учета.</span><span>Сопоставьте результат с требованиями вашей ситуации.</span></div><div className="result-actions"><Link className="primary-btn action-button" href="/dostup" onClick={() => trackEvent("personalized_full_access_click", { button_location: "personalized_paywall" })}>Открыть полный доступ</Link><button className="secondary-link" onClick={consult}>Получить консультацию</button><Link className="secondary-link" href="/articles/os-v-1c-8-3">Перейти к исходной статье</Link></div></section>
    </article>}
  </main><aside className="article-toc"><b>Персональный ответ</b><span>Вопрос</span><span>Материалы</span><span>Первые шаги</span></aside></div>
  {modal === "subscription" && <SubscriptionModal onClose={() => setModal(null)} />}{modal === "consultation" && <ConsultationModal onClose={() => setModal(null)} />}</>;
}
