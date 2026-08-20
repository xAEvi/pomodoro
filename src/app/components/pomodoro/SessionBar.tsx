"use client";

import React from "react";

interface SessionBarProps {
  sessions: number;
  currentSession: number; // 1-indexed
  colorClass: string; // ej. "bg-focus" o "bg-break"
}

export default function SessionBar({
  sessions,
  currentSession,
  colorClass,
}: SessionBarProps) {
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
