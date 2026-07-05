"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cerulean_onboarding_v1";

const STEPS = [
  {
    selector: '[data-onboarding="chat-input"]',
    title: "Start exploring",
    body: "Ask about your product problem — Cerulean helps you think it through.",
  },
  {
    selector: '[data-onboarding="proposals"]',
    title: "Ideas never lost",
    body: "After each reply, Cerulean proposes insights to save in one click.",
  },
  {
    selector: '[data-onboarding="patch-review"]',
    title: "Build your document",
    body: "Promote text from chat — review the patch before it lands in your spec.",
  },
];

export default function OnboardingGuide() {
  const [step, setStep] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    setStep(0);
  }, []);

  if (step === null || step >= STEPS.length) return null;

  const current = STEPS[step];

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "done");
    setStep(null);
  };

  const next = () => {
    if (step + 1 >= STEPS.length) finish();
    else setStep(step + 1);
  };

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 max-w-sm w-full px-4">
      <div className="bg-white border border-cerulean-200 rounded-xl shadow-medium p-4 animate-slideUp">
        <p className="text-xs font-semibold text-cerulean-800 mb-1">{current.title}</p>
        <p className="text-[11px] text-muted mb-3 leading-relaxed">{current.body}</p>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-muted">
            {step + 1} / {STEPS.length}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={finish}
              className="text-[10px] text-muted hover:text-foreground px-2 py-1"
            >
              Skip
            </button>
            <button
              type="button"
              onClick={next}
              className="text-[10px] font-medium px-3 py-1.5 rounded-lg bg-cerulean-600 text-white"
            >
              {step + 1 >= STEPS.length ? "Done" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
