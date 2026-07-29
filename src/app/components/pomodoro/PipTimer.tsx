"use client";

import React from "react";
import { PomodoroMode } from "../../hooks/usePomodoro";

interface PipTimerProps {
  phaseLabel: string;
  timeLabel: string;
  bgClass: string;
  isRunning: boolean;
  activeMode: PomodoroMode;
  onStartPause: () => void;
  onTogglePhase: () => void;
}

export default function PipTimer({
  phaseLabel,
  timeLabel,
  bgClass,
  isRunning,
  activeMode,
  onStartPause,
  onTogglePhase,
}: PipTimerProps) {
  return (
    <div
      className={`h-screen w-screen flex flex-col items-center justify-center gap-2 transition-colors duration-500 ${bgClass}`}
    >
      <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">
        {phaseLabel}
      </span>
      <span className="text-4xl font-bold font-mono tabular-nums text-white">
        {timeLabel}
      </span>
      <div className="mt-1 flex items-center gap-2">
        <button
          onClick={onStartPause}
          className="px-4 py-1.5 text-xs font-bold rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        {activeMode === "flex" && (
          <button
            onClick={onTogglePhase}
            className="px-4 py-1.5 text-xs font-bold rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
          >
            Toggle Phase
          </button>
        )}
      </div>
    </div>
  );
}
