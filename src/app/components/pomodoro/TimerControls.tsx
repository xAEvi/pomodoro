"use client";

import React from "react";
import { PomodoroMode, PomodoroPhase } from "../../hooks/usePomodoro";
import { playClickSound } from "../../utils/audio";
import { PlayIcon, PauseIcon, RefreshIcon, ArrowsExchangeIcon } from "./icons";

interface TimerControlsProps {
  isRunning: boolean;
  activeMode: PomodoroMode;
  currentPhase: PomodoroPhase;
  onStartPause: () => void;
  onReset: () => void;
  onTogglePhase: () => void;
}

export default function TimerControls({
  isRunning,
  activeMode,
  currentPhase,
  onStartPause,
  onReset,
  onTogglePhase,
}: TimerControlsProps) {
  const handleAction = (callback: () => void) => {
    playClickSound();
    callback();
  };

  const nextPhaseLabel = currentPhase === "focus" ? "Break" : "Focus";

  return (
    <div className="flex items-center gap-2 mt-4">
      <button
        onClick={() => handleAction(onStartPause)}
        aria-label={isRunning ? "Pause timer" : "Start timer"}
        className="flex-1 h-11 rounded-full bg-ink text-[#101318] text-sm font-medium flex items-center justify-center gap-1.5 transition-transform active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {isRunning ? (
          <PauseIcon className="w-4 h-4" aria-hidden="true" />
        ) : (
          <PlayIcon className="w-4 h-4" aria-hidden="true" />
        )}
        {isRunning ? "Pause" : "Start"}
      </button>

      {activeMode === "flex" && (
        <button
          onClick={() => handleAction(onTogglePhase)}
          aria-label={`Switch to ${nextPhaseLabel}`}
          className="h-11 px-4 rounded-full border border-white/[0.16] text-ink text-[13px] flex items-center gap-1.5 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
        >
          <ArrowsExchangeIcon className="w-4 h-4" aria-hidden="true" />
          {nextPhaseLabel}
        </button>
      )}

      <button
        onClick={() => handleAction(onReset)}
        aria-label="Reset timer"
        title="Reset timer"
        className="w-11 h-11 rounded-full border border-white/[0.12] text-muted flex items-center justify-center hover:text-zinc-200 hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
      >
        <RefreshIcon className="w-[17px] h-[17px]" aria-hidden="true" />
      </button>
    </div>
  );
}
