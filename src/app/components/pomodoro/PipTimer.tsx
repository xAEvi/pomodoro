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
  onStartPause: () => void;
  onTogglePhase: () => void;
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
  onStartPause,
  onTogglePhase,
}: PipTimerProps) {
  const colorText = colorKey === "focus" ? "text-focus" : "text-break";
  const bgWash = colorKey === "focus" ? "bg-focus-wash" : "bg-break-wash";
  const bgFill = colorKey === "focus" ? "bg-focus" : "bg-break";
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const progressPercent = Math.round(clampedProgress * 100);

  return (
    <div
      className={`h-screen w-screen flex flex-col items-center justify-center gap-1.5 transition-colors duration-700 ${bgWash}`}
    >
      <span
        className={`text-[11px] lowercase tracking-widest font-medium transition-colors duration-500 ${colorText}`}
      >
        {phaseLabel}
      </span>
      <span className="text-4xl font-mono text-ink tabular-nums tracking-tight">
        {timeLabel}
      </span>

      <div className="mt-1.5 w-[82%] max-w-[220px]">
        <div className="flex items-center justify-between text-[10px] text-faint mb-1 tabular-nums">
          <span>{progressPercent}%</span>
          <span>{100 - progressPercent}% left</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-white/10 border border-white/[0.06] overflow-hidden">
          <div
            className={`h-full rounded-full transition-[width] duration-500 ease-linear ${bgFill}`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1.5">
        <button
          onClick={onStartPause}
          className="px-3.5 py-1.5 text-xs font-medium rounded-full bg-ink text-[#101318] flex items-center gap-1.5"
        >
          {isRunning ? (
            <PauseIcon className="w-3.5 h-3.5" />
          ) : (
            <PlayIcon className="w-3.5 h-3.5" />
          )}
          {isRunning ? "Pause" : "Start"}
        </button>
        {activeMode === "flex" && (
          <button
            onClick={onTogglePhase}
            className="px-3.5 py-1.5 text-xs font-medium rounded-full border border-white/[0.16] text-ink flex items-center gap-1.5"
          >
            <ArrowsExchangeIcon className="w-3.5 h-3.5" />
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

      <div className="absolute inset-0 flex items-center justify-between px-2 gap-2 pointer-events-none">
        <span className="text-[clamp(14px,7vh,22px)] font-mono text-ink tabular-nums tracking-tight drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
          {timeLabel}
        </span>
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
