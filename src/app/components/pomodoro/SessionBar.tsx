"use client";

import React from "react";

interface SessionBarProps {
  sessions: number;
  currentSession: number; // 1-indexed — classic: real session; flex: ignored when variant="budget"
  colorClass: string; // ej. "bg-focus" o "bg-break"
  variant?: "sessions" | "budget";
  budgetProgress?: number; // 0..1, only for variant="budget"
  budgetLabel?: string;
}

export default function SessionBar({
  sessions,
  currentSession,
  colorClass,
  variant = "sessions",
  budgetProgress = 0,
  budgetLabel,
}: SessionBarProps) {
  if (variant === "budget") {
    const pct = Math.min(100, Math.max(0, budgetProgress * 100));
    return (
      <div
        className="flex items-center gap-2"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={budgetLabel ?? `Budget ${Math.round(pct)}% used`}
      >
        <div className="flex-1 h-[3px] rounded-full bg-white/[0.09] relative overflow-hidden">
          <span
            aria-hidden="true"
            className={`absolute inset-y-0 left-0 rounded-full transition-[width,background-color] duration-[480ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${colorClass}`}
            style={{ width: `${pct}%` }}
          />
          {/* Tick marks for each session boundary */}
          <span className="absolute inset-0 flex" aria-hidden="true">
            {Array.from({ length: sessions - 1 }, (_, i) => (
              <span key={i} className="flex-1 flex justify-end">
                <span className="w-px h-full bg-canvas" style={{ marginRight: 0 }} />
              </span>
            ))}
          </span>
        </div>
        <span className="text-[11px] text-faint tabular-nums shrink-0">{Math.round(pct)}%</span>
      </div>
    );
  }

  return (
    <div
      className="flex gap-[5px]"
      role="progressbar"
      aria-valuenow={currentSession}
      aria-valuemin={1}
      aria-valuemax={sessions}
      aria-label={`Session ${currentSession} of ${sessions}`}
    >
      {Array.from({ length: sessions }, (_, index) => {
        const isCompleted = index < currentSession - 1;
        const isCurrent = index === currentSession - 1;

        let segmentClass = "bg-white/10";
        if (isCompleted) segmentClass = colorClass;
        else if (isCurrent) segmentClass = `${colorClass} opacity-45`;

        return (
          <span
            key={index}
            aria-hidden="true"
            className={`flex-1 h-[3px] rounded-full transition-colors duration-300 ${segmentClass}`}
          />
        );
      })}
    </div>
  );
}
