"use client";

import React from "react";
import { PomodoroMode } from "../../hooks/usePomodoro";
import { usePipSize } from "../../hooks/usePipSize";
import { PlayIcon, PauseIcon, ArrowsExchangeIcon } from "./icons";

interface PipTimerProps {
  phaseLabel: string;
  timeLabel: string;
  colorKey: "focus" | "break";
  isRunning: boolean;
  activeMode: PomodoroMode;
  progress: number; // 0..1, fracción de tiempo transcurrido de la fase activa
  endsAtLabel: string | null;
  onStartPause: () => void;
  onTogglePhase: () => void;
  onReset?: () => void;
  pipWindow: Window | null;
}

export default function PipTimer(props: PipTimerProps) {
  const { isCompact } = usePipSize(props.pipWindow);
  return isCompact ? <PipTimerCompact {...props} /> : <PipTimerFull {...props} />;
}

function PipTimerFull({
  phaseLabel,
  timeLabel,
  colorKey,
  isRunning,
  activeMode,
  progress,
  endsAtLabel,
  onStartPause,
  onTogglePhase,
}: PipTimerProps) {
  const colorText = colorKey === "focus" ? "text-focus" : "text-break";
  const bgWash = colorKey === "focus" ? "bg-focus-wash" : "bg-break-wash";
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const progressPercent = Math.round(clampedProgress * 100);
  const size = 98;
  const strokeWidth = 5;
  const radius = size / 2 - strokeWidth;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedProgress);

  return (
    <div
      className={`h-screen w-screen flex flex-col items-center justify-center gap-2 p-2.5 transition-colors duration-700 ${bgWash}`}
      role="group"
      aria-label={`${phaseLabel} ${timeLabel} ${progressPercent}%`}
    >
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="progressbar"
        aria-valuenow={progressPercent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${progressPercent}% elapsed`}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          className="-rotate-90 block"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.10)"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className={`transition-[stroke-dashoffset] duration-500 ease-linear ${colorText}`}
            stroke="currentColor"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-0 px-1">
          <span className={`text-[9px] lowercase tracking-[0.12em] font-medium ${colorText}`}>
            {phaseLabel}
          </span>
          <span className="font-mono text-[24px] leading-none text-ink tabular-nums tracking-tight">
            {timeLabel}
          </span>
          {endsAtLabel && (
            <span className="text-[9px] text-faint leading-none mt-0.5 tabular-nums">ends {endsAtLabel}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onStartPause}
          aria-label={isRunning ? "Pause timer" : "Start timer"}
          className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-ink text-[#101318] flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 whitespace-nowrap leading-none"
        >
          {isRunning ? (
            <PauseIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          ) : (
            <PlayIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
          {isRunning ? "Pause" : "Start"}
        </button>
        {activeMode === "flex" && (
          <button
            onClick={onTogglePhase}
            aria-label="Switch phase"
            className="px-3.5 py-1.5 text-xs font-medium rounded-full border border-white/[0.14] bg-white/[0.04] text-ink flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 whitespace-nowrap leading-none"
          >
            <ArrowsExchangeIcon className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            Switch
          </button>
        )}
      </div>
    </div>
  );
}

function PipTimerCompact({
  timeLabel,
  colorKey,
  isRunning,
  activeMode,
  progress,
  endsAtLabel,
  onStartPause,
  onTogglePhase,
}: PipTimerProps) {
  const bgFill = colorKey === "focus" ? "bg-focus-wash" : "bg-break-wash";
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const progressPercent = Math.round(clampedProgress * 100);
  const isFlex = activeMode === "flex";
  const fill = (
    <div
      className={`absolute inset-y-0 left-0 transition-[width] duration-500 ease-linear transition-colors duration-700 ${bgFill}`}
      style={{ width: `${progressPercent}%` }}
    />
  );

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-canvas">
      {isFlex ? (
        <button
          type="button"
          onClick={onTogglePhase}
          aria-label="Switch phase"
          title="Switch phase"
          className="absolute inset-0 w-full h-full active:brightness-110"
        >
          {fill}
        </button>
      ) : (
        <div className="absolute inset-0 w-full h-full">{fill}</div>
      )}

      <div className="absolute inset-0 flex items-center justify-between px-2 gap-1.5 pointer-events-none">
        <span className="text-[clamp(14px,7vh,22px)] font-mono text-ink tabular-nums tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] shrink-0">
          {timeLabel}
        </span>
        {endsAtLabel ? (
          <span className="flex-1 min-w-0 text-center text-[clamp(11px,2.8vh,12px)] font-medium tabular-nums tracking-tight leading-none text-faint drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)] whitespace-nowrap truncate px-1">
            ends {endsAtLabel}
          </span>
        ) : (
          <span className="flex-1 min-w-0" aria-hidden="true" />
        )}
        <button
          onClick={(event) => {
            event.stopPropagation();
            onStartPause();
          }}
          aria-label={isRunning ? "Pause" : "Start"}
          title={isRunning ? "Pause" : "Start"}
          className="pointer-events-auto w-7 h-7 shrink-0 rounded-full bg-ink text-[#101318] flex items-center justify-center"
        >
          {isRunning ? (
            <PauseIcon className="w-3.5 h-3.5" />
          ) : (
            <PlayIcon className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
