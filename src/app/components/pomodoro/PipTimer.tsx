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
  onStartPause: () => void;
  onTogglePhase: () => void;
}

export default function PipTimer({
  phaseLabel,
  timeLabel,
  colorKey,
  isRunning,
  activeMode,
  onStartPause,
  onTogglePhase,
}: PipTimerProps) {
  const colorText = colorKey === "focus" ? "text-focus" : "text-break";
  const bgWash = colorKey === "focus" ? "bg-focus-wash" : "bg-break-wash";

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
