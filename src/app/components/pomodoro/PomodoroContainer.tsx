"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePomodoro, PomodoroPhase } from "../../hooks/usePomodoro";
import { usePictureInPicture } from "../../hooks/usePictureInPicture";
import { useWakeLock } from "../../hooks/useWakeLock";
import { useServiceWorkerUpdate } from "../../hooks/useServiceWorkerUpdate";
import { useProfiles } from "../../hooks/useProfiles";
import {
  formatTime,
  formatDurationHM,
  formatClockTime,
  getClassicRemainingSeconds,
  getClassicTotalMinutes,
  getFlexTotalMinutes,
} from "../../utils/time";
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
import Onboarding from "./Onboarding";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";
import {
  VolumeIcon,
  VolumeOffIcon,
  PictureInPictureIcon,
  SettingsIcon,
  StarIcon,
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
    restoreSnapshot,
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
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [resetToast, setResetToast] = useState<string | null>(null);
  const resetSnapshotRef = useRef<{
    timeLeftFocus: number;
    timeLeftBreak: number;
    currentSession: number;
    currentPhase: PomodoroPhase;
    isRunning: boolean;
  } | null>(null);

  const activeProfile = profiles.find(
    (p) =>
      p.focusTime === focusTime &&
      p.breakTime === breakTime &&
      p.sessions === sessions,
  );
  const isDefaultActive = activeProfile
    ? activeProfile.id === defaultProfileId
    : false;
  const classicTotalMinutes = getClassicTotalMinutes(focusTime, breakTime, sessions);
  const flexTotalMinutes = getFlexTotalMinutes(focusTime, breakTime, sessions);

  // Un atajo del manifest (mantener presionado el ícono / click derecho) llega
  // como ?profile=<id>&start=1. Si arrancó una sesión, esta ref se lo indica al
  // efecto de abajo, que espera a que focusTime/breakTime/sessions ya reflejen
  // el perfil elegido antes de resetear y arrancar (ver ese efecto).
  const pendingShortcutStartRef = useRef(false);

  // Onboarding: solo en primera visita y si no fue descartado antes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = window.localStorage.getItem("pomodoro-onboarding-dismissed");
    if (dismissed) return;
    if (!hasPersistedState()) {
      setOnboardingOpen(true);
    }
  }, []);

  const dismissOnboarding = useCallback(() => {
    setOnboardingOpen(false);
    try {
      window.localStorage.setItem("pomodoro-onboarding-dismissed", "1");
    } catch {
      // ignore
    }
  }, []);

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

  const requestReset = useCallback(() => {
    if (!isDirty) {
      resetTimer();
      return;
    }
    resetSnapshotRef.current = {
      timeLeftFocus,
      timeLeftBreak,
      currentSession,
      currentPhase,
      isRunning,
    };
    setResetConfirmOpen(true);
  }, [isDirty, timeLeftFocus, timeLeftBreak, currentSession, currentPhase, isRunning, resetTimer]);

  const confirmReset = useCallback(() => {
    setResetConfirmOpen(false);
    resetTimer();
    setResetToast("Timer reset");
  }, [resetTimer]);

  const undoReset = useCallback(() => {
    const snap = resetSnapshotRef.current;
    if (!snap) return;
    restoreSnapshot(snap);
    resetSnapshotRef.current = null;
    setResetToast(null);
  }, [restoreSnapshot]);

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
        requestReset();
      } else if (event.key === "t" || event.key === "T") {
        if (activeMode === "flex") togglePhase();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, startTimer, pauseTimer, requestReset, togglePhase, activeMode]);

  // Minutos restantes de todo el ciclo (no solo de la fase actual), solo tiene
  // sentido en modo clásico porque es el único que avanza de sesión solo.
  // En clásico el último focus no tiene break final: N*focus + (N-1)*break.
  const totalRemainingSeconds =
    activeMode === "classic"
      ? getClassicRemainingSeconds(
          timeLeft,
          currentPhase,
          currentSession,
          focusTime,
          breakTime,
          sessions,
        )
      : timeLeftFocus + timeLeftBreak;
  const minutesLeftInCycle = Math.ceil(totalRemainingSeconds / 60);

  const flexBudgetProgress = (() => {
    const total = flexTotalMinutes * 60;
    const remaining = timeLeftFocus + timeLeftBreak;
    return total > 0 ? Math.min(1, Math.max(0, (total - remaining) / total)) : 0;
  })();

  const otherPhaseTimeLeft =
    currentPhase === "focus" ? timeLeftBreak : timeLeftFocus;
  const otherPhaseLabel = currentPhase === "focus" ? "break" : "focus";
  const otherColorKey = currentPhase === "focus" ? "break" : "focus";

  const flexEndsAtLabel =
    isRunning && endTime ? formatClockTime(endTime + otherPhaseTimeLeft * 1000) : null;

  const pipEndsAtLabel = activeMode === "flex" ? flexEndsAtLabel : endsAtLabel;

  // Atajos de teclado también en la ventana PiP (cuando está abierta)
  useEffect(() => {
    if (!pipWindow) return;

    const handlePipKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      if (event.key === " ") {
        event.preventDefault();
        if (isRunning) pauseTimer();
        else startTimer();
      } else if (event.key === "r" || event.key === "R") {
        requestReset();
      } else if (event.key === "t" || event.key === "T") {
        if (activeMode === "flex") togglePhase();
      } else if (event.key === "Escape") {
        closePip();
      }
    };

    pipWindow.addEventListener("keydown", handlePipKeyDown);
    return () => pipWindow.removeEventListener("keydown", handlePipKeyDown);
  }, [pipWindow, isRunning, startTimer, pauseTimer, requestReset, togglePhase, closePip, activeMode]);

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center p-4 transition-colors duration-700 ${
        currentPhase === "focus" ? "bg-focus-wash" : "bg-break-wash"
      }`}
    >
      <div className="w-full max-w-md bg-surface border border-line rounded-2xl p-[18px] min-h-[430px] flex flex-col">
        {/* Header — 32px hit targets, instrument tight */}
        <div className="flex items-center justify-between">
          <span className="text-ink text-sm font-medium tracking-tight">
            Pomodoro
          </span>
          <div className="flex gap-1.5 text-muted text-base">
            <button
              onClick={() => setAmbientSoundEnabled(!ambientSoundEnabled)}
              title={ambientSoundEnabled ? "Disable ambient sound (—)" : "Enable ambient sound (—)"}
              aria-label={ambientSoundEnabled ? "Disable ambient sound" : "Enable ambient sound"}
              aria-pressed={ambientSoundEnabled}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                ambientSoundEnabled
                  ? "bg-break/[0.14] text-break"
                  : "text-muted hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              {ambientSoundEnabled ? (
                <VolumeIcon className="w-4 h-4" aria-hidden="true" />
              ) : (
                <VolumeOffIcon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>

            {isPipSupported && (
              <button
                onClick={() => (pipWindow ? closePip() : openPip())}
                title="Always-on-top (Picture-in-Picture)"
                aria-label={pipWindow ? "Close always-on-top window" : "Open always-on-top window"}
                aria-pressed={Boolean(pipWindow)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                  pipWindow
                    ? "bg-white/[0.06] text-ink"
                    : "text-muted hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <PictureInPictureIcon className="w-4 h-4" aria-hidden="true" />
              </button>
            )}

            <button
              onClick={() => setOnboardingOpen(true)}
              title="How it works"
              aria-label="How it works"
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors text-muted hover:text-zinc-200 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface text-[12px] font-medium"
            >
              ?
            </button>

            <button
              onClick={() => setSettingsOpen(true)}
              title="Settings"
              aria-label="Open settings"
              aria-pressed={settingsOpen}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                settingsOpen
                  ? "bg-white/[0.06] text-ink"
                  : "text-muted hover:text-zinc-200 hover:bg-white/5"
              }`}
            >
              <SettingsIcon className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Mode — primary decision, generous separation */}
        <div className="mt-3 mb-3">
          <ModeSelector
            activeMode={activeMode}
            onChange={changeMode}
            disabled={isRunning}
            isDirty={isDirty}
            dirtyDetail={`${formatTime(timeLeft)} left in ${phaseLabelCap} · Session ${currentSession} of ${sessions}`}
          />
        </div>

        {/* Profile context — demoted to faint inline link, not second pill */}
        <div className="mb-3 flex items-center gap-1.5 text-[11px]">
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            aria-label="Open profile settings"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.02] border border-transparent hover:bg-white/[0.05] hover:border-line-soft px-2.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
          >
            {isDefaultActive && (
              <StarIcon filled className="w-3 h-3 text-focus shrink-0" aria-hidden="true" />
            )}
            <span className="text-muted font-medium truncate max-w-[110px]">
              {activeProfile?.name ?? "Custom"}
            </span>
            <span className="text-white/20">·</span>
            <span className="font-mono text-faint tabular-nums">
              {activeProfile
                ? `${activeProfile.focusTime}/${activeProfile.breakTime}`
                : `${focusTime}/${breakTime}`}{" "}
              · {activeProfile ? activeProfile.sessions : sessions}×
            </span>
          </button>
          <span className="text-[11px] text-faint tabular-nums">
            {activeMode === "classic"
              ? `C ${formatDurationHM(classicTotalMinutes)}`
              : `F ${formatDurationHM(flexTotalMinutes)}`}
          </span>
        </div>

        {activeMode === "classic" ? (
          <>
            <div className="flex justify-center mb-4">
              <ProgressRing progress={progress} colorClass={currentPhase === "focus" ? "text-focus" : "text-break"} isRunning={isRunning}>
                <span
                  className={`text-[11px] lowercase tracking-wider ${
                    currentPhase === "focus" ? "text-focus" : "text-break"
                  }`}
                >
                  {currentPhase}
                </span>
                <span className="font-mono text-[38px] text-ink tracking-tight tabular-nums motion-safe:transition-transform motion-safe:duration-200">
                  {formatTime(timeLeft)}
                </span>
                <span className="text-[11px] text-faint h-4">
                  {endsAtLabel ? `ends ${endsAtLabel}` : ""}
                </span>
              </ProgressRing>
            </div>

            {/* Tight group: bar + meta */}
            <div className="flex flex-col gap-1.5 mb-auto">
              <SessionBar
                sessions={sessions}
                currentSession={currentSession}
                colorClass={currentPhase === "focus" ? "bg-focus" : "bg-break"}
              />
              <div className="flex justify-between text-[11px] text-faint">
                <span>
                  Session {currentSession} of {sessions}
                </span>
                <span>{minutesLeftInCycle} min left</span>
              </div>
            </div>
          </>
        ) : (
          <div className="mb-auto flex flex-col gap-2">
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

            <div className="mt-1 flex flex-col gap-1.5">
              <SessionBar
                variant="budget"
                sessions={sessions}
                currentSession={1}
                budgetProgress={flexBudgetProgress}
                budgetLabel={`Budget ${Math.round(flexBudgetProgress * 100)}% used`}
                colorClass={currentPhase === "focus" ? "bg-focus" : "bg-break"}
              />
              <div className="flex justify-between text-[11px] text-faint">
                <span className="hidden sm:inline">Flex · you control — switch with T</span>
                <span className="sm:hidden">Budget</span>
                <span className="tabular-nums">F {formatDurationHM(flexTotalMinutes)} · {minutesLeftInCycle} min left</span>
              </div>
              <div className="text-[11px] text-faint h-4">
                {flexEndsAtLabel ? `ends ${flexEndsAtLabel}` : ""}
              </div>
            </div>
          </div>
        )}

        {/* Controles Operacionales */}
        <TimerControls
          isRunning={isRunning}
          activeMode={activeMode}
          currentPhase={currentPhase}
          onStartPause={isRunning ? pauseTimer : startTimer}
          onReset={requestReset}
          onTogglePhase={togglePhase}
        />

        <div role="note" aria-label="Keyboard shortcuts" className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] tracking-wide text-muted text-center">
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded bg-white/[0.08] border border-white/[0.08] px-1.5 py-1 font-mono text-[10px] leading-none text-ink">space</kbd>
            <span>{isRunning ? "pause" : "start"}</span>
          </span>
          {activeMode === "flex" && (
            <>
              <span className="text-white/20">·</span>
              <span className="inline-flex items-center gap-1">
                <kbd className="rounded bg-white/[0.08] border border-white/[0.08] px-1.5 py-1 font-mono text-[10px] leading-none text-ink">T</kbd>
                <span>switch</span>
              </span>
            </>
          )}
          <span className="text-white/20">·</span>
          <span className="inline-flex items-center gap-1">
            <kbd className="rounded bg-white/[0.08] border border-white/[0.08] px-1.5 py-1 font-mono text-[10px] leading-none text-ink">R</kbd>
            <span>reset</span>
          </span>
        </div>
      </div>

      <ConfirmModal
        open={resetConfirmOpen}
        title="Reset timer?"
        message={
          isDirty
            ? `Reset this session? ${formatTime(timeLeft)} left in ${phaseLabelCap} · Session ${currentSession} of ${sessions} will be lost.`
            : "Reset the timer?"
        }
        confirmLabel="Reset"
        cancelLabel="Keep"
        danger
        onConfirm={confirmReset}
        onCancel={() => setResetConfirmOpen(false)}
      />

      {resetToast && (
        <Toast message={resetToast} onDismiss={() => setResetToast(null)} actionLabel="Undo" onAction={undoReset} duration={5000} />
      )}

      <Onboarding open={onboardingOpen} onDismiss={dismissOnboarding} />

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
            endsAtLabel={pipEndsAtLabel}
            onStartPause={isRunning ? pauseTimer : startTimer}
            onTogglePhase={togglePhase}
            onReset={requestReset}
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
