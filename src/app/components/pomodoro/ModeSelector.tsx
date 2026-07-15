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
        "¿Estás seguro de que quieres cambiar de modo? El progreso actual del temporizador se reiniciará.",
      );
      if (!confirmChange) return;
    }

    playClickSound();
    onChange(mode);
  };

  return (
    <div className="flex w-full gap-2 p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
      <button
        onClick={() => handleModeChange("classic")}
        disabled={disabled}
        className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
          activeMode === "classic"
            ? "bg-zinc-800 text-white shadow-sm"
            : "text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
        }`}
      >
        Modo Clásico
      </button>
      <button
        onClick={() => handleModeChange("flex")}
        disabled={disabled}
        className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
          activeMode === "flex"
            ? "bg-zinc-800 text-white shadow-sm"
            : "text-zinc-400 hover:text-zinc-200 disabled:opacity-50"
        }`}
      >
        Modo Flexible
      </button>
    </div>
  );
}
