"use client";

import React from "react";
import { PomodoroMode } from "../../hooks/usePomodoro";
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
}

export default function PipTimer({
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
