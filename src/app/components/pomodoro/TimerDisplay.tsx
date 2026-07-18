"use client";

import React from "react";
import { PomodoroMode, PomodoroPhase } from "../../hooks/usePomodoro";

interface TimerDisplayProps {
  mode: PomodoroMode;
  phase: PomodoroPhase;
  timeLeftFocus: number;
  timeLeftBreak: number;
  totalFocus: number;
  totalBreak: number;
  formatTime: (seconds: number) => string;
}

export default function TimerDisplay({
  mode,
  phase,
  timeLeftFocus,
  timeLeftBreak,
  totalFocus,
  totalBreak,
  formatTime,
}: TimerDisplayProps) {
  const isFocus = phase === "focus";

  // Función para renderizar el borde de progreso
  const ProgressOutline = ({
    progress,
    colorClass,
  }: {
    progress: number;
    colorClass: string;
  }) => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
      <div
        className={`absolute inset-0 transition-all duration-300 ${colorClass}`}
        style={{
          padding: "2px",
          background: `conic-gradient(currentColor ${progress}%, transparent ${progress}%)`,
          WebkitMask:
            "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />
    </div>
  );

  if (mode === "classic") {
    const currentProgress = isFocus
      ? ((totalFocus - timeLeftFocus) / totalFocus) * 100
      : ((totalBreak - timeLeftBreak) / totalBreak) * 100;

    const colorClass = isFocus ? "text-red-500/50" : "text-blue-500/50";

    return (
      <div className="relative flex flex-col items-center justify-center py-10 my-4 bg-zinc-900/40 border border-zinc-800/60 rounded-3xl">
        <ProgressOutline progress={currentProgress} colorClass={colorClass} />
        <span
          className={`text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-3 transition-colors ${
            isFocus
              ? "bg-red-500/10 text-red-400"
              : "bg-blue-500/10 text-blue-400"
          }`}
        >
          {isFocus ? "Foco activo" : "Tiempo de descanso"}
        </span>
        <span className="text-7xl font-bold font-mono tracking-tighter text-white tabular-nums">
          {formatTime(isFocus ? timeLeftFocus : timeLeftBreak)}
        </span>
      </div>
    );
  }

  // Renderizado para Modo Flexible
  const progressFocus = ((totalFocus - timeLeftFocus) / totalFocus) * 100;
  const progressBreak = ((totalBreak - timeLeftBreak) / totalBreak) * 100;

  return (
    <div className="grid grid-cols-2 gap-4 my-4">
      <div
        className={`relative flex flex-col items-center justify-center p-6 bg-zinc-900/40 border rounded-3xl transition-all duration-300 ${
          isFocus ? "border-red-500/40 bg-red-500/[0.02]" : "border-zinc-800/60"
        }`}
      >
        <ProgressOutline
          progress={progressFocus}
          colorClass="text-red-500/40"
        />
        <span
          className={`text-xs font-medium mb-1 ${isFocus ? "text-red-400" : "text-zinc-500"}`}
        >
          Enfoque
        </span>
        <span
          className={`text-3xl font-bold font-mono tracking-tight tabular-nums ${isFocus ? "text-white" : "text-zinc-400"}`}
        >
          {formatTime(timeLeftFocus)}
        </span>
      </div>

      <div
        className={`relative flex flex-col items-center justify-center p-6 bg-zinc-900/40 border rounded-3xl transition-all duration-300 ${
          !isFocus
            ? "border-blue-500/40 bg-blue-500/[0.02]"
            : "border-zinc-800/60"
        }`}
      >
        <ProgressOutline
          progress={progressBreak}
          colorClass="text-blue-500/40"
        />
        <span
          className={`text-xs font-medium mb-1 ${!isFocus ? "text-blue-400" : "text-zinc-500"}`}
        >
          Descanso
        </span>
        <span
          className={`text-3xl font-bold font-mono tracking-tight tabular-nums ${!isFocus ? "text-white" : "text-zinc-400"}`}
        >
          {formatTime(timeLeftBreak)}
        </span>
      </div>
    </div>
  );
}
