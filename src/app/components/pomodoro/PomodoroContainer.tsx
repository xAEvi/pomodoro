"use client";

import React from "react";
import { usePomodoro } from "../../hooks/usePomodoro";
import { formatTime } from "../../utils/time";
import { playAlertSound } from "../../utils/audio";
import ModeSelector from "./ModeSelector";
import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls";
import SettingsForm from "./SettingsForm";

export default function PomodoroContainer() {
  const {
    focusTime,
    breakTime,
    sessions,
    setFocusTime,
    setBreakTime,
    setSessions,
    timeLeftFocus,
    timeLeftBreak,
    currentPhase,
    activeMode,
    currentSession,
    isRunning,
    startTimer,
    pauseTimer,
    resetTimer,
    togglePhase,
    changeMode,
  } = usePomodoro({
    onPhaseComplete: (completedPhase) => {
      playAlertSound();
    },
  });

  // Cálculo de estado "dirty" para la confirmación de cambio de modo
  const multiplier = activeMode === "flex" ? sessions : 1;
  const initialFocusSeconds = focusTime * 60 * multiplier;
  const initialBreakSeconds = breakTime * 60 * multiplier;

  const isDirty =
    timeLeftFocus < initialFocusSeconds ||
    timeLeftBreak < initialBreakSeconds ||
    currentSession > 1;

  // Lógica de colores dinámicos para TODA la pantalla (Corregida)
  let bgClass = "bg-zinc-950";
  let textMutedClass = "text-zinc-500";

  if (activeMode === "classic") {
    if (!isRunning) {
      // Clásico Pausado -> Celeste oscuro
      bgClass = "bg-sky-950";
      textMutedClass = "text-sky-300/60";
    } else {
      // Clásico Corriendo
      if (currentPhase === "focus") {
        // En Foco -> Rojo oscuro
        bgClass = "bg-red-950";
        textMutedClass = "text-red-300/60";
      } else {
        // En Descanso (Break) activo -> Celeste oscuro
        bgClass = "bg-sky-950";
        textMutedClass = "text-sky-300/60";
      }
    }
  } else if (activeMode === "flex") {
    if (!isRunning) {
      // Flex Pausado -> Oscuro
      bgClass = "bg-zinc-950";
      textMutedClass = "text-zinc-500";
    } else if (currentPhase === "focus") {
      // Flex Corriendo en Foco -> Rojo oscuro
      bgClass = "bg-red-950";
      textMutedClass = "text-red-300/60";
    } else if (currentPhase === "break") {
      // Flex Corriendo en Break -> Celeste oscuro
      bgClass = "bg-sky-950";
      textMutedClass = "text-sky-300/60";
    }
  }

  return (
    // Este div ahora envuelve toda la pantalla y maneja la transición de fondo global
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-500 ease-in-out ${bgClass}`}
    >
      {/* Tarjeta interna del Pomodoro con efecto Glassmorphism */}
      <div className="w-full max-w-md p-6 bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-[32px] shadow-2xl flex flex-col gap-5 transition-all duration-500">
        {/* Header */}
        <div className="flex justify-between items-center px-1">
          <h1 className="text-lg font-semibold text-white">Pomodoro</h1>
          <span
            className={`text-xs font-mono transition-colors duration-500 ${textMutedClass}`}
          >
            Session {currentSession} of {sessions}
          </span>
        </div>

        {/* Selector de Modo */}
        <ModeSelector
          activeMode={activeMode}
          onChange={changeMode}
          disabled={isRunning}
          isDirty={isDirty}
        />

        {/* Visor del Tiempo */}
        <TimerDisplay
          mode={activeMode}
          phase={currentPhase}
          timeLeftFocus={timeLeftFocus}
          timeLeftBreak={timeLeftBreak}
          totalFocus={initialFocusSeconds}
          totalBreak={initialBreakSeconds}
          formatTime={formatTime}
        />

        {/* Controles Operacionales */}
        <TimerControls
          isRunning={isRunning}
          activeMode={activeMode}
          onStartPause={isRunning ? pauseTimer : startTimer}
          onReset={resetTimer}
          onTogglePhase={togglePhase}
        />

        {/* Formulario de Configuración */}
        <SettingsForm
          focusTime={focusTime}
          breakTime={breakTime}
          sessions={sessions}
          setFocusTime={setFocusTime}
          setBreakTime={setBreakTime}
          setSessions={setSessions}
          disabled={isRunning}
        />
      </div>
    </div>
  );
}
