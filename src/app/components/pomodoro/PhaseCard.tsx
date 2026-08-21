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
  /** Key que incrementa en cada Switch en modo Flex; 0 = sin animación inicial */
  animationKey?: number;
}

export default function PhaseCard({
  label,
  colorKey,
  timeLabel,
  variant,
  isRunning = false,
  statText,
  progress = 0,
  animationKey = 0,
}: PhaseCardProps) {
  const colorText = colorKey === "focus" ? "text-focus" : "text-break";
  const colorBg = colorKey === "focus" ? "bg-focus" : "bg-break";
  const shouldAnimate = animationKey > 0;

  if (variant === "active") {
    return (
      <div
        key={shouldAnimate ? `active-${animationKey}` : undefined}
        className={`rounded-xl border p-4 relative overflow-hidden isolate transition-[border-color,background-color] duration-[420ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
          colorKey === "focus"
            ? "border-focus/50 bg-focus/[0.07]"
            : "border-break/50 bg-break/[0.07]"
        } ${shouldAnimate ? "flex-active-animate" : ""}`}
        role="group"
        aria-label={`${label} timer, ${isRunning ? "running" : "paused"}`}
      >
        {/* Shimmer sweep — solo durante el Switch, acotado a la tarjeta */}
        {shouldAnimate && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-xl"
          >
            <span className="flex-shimmer block h-full w-full" />
          </span>
        )}
        <div
          className={`flex items-center justify-between mb-1.5 ${shouldAnimate ? "phase-label-anim" : ""}`}
        >
          <span
            className={`text-[11px] tracking-wider lowercase transition-colors duration-[420ms] ${colorText}`}
          >
            {label} · {isRunning ? "running" : "paused"}
          </span>
          {statText && (
            <span className="text-[11px] text-muted tabular-nums transition-colors duration-300">
              {statText}
            </span>
          )}
        </div>
        <div
          className={`font-mono text-[38px] text-ink tracking-tight leading-none tabular-nums ${shouldAnimate ? "phase-time-anim" : ""}`}
          aria-live="off"
          aria-atomic="true"
        >
          {timeLabel}
        </div>
        <div
          className={`h-[3px] rounded-full bg-white/[0.09] mt-3 ${shouldAnimate ? "phase-progress-anim" : ""}`}
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${Math.round(progress * 100)}% used`}
        >
          <span
            aria-hidden="true"
            className={`block h-[3px] rounded-full transition-[width,background-color] duration-500 ease-linear ${colorBg}`}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      key={shouldAnimate ? `banked-${animationKey}` : undefined}
      className={`rounded-[10px] border border-line p-3.5 relative overflow-hidden isolate transition-[border-color,background-color] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${shouldAnimate ? "flex-banked-animate" : ""}`}
    >
      <div
        className={`flex items-center justify-between ${shouldAnimate ? "phase-label-anim" : ""}`}
      >
        <span className="text-[11px] tracking-wider text-faint lowercase">
          {label} · remaining
        </span>
        <span
          className={`font-mono text-[22px] text-muted tabular-nums ${shouldAnimate ? "phase-time-anim" : ""}`}
          style={shouldAnimate ? { animationDelay: "135ms" } : undefined}
        >
          {timeLabel}
        </span>
      </div>
    </div>
  );
}
