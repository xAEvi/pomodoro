"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { usePomodoro, PomodoroPhase } from "../../hooks/usePomodoro";
import { usePictureInPicture } from "../../hooks/usePictureInPicture";
import { formatTime } from "../../utils/time";
import {
  playAlertSound,
  startAmbientSound,
  stopAmbientSound,
} from "../../utils/audio";
import { setFaviconColor } from "../../utils/favicon";
import ModeSelector from "./ModeSelector";
import TimerDisplay from "./TimerDisplay";
import TimerControls from "./TimerControls";
import SettingsForm from "./SettingsForm";
import AmbientSoundToggle from "./AmbientSoundToggle";
import PipTimer from "./PipTimer";

function notifyPhaseComplete(completedPhase: PomodoroPhase) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  const title =
    completedPhase === "focus" ? "Focus session complete" : "Break complete";
  const body =
    completedPhase === "focus"
      ? "Time for a break."
      : "Time to get back to focus.";
  new Notification(title, { body });
}

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
    autoStart,
    setAutoStart,
    ambientSoundEnabled,
    setAmbientSoundEnabled,
    ambientSoundType,
    setAmbientSoundType,
    startTimer,
    pauseTimer,
    resetTimer,
    togglePhase,
    changeMode,
  } = usePomodoro({
    onPhaseComplete: (completedPhase) => {
      playAlertSound();
      notifyPhaseComplete(completedPhase);
    },
  });

  const {
    isSupported: isPipSupported,
    pipWindow,
    openPip,
    closePip,
  } = usePictureInPicture();

  // Solicitamos permiso de notificaciones una sola vez al montar.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission !== "default") return;

    try {
      // Safari viejo soporta solo la API basada en callback (sin Promise);
      // pasar un callback vacío la deja funcionar en ambos casos.
      const result = Notification.requestPermission(() => {});
      result?.catch?.(() => {
        // Denegado o interrumpido por el usuario; las notificaciones simplemente no se mostrarán.
      });
    } catch {
      // Notification.requestPermission no disponible o bloqueado; se ignora en silencio.
    }
  }, []);

  // Sonido ambiental: solo suena mientras el timer corre en fase de foco.
  useEffect(() => {
    if (ambientSoundEnabled && isRunning && currentPhase === "focus") {
      startAmbientSound(ambientSoundType);
    } else {
      stopAmbientSound();
    }
  }, [ambientSoundEnabled, ambientSoundType, isRunning, currentPhase]);

  // Nos aseguramos de detener el sonido ambiental si el componente se desmonta.
  useEffect(() => {
    return () => stopAmbientSound();
  }, []);

  // Cálculo de estado "dirty" para la confirmación de cambio de modo
  const multiplier = activeMode === "flex" ? sessions : 1;
  const initialFocusSeconds = focusTime * 60 * multiplier;
  const initialBreakSeconds = breakTime * 60 * multiplier;

  const isDirty =
    timeLeftFocus < initialFocusSeconds ||
    timeLeftBreak < initialBreakSeconds ||
    currentSession > 1;

  const timeLeft = currentPhase === "focus" ? timeLeftFocus : timeLeftBreak;
  const phaseLabel = currentPhase === "focus" ? "Focus" : "Break";

  // Título dinámico de la pestaña para ver el timer sin tenerla activa.
  useEffect(() => {
    if (!isRunning) {
      document.title = "Pomodoro";
      return;
    }
    document.title = `${formatTime(timeLeft)} - ${phaseLabel}`;
  }, [isRunning, timeLeft, phaseLabel]);

  // Favicon dinámico: rojo en foco, celeste en descanso, gris cuando está pausado.
  useEffect(() => {
    if (!isRunning) {
      setFaviconColor("#71717a"); // zinc-500
      return;
    }
    setFaviconColor(currentPhase === "focus" ? "#ef4444" : "#38bdf8"); // red-500 / sky-500
  }, [isRunning, currentPhase]);

  // Atajos de teclado: Space (play/pause), R (reset), T (alternar fase en modo Flex).
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (event.key === " ") {
        event.preventDefault();
        if (isRunning) {
          pauseTimer();
        } else {
          startTimer();
        }
      } else if (event.key === "r" || event.key === "R") {
        resetTimer();
      } else if (event.key === "t" || event.key === "T") {
        togglePhase();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, startTimer, pauseTimer, resetTimer, togglePhase]);

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
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-white">Pomodoro</h1>
            {isPipSupported && (
              <button
                onClick={() => (pipWindow ? closePip() : openPip())}
                title="Modo siempre visible (Picture-in-Picture)"
                aria-pressed={Boolean(pipWindow)}
                className={`p-1.5 rounded-lg transition-colors ${
                  pipWindow
                    ? "text-white bg-zinc-800"
                    : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <rect x="12" y="12" width="8" height="6" rx="1" fill="currentColor" />
                </svg>
              </button>
            )}
          </div>
          <span
            className={`text-xs font-mono transition-colors duration-500 ${textMutedClass}`}
          >
            Session {currentSession} of {sessions}
          </span>
        </div>

        {/* Progreso de sesiones */}
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: sessions }, (_, index) => {
            const isCompleted = index < currentSession - 1;
            const isCurrent = index === currentSession - 1;
            let dotClass = "bg-zinc-700";
            if (isCompleted) {
              dotClass = "bg-white";
            } else if (isCurrent) {
              dotClass = currentPhase === "focus" ? "bg-red-400" : "bg-sky-400";
            }
            return (
              <span
                key={index}
                className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${dotClass}`}
              />
            );
          })}
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
          activeMode={activeMode}
          autoStart={autoStart}
          setAutoStart={setAutoStart}
        />

        {/* Sonido ambiental: se deja fuera del formulario disabled para poder
            activarlo/desactivarlo también mientras el timer está corriendo. */}
        <AmbientSoundToggle
          enabled={ambientSoundEnabled}
          type={ambientSoundType}
          onToggle={setAmbientSoundEnabled}
          onTypeChange={setAmbientSoundType}
        />
      </div>

      {pipWindow &&
        createPortal(
          <PipTimer
            phaseLabel={phaseLabel}
            timeLabel={formatTime(timeLeft)}
            bgClass={currentPhase === "focus" ? "bg-red-950" : "bg-sky-950"}
            isRunning={isRunning}
            activeMode={activeMode}
            onStartPause={isRunning ? pauseTimer : startTimer}
            onTogglePhase={togglePhase}
          />,
          pipWindow.document.body
        )}
    </div>
  );
}
