"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { AiAssistant } from "./AiAssistant";
import { ContentFeed, RightEventsColumn } from "./ContentFeed";
import { ConsultationModal, SubscriptionModal } from "./Modals";

export function AppShell() {
  const [modal, setModal] = useState<"subscription" | "consultation" | null>(null);
  const subscribe = (location: string) => { trackEvent("ai_subscription_click", { button_location: location }); setModal("subscription"); };
  const consult = (location: string) => { trackEvent("ai_consultation_click", { button_location: location }); setModal("consultation"); };
  return <>
    <Header onSubscribe={subscribe} />
    <div className="dashboard">
      <Sidebar onSubscribe={subscribe} onConsult={consult} />
      <main className="workspace">
        <AiAssistant onSubscribe={subscribe} onConsult={consult} />
        <div className="insight-grid"><div className="feed-stack"><ContentFeed /></div><RightEventsColumn /></div>
      </main>
    </div>
    <button className="helper" onClick={() => consult("owl_widget")}><i>🦉</i><span><b>Сова-помощник</b>Нужна консультация?</span></button>
    {modal === "subscription" && <SubscriptionModal onClose={() => setModal(null)} />}
    {modal === "consultation" && <ConsultationModal onClose={() => setModal(null)} />}
  </>;
}
