"use client";

import { FormEvent, useEffect, useState } from "react";
import { trackEvent } from "@/lib/analytics";

function ModalShell({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", close);
    return () => document.removeEventListener("keydown", close);
  }, [onClose]);
  return <div className="overlay open" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <button className="close" onClick={onClose} aria-label="Закрыть">×</button><h2 id="modal-title">{title}</h2>{children}
    </div>
  </div>;
}

export function SubscriptionModal({ onClose }: { onClose: () => void }) {
  const [demo, setDemo] = useState(false);
  return <ModalShell title="Получите полный доступ к БухЭксперту" onClose={onClose}>{demo ? <div className="success visible"><div className="check">✓</div><h3>Демо-доступ активирован</h3><p>В MVP это демонстрационное состояние без оплаты.</p><button className="primary-btn modal-button" onClick={onClose}>Продолжить</button></div> : <>
    <p className="sub">Все инструменты для уверенной работы бухгалтера в одном месте.</p>
    <ul className="benefits"><li>Пошаговые инструкции по 1С</li><li>Полная база материалов</li><li>Актуальные семинары</li><li>Ответы экспертов</li><li>История вопросов</li></ul>
    <div className="modal-actions"><button className="primary-btn modal-button" onClick={() => { trackEvent("ai_subscription_click", { button_location: "trial_modal" }); setDemo(true); }}>Получить 8 дней доступа</button>
      <a className="outline modal-button" href="https://buhexpert8.ru/dostup" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent("ai_subscription_click", { button_location: "tariffs_modal" })}>Посмотреть тарифы</a></div>
  </>}</ModalShell>;
}

export function ConsultationModal({ onClose }: { onClose: () => void }) {
  const [sent, setSent] = useState(false);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    trackEvent("ai_consultation_submit");
    setSent(true);
  };
  return <ModalShell title="Индивидуальная консультация" onClose={onClose}>{sent ? <div className="success visible"><div className="check">✓</div><p><b>Спасибо! В демонстрационной версии заявка не отправляется.</b></p><button className="primary-btn modal-button" onClick={onClose}>Готово</button></div> : <>
    <p className="sub">Опишите вопрос — специалист поможет определить формат консультации.</p><form onSubmit={submit}>
      <label className="form-field">Имя<input name="name" required minLength={2} autoFocus placeholder="Как к вам обращаться" /></label>
      <label className="form-field">Телефон<input name="phone" type="tel" required pattern=".{10,}" placeholder="+7 (___) ___-__-__" /></label>
      <label className="form-field">Краткое описание вопроса<textarea name="question" required minLength={10} placeholder="Конфигурация 1С и суть вопроса" /></label>
      <label className="consent"><input type="checkbox" required /> <span>Согласен на обработку данных для обратной связи</span></label>
      <button className="primary-btn modal-button submit">Отправить заявку</button>
    </form>
  </>}</ModalShell>;
}
