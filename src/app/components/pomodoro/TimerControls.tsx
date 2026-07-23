"use client";

import React from "react";
import { PomodoroMode } from "../../hooks/usePomodoro";
import { playClickSound } from "../../utils/audio";

interface TimerControlsProps {
  isRunning: boolean;
  activeMode: PomodoroMode;
  onStartPause: () => void;
  onReset: () => void;
  onTogglePhase: () => void;
}

export default function TimerControls({
  isRunning,
  activeMode,
  onStartPause,
  onReset,
  onTogglePhase,
}: TimerControlsProps) {
  const handleAction = (callback: () => void) => {
    playClickSound();
    callback();
  };

  return (
    <div className="flex items-center justify-center gap-3 w-full">
      <button
        onClick={() => handleAction(onStartPause)}
        className={`flex-1 py-4 text-sm font-bold rounded-2xl transition-all duration-200 active:scale-[0.98] ${
          isRunning
            ? "bg-zinc-800 border border-zinc-700 text-zinc-100 hover:bg-zinc-700/80"
            : "bg-white text-black hover:bg-zinc-100"
        }`}
      >
        {isRunning ? "Pause" : "Start"}
      </button>

      {activeMode === "flex" && (
        <button
          onClick={() => handleAction(onTogglePhase)}
          className="flex-1 py-4 text-sm font-bold rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800/60 transition-all duration-200 active:scale-[0.98]"
        >
          Toggle Phase
        </button>
      )}

      <button
        onClick={() => handleAction(onReset)}
        className="px-5 py-4 text-sm font-bold rounded-2xl bg-zinc-950 border border-zinc-900 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/30 transition-all duration-200"
        title="Reset timer"
      >
        Reset
      </button>
    </div>
  );
}
