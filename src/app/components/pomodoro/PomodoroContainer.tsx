"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePomodoro, PomodoroPhase } from "../../hooks/usePomodoro";
import { usePictureInPicture } from "../../hooks/usePictureInPicture";
import { useWakeLock } from "../../hooks/useWakeLock";
import { useServiceWorkerUpdate } from "../../hooks/useServiceWorkerUpdate";
import { useProfiles } from "../../hooks/useProfiles";
import { formatTime, formatDurationHM, formatClockTime } from "../../utils/time";
import {
  playAlertSound,
  startAmbientSound,
  stopAmbientSound,
} from "../../utils/audio";
import { setFaviconColor } from "../../utils/favicon";
import { hasPersistedState } from "../../utils/storage";
import ModeSelector from "./ModeSelector";
import ProgressRing from "./ProgressRing";
import SessionBar from "./SessionBar";
import PhaseCard from "./PhaseCard";
import TimerControls from "./TimerControls";
import SettingsSheet from "./SettingsSheet";
import PipTimer from "./PipTimer";
import UpdateBanner from "./UpdateBanner";
import {
  VolumeIcon,
  VolumeOffIcon,
  PictureInPictureIcon,
  SettingsIcon,
} from "./icons";

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
  // onPhaseComplete necesita una identidad estable entre renders: si fuera un
  // arrow function inline, cambiaría en cada render y encadenaría (vía
  // handlePhaseCompletion/syncTimeLeft dentro del hook) un reinicio del efecto
  // principal del timer en cada tick, dejando el countdown congelado. Por eso
  // se guarda la preferencia en un ref y se expone un callback estable.
  const notificationsEnabledRef = useRef(true);
  const handlePhaseComplete = useCallback((completedPhase: PomodoroPhase) => {
    playAlertSound();
    if (notificationsEnabledRef.current) notifyPhaseComplete(completedPhase);
  }, []);

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
    endTime,
    autoStart,
    setAutoStart,
    ambientSoundEnabled,
    setAmbientSoundEnabled,
    ambientSoundType,
    setAmbientSoundType,
    notificationsEnabled,
    setNotificationsEnabled,
    wakeLockEnabled,
    setWakeLockEnabled,
    startTimer,
    pauseTimer,
    resetTimer,
    togglePhase,
    changeMode,
  } = usePomodoro({
    onPhaseComplete: handlePhaseComplete,
  });

  // Mantiene la pantalla encendida durante todo el ciclo (foco y descanso)
  // mientras el timer corra, si el usuario habilitó la opción.
  const { isSupported: isWakeLockSupported } = useWakeLock(
    wakeLockEnabled && isRunning,
  );

  const { updateAvailable, applyUpdate } = useServiceWorkerUpdate();
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    notificationsEnabledRef.current = notificationsEnabled;
  }, [notificationsEnabled]);

  const {
    isSupported: isPipSupported,
    pipWindow,
    openPip,
    closePip,
  } = usePictureInPicture();

  const {
    profiles,
    defaultProfileId,
    defaultProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    setAsDefault,
    reorderProfiles,
  } = useProfiles();

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Un atajo del manifest (mantener presionado el ícono / click derecho) llega
  // como ?profile=<id>&start=1. Si arrancó una sesión, esta ref se lo indica al
  // efecto de abajo, que espera a que focusTime/breakTime/sessions ya reflejen
  // el perfil elegido antes de resetear y arrancar (ver ese efecto).
  const pendingShortcutStartRef = useRef(false);

  // En la primerísima visita (sin estado de timer persistido todavía), cargamos
  // el perfil predeterminado en vez de los valores de fábrica (25/5/4). Un
  // atajo de manifest tiene prioridad sobre eso: el usuario ya eligió perfil
  // explícitamente al mantener presionado el ícono.
  const appliedInitialProfileRef = useRef(false);
  useEffect(() => {
    if (appliedInitialProfileRef.current) return;
    appliedInitialProfileRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const shortcutProfileId = params.get("profile");

    if (shortcutProfileId) {
      // Limpiamos la URL de inmediato para que un refresh no vuelva a aplicar
      // el atajo (y, sobre todo, no reinicie una sesión ya en curso).
      window.history.replaceState(null, "", window.location.pathname);

      const profile = profiles.find((p) => p.id === shortcutProfileId);
      if (profile) {
        setFocusTime(profile.focusTime);
        setBreakTime(profile.breakTime);
        setSessions(profile.sessions);
        if (params.get("start") === "1") pendingShortcutStartRef.current = true;
        return;
      }
      // Perfil del atajo no encontrado (por ejemplo, si el usuario lo borró):
      // seguimos con el flujo normal de perfil por defecto, como si no
      // hubiera habido atajo.
    }

    if (hasPersistedState() || !defaultProfile) return;

    setFocusTime(defaultProfile.focusTime);
    setBreakTime(defaultProfile.breakTime);
    setSessions(defaultProfile.sessions);
  }, [defaultProfile, profiles, setFocusTime, setBreakTime, setSessions]);

  // Arranca la sesión del atajo una vez que focusTime/breakTime/sessions ya
  // reflejan el perfil elegido. Ojo: en el montaje, React corre TODOS los
  // efectos una vez sin importar sus dependencias, así que este efecto y el
  // de arriba se ejecutan en el mismo flush inicial — si actuáramos en esa
  // primera pasada, resetTimer() capturaría el closure viejo (focusTime aún
  // en el valor por defecto, antes de que el setFocusTime del otro efecto se
  // refleje en un re-render). Por eso se ignora la primera ejecución y se
  // actúa recién en la siguiente, cuando focusTime/breakTime/sessions ya
  // cambiaron de verdad y resetTimer() quedó recreado con el closure fresco.
  const shortcutStartEffectRanRef = useRef(false);
  useEffect(() => {
    if (!shortcutStartEffectRanRef.current) {
      shortcutStartEffectRanRef.current = true;
      return;
    }
    if (!pendingShortcutStartRef.current) return;
    pendingShortcutStartRef.current = false;
    resetTimer();
    startTimer();
  }, [focusTime, breakTime, sessions, resetTimer, startTimer]);

  // Solicitamos permiso de notificaciones cuando el usuario las tiene habilitadas.
  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (!notificationsEnabled || Notification.permission !== "default") return;

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
  }, [notificationsEnabled]);

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
  const totalForPhase =
    currentPhase === "focus" ? initialFocusSeconds : initialBreakSeconds;
  const progress = totalForPhase > 0 ? (totalForPhase - timeLeft) / totalForPhase : 0;
  const phaseLabelCap = currentPhase === "focus" ? "Focus" : "Break";
  const endsAtLabel =
    isRunning && endTime ? formatClockTime(endTime) : null;

  // Título dinámico de la pestaña para ver el timer sin tenerla activa.
  useEffect(() => {
    if (!isRunning) {
      document.title = "Pomodoro";
      return;
    }
    document.title = `${formatTime(timeLeft)} - ${phaseLabelCap}`;
  }, [isRunning, timeLeft, phaseLabelCap]);

  // Favicon dinámico: rojo en foco, verde azulado en descanso, gris cuando está pausado.
  useEffect(() => {
    if (!isRunning) {
      setFaviconColor("#71717a"); // zinc-500
      return;
    }
    setFaviconColor(currentPhase === "focus" ? "#e24b4a" : "#5dcaa5");
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

  // Minutos restantes de todo el ciclo (no solo de la fase actual), solo tiene
  // sentido en modo clásico porque es el único que avanza de sesión solo.
  const remainingSessionsAfterCurrent = Math.max(0, sessions - currentSession);
  const secondsOfOtherPhaseThisSession =
    currentPhase === "focus" ? breakTime * 60 : 0;
  const totalRemainingSeconds =
    timeLeft +
    secondsOfOtherPhaseThisSession +
    remainingSessionsAfterCurrent * (focusTime + breakTime) * 60;
  const minutesLeftInCycle = Math.ceil(totalRemainingSeconds / 60);

  // Bloque total de tiempo (foco + break) configurado para el ciclo completo.
  const blockTotalMinutes = sessions * (focusTime + breakTime);

  // Posición sintética dentro de la barra de sesiones en modo flex: como no
  // hay avance de sesión automático, se deriva del progreso de la fase activa.
  const flexSyntheticSession = Math.min(
    sessions,
    Math.floor(progress * sessions) + 1,
  );

  const otherPhaseTimeLeft =
    currentPhase === "focus" ? timeLeftBreak : timeLeftFocus;
  const otherPhaseLabel = currentPhase === "focus" ? "break" : "focus";
  const otherColorKey = currentPhase === "focus" ? "break" : "focus";

  const flexEndsAtLabel =
    isRunning && endTime ? formatClockTime(endTime + otherPhaseTimeLeft * 1000) : null;

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-700 ${
        currentPhase === "focus" ? "bg-focus-wash" : "bg-break-wash"
      }`}
    >
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl p-[18px] min-h-[430px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-ink text-sm font-medium tracking-tight">
            Pomodoro
          </span>
          <div className="flex gap-0.5 text-muted text-base">
            <button
              onClick={() => setAmbientSoundEnabled(!ambientSoundEnabled)}
              title="Ambient sound"
              aria-pressed={ambientSoundEnabled}
              className={`w-[26px] h-[26px] rounded-md flex items-center justify-center transition-colors ${
                ambientSoundEnabled
                  ? "bg-break/[0.14] text-break"
                  : "text-muted hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              {ambientSoundEnabled ? (
                <VolumeIcon className="w-4 h-4" />
              ) : (
                <VolumeOffIcon className="w-4 h-4" />
              )}
            </button>

            {isPipSupported && (
              <button
                onClick={() => (pipWindow ? closePip() : openPip())}
                title="Always-on-top (Picture-in-Picture)"
                aria-pressed={Boolean(pipWindow)}
                className={`w-[26px] h-[26px] rounded-md flex items-center justify-center transition-colors ${
                  pipWindow
                    ? "bg-white/[0.06] text-ink"
                    : "text-muted hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <PictureInPictureIcon className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              aria-pressed={settingsOpen}
              className={`w-[26px] h-[26px] rounded-md flex items-center justify-center transition-colors ${
                settingsOpen
                  ? "bg-white/[0.06] text-ink"
                  : "text-muted hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selector de Modo */}
        <div className="mb-5">
          <ModeSelector
            activeMode={activeMode}
            onChange={changeMode}
            disabled={isRunning}
            isDirty={isDirty}
          />
        </div>

        {activeMode === "classic" ? (
          <>
            <div className="flex justify-center mb-3.5">
              <ProgressRing progress={progress} colorClass={currentPhase === "focus" ? "text-focus" : "text-break"}>
                <span
                  className={`text-[11px] lowercase tracking-wider ${
                    currentPhase === "focus" ? "text-focus" : "text-break"
                  }`}
                >
                  {currentPhase}
                </span>
                <span className="font-mono text-[38px] text-ink tracking-tight tabular-nums">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[11px] text-faint h-4">
                  {endsAtLabel ? `ends ${endsAtLabel}` : ""}
                </span>
              </ProgressRing>
            </div>

            <div className="mb-1.5">
              <SessionBar
                sessions={sessions}
                currentSession={currentSession}
                colorClass={currentPhase === "focus" ? "bg-focus" : "bg-break"}
              />
            </div>
            <div className="flex justify-between text-[11px] text-faint mb-auto">
              <span>
                Session {currentSession} of {sessions}
              </span>
              <span>{minutesLeftInCycle} min left</span>
            </div>
          </>
        ) : (
          <div className="mb-auto">
            <PhaseCard
              label={currentPhase}
              colorKey={currentPhase}
              timeLabel={formatTime(timeLeft)}
              variant="active"
              isRunning={isRunning}
              statText={`${Math.round(progress * 100)}% used`}
              progress={progress}
            />
            <PhaseCard
              label={otherPhaseLabel}
              colorKey={otherColorKey}
              timeLabel={formatTime(otherPhaseTimeLeft)}
              variant="banked"
            />

            <div className="flex justify-between text-[11px] text-faint mt-3.5 mb-1.5">
              <span>Block budget</span>
              <span>
                {sessions} × {focusTime}/{breakTime} ·{" "}
                {formatDurationHM(blockTotalMinutes)}
              </span>
            </div>
            <SessionBar
              sessions={sessions}
              currentSession={flexSyntheticSession}
              colorClass={currentPhase === "focus" ? "bg-focus" : "bg-break"}
            />
            <div className="flex justify-between text-[11px] text-faint mt-1.5 h-4">
              <span>{flexEndsAtLabel ? `ends ${flexEndsAtLabel}` : ""}</span>
            </div>
          </div>
        )}

        {/* Controles Operacionales */}
        <TimerControls
          isRunning={isRunning}
          activeMode={activeMode}
          currentPhase={currentPhase}
          onStartPause={isRunning ? pauseTimer : startTimer}
          onReset={resetTimer}
          onTogglePhase={togglePhase}
        />

        <div className="mt-3 text-[11px] text-subtle text-center">
          space {isRunning ? "pause" : "start"}
          {activeMode === "flex" ? " · t switch" : ""} · r reset
        </div>
      </div>

      <SettingsSheet
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        focusTime={focusTime}
        breakTime={breakTime}
        sessions={sessions}
        setFocusTime={setFocusTime}
        setBreakTime={setBreakTime}
        setSessions={setSessions}
        disabled={isRunning}
        autoStart={autoStart}
        setAutoStart={setAutoStart}
        ambientSoundEnabled={ambientSoundEnabled}
        setAmbientSoundEnabled={setAmbientSoundEnabled}
        ambientSoundType={ambientSoundType}
        setAmbientSoundType={setAmbientSoundType}
        notificationsEnabled={notificationsEnabled}
        setNotificationsEnabled={setNotificationsEnabled}
        wakeLockEnabled={wakeLockEnabled}
        setWakeLockEnabled={setWakeLockEnabled}
        isWakeLockSupported={isWakeLockSupported}
        profiles={profiles}
        defaultProfileId={defaultProfileId}
        addProfile={addProfile}
        updateProfile={updateProfile}
        deleteProfile={deleteProfile}
        setAsDefault={setAsDefault}
        reorderProfiles={reorderProfiles}
      />

      {pipWindow &&
        createPortal(
          <PipTimer
            phaseLabel={currentPhase}
            timeLabel={formatTime(timeLeft)}
            colorKey={currentPhase}
            isRunning={isRunning}
            activeMode={activeMode}
            progress={progress}
            onStartPause={isRunning ? pauseTimer : startTimer}
            onTogglePhase={togglePhase}
            pipWindow={pipWindow}
          />,
          pipWindow.document.body
        )}

      {updateAvailable && !updateDismissed && (
        <UpdateBanner onReload={applyUpdate} onDismiss={() => setUpdateDismissed(true)} />
      )}
    </div>
  );
}
