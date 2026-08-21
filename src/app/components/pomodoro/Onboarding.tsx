"use client";

import React from "react";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { CloseIcon } from "./icons";

interface OnboardingProps {
  open: boolean;
  onDismiss: () => void;
}

export default function Onboarding({ open, onDismiss }: OnboardingProps) {
  const trapRef = useFocusTrap(open, onDismiss);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 p-4"
      role="presentation"
    >
      <div
        ref={trapRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
        aria-describedby="onboarding-desc"
        className="w-full max-w-[420px] bg-surface border border-line rounded-2xl p-5 outline-none shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h2 id="onboarding-title" className="text-ink text-[15px] font-medium">
              How do you want to work?
            </h2>
            <p id="onboarding-desc" className="text-[12px] text-muted mt-1">
              Pick a mode. You can switch anytime from the toggle above the timer.
            </p>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Close onboarding"
            className="shrink-0 w-7 h-7 rounded-full bg-white/[0.06] text-muted hover:text-ink flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-xl border border-line bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-6 h-6 rounded-full bg-ink text-[#101318] flex items-center justify-center text-[10px] font-bold">A</span>
              <span className="text-[12px] font-medium text-ink">Classic</span>
              <span className="ml-auto text-[10px] text-faint border border-line rounded-full px-1.5 py-0.5">auto</span>
            </div>
            <p className="text-[11px] leading-relaxed text-faint">
              Alternates <span className="text-muted">focus → break</span> automatically. Ideal for a strict routine.
            </p>
            <p className="text-[11px] text-subtle mt-2 font-mono">25 / 5 · 4 sessions</p>
          </div>

          <div className="rounded-xl border border-line bg-white/[0.03] p-3.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="w-6 h-6 rounded-full bg-white/[0.08] text-ink border border-line flex items-center justify-center text-[10px] font-bold">B</span>
              <span className="text-[12px] font-medium text-ink">Flex</span>
              <span className="ml-auto text-[10px] text-faint border border-line rounded-full px-1.5 py-0.5">you control</span>
            </div>
            <p className="text-[11px] leading-relaxed text-faint">
              One <span className="text-ink">block budget</span> (e.g. 4×25/5). Switch <span className="text-ink">focus ⇄ break</span> with the button or <span className="font-mono text-muted">T</span> whenever you want.
            </p>
            <p className="text-[11px] text-subtle mt-2 font-mono">100 m focus + 20 m break</p>
          </div>
        </div>

        <div className="rounded-[10px] bg-white/[0.04] border border-line-soft px-3 py-2.5 mb-4 flex items-center justify-between">
          <span className="text-[11px] text-faint">
            Tip: <span className="text-muted font-mono">Space</span> start/pause · <span className="font-mono text-muted">R</span> reset · <span className="font-mono text-muted">T</span> switch in Flex
          </span>
        </div>

        <div className="flex justify-end">
          <button
            onClick={onDismiss}
            className="px-4 py-2 rounded-full bg-ink text-[#101318] text-xs font-medium hover:bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
