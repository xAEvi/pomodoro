"use client";

import React from "react";
import { PomodoroMode } from "../../hooks/usePomodoro";
import { playClickSound } from "../../utils/audio";

interface ModeSelectorProps {
  activeMode: PomodoroMode;
  onChange: (mode: PomodoroMode) => void;
  disabled?: boolean;
  isDirty?: boolean; // Nueva prop para saber si el temporizador ya acumula progreso
}

export default function ModeSelector({
  activeMode,
  onChange,
  disabled,
  isDirty,
}: ModeSelectorProps) {
  const handleModeChange = (mode: PomodoroMode) => {
    if (disabled || mode === activeMode) return;

    // Si el temporizador ya fue iniciado/alterado, advertimos al usuario antes de cambiar
    if (isDirty) {
      const confirmChange = window.confirm(
        "Are you sure you want to change modes? The timer's current progress will be reset.",
      );
      if (!confirmChange) return;
    }

    playClickSound();
    onChange(mode);
  };

  return (
    <div className="flex bg-white/5 rounded-full p-[3px]">
      <button
        onClick={() => handleModeChange("classic")}
        disabled={disabled}
        className={`flex-1 text-center text-xs py-[5px] rounded-full transition-colors duration-200 ${
          activeMode === "classic"
            ? "bg-ink text-[#101318] font-medium"
            : "text-muted hover:text-zinc-200 disabled:opacity-50"
        }`}
      >
        Classic
      </button>
      <button
        onClick={() => handleModeChange("flex")}
        disabled={disabled}
        className={`flex-1 text-center text-xs py-[5px] rounded-full transition-colors duration-200 ${
          activeMode === "flex"
            ? "bg-ink text-[#101318] font-medium"
            : "text-muted hover:text-zinc-200 disabled:opacity-50"
        }`}
      >
        Flex
      </button>
    </div>
  );
}
