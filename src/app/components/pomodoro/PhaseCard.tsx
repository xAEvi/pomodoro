"use client";

import React from "react";

interface PhaseCardProps {
  label: string; // "focus" | "break"
  colorKey: "focus" | "break";
  timeLabel: string;
  variant: "active" | "banked";
  /** @deprecated use "remaining" — keeps backward compat */
  isRunning?: boolean; // solo para variant="active"
  statText?: string; // ej. "62 of 100 used", solo para variant="active"
  progress?: number; // 0..1, solo para variant="active"
}

export default function PhaseCard({
  label,
  colorKey,
  timeLabel,
  variant,
  isRunning = false,
  statText,
  progress = 0,
}: PhaseCardProps) {
  const colorText = colorKey === "focus" ? "text-focus" : "text-break";
  const colorBg = colorKey === "focus" ? "bg-focus" : "bg-break";

  if (variant === "active") {
    return (
      <div
        className={`rounded-xl border p-4 ${
          colorKey === "focus"
            ? "border-focus/50 bg-focus/[0.07]"
            : "border-break/50 bg-break/[0.07]"
        }`}
        role="group"
        aria-label={`${label} timer, ${isRunning ? "running" : "paused"}`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span
            className={`text-[11px] tracking-wider lowercase ${colorText}`}
          >
            {label} · {isRunning ? "running" : "paused"}
          </span>
          {statText && (
            <span className="text-[11px] text-muted tabular-nums">{statText}</span>
          )}
        </div>
        <div
          className="font-mono text-[38px] text-ink tracking-tight leading-none tabular-nums"
          aria-live="off"
          aria-atomic="true"
        >
          {timeLabel}
        </div>
        <div className="h-[3px] rounded-full bg-white/[0.09] mt-3" role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(progress * 100)}% used`}
        >
          <span
            aria-hidden="true"
            className={`block h-[3px] rounded-full transition-[width] duration-500 ease-linear ${colorBg}`}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[10px] border border-line p-3.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] tracking-wider text-faint lowercase">
          {label} · remaining
        </span>
        <span className="font-mono text-[22px] text-muted tabular-nums">
          {timeLabel}
        </span>
      </div>
    </div>
  );
}
