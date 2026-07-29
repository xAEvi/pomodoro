import { useState, useEffect, useRef, useCallback } from "react";
import { loadState, saveState } from "../utils/storage";
import type { AmbientSoundType } from "../utils/audio";

export type PomodoroMode = "classic" | "flex";
export type PomodoroPhase = "focus" | "break";

interface UsePomodoroProps {
  onPhaseComplete?: (completedPhase: PomodoroPhase) => void;
  onTick?: () => void;
}

// Se calcula una sola vez al cargar el módulo, antes de que se inicialicen los estados.
const persisted = loadState();

// Si había una sesión corriendo y su tiempo ya expiró mientras la pestaña estaba cerrada,
// no queremos reanudarla como si siguiera activa.
const restoredEndTime =
  persisted?.isRunning && persisted.endTime && persisted.endTime > Date.now()
    ? persisted.endTime
    : null;
const restoredWasRunning = persisted?.isRunning && restoredEndTime !== null;

function restoredTimeLeft(phase: PomodoroPhase, fallback: number): number {
  if (
    !restoredWasRunning ||
    !restoredEndTime ||
    persisted?.currentPhase !== phase
  ) {
    return fallback;
  }
  return Math.max(0, Math.ceil((restoredEndTime - Date.now()) / 1000));
}

export function usePomodoro({
  onPhaseComplete,
  onTick,
}: UsePomodoroProps = {}) {
  // Configuración de tiempos (en minutos)
  const [focusTime, setFocusTime] = useState(persisted?.focusTime ?? 25);
  const [breakTime, setBreakTime] = useState(persisted?.breakTime ?? 5);
  const [sessions, setSessions] = useState(persisted?.sessions ?? 4);

  // Control de ejecución
  const [activeMode, setActiveMode] = useState<PomodoroMode>(
    persisted?.activeMode ?? "classic",
  );
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>(
    persisted?.currentPhase ?? "focus",
  );
  const [isRunning, setIsRunning] = useState(restoredWasRunning ?? false);
  const [currentSession, setCurrentSession] = useState(
    persisted?.currentSession ?? 1,
  );
  const [autoStart, setAutoStart] = useState(persisted?.autoStart ?? false);
  const [ambientSoundEnabled, setAmbientSoundEnabled] = useState(
    persisted?.ambientSoundEnabled ?? false,
  );
  const [ambientSoundType, setAmbientSoundType] = useState<AmbientSoundType>(
    persisted?.ambientSoundType ?? "rain",
  );
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    persisted?.notificationsEnabled ?? true,
  );

  // Estados del temporizador (en segundos)
  const multiplierInit = activeMode === "flex" ? sessions : 1;
  const [timeLeftFocus, setTimeLeftFocus] = useState(
    restoredTimeLeft("focus", focusTime * 60 * multiplierInit),
  );
  const [timeLeftBreak, setTimeLeftBreak] = useState(
    restoredTimeLeft("break", breakTime * 60 * multiplierInit),
  );

  // Referencias para el loop de alta precisión
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(restoredEndTime);

  // Espejo en estado de endTimeRef, solo para exponerlo a la UI (ej. "ends
  // 14:26"). Se actualiza desde syncTimeLeft/las acciones de usuario, nunca
  // directamente en el cuerpo de un efecto.
  const [endTime, setEndTime] = useState<number | null>(
    restoredWasRunning ? restoredEndTime : null,
  );

  // Referencia para saber si el cronómetro ha sido alterado o iniciado
  const isDirtyRef = useRef(restoredWasRunning || (persisted?.currentSession ?? 1) > 1);

  /**
   * Sincronizar cambios de configuración de inputs.
   */
  useEffect(() => {
    if (!isRunning && !isDirtyRef.current) {
      const multiplier = activeMode === "flex" ? sessions : 1;
      setTimeLeftFocus(focusTime * 60 * multiplier);
    }
  }, [focusTime, sessions, activeMode, isRunning]);

  useEffect(() => {
    if (!isRunning && !isDirtyRef.current) {
      const multiplier = activeMode === "flex" ? sessions : 1;
      setTimeLeftBreak(breakTime * 60 * multiplier);
    }
  }, [breakTime, sessions, activeMode, isRunning]);

  // Manejador del término de una fase
  const handlePhaseCompletion = useCallback(
    (finishedPhase: PomodoroPhase) => {
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      endTimeRef.current = null;
      setEndTime(null);

      onPhaseComplete?.(finishedPhase);

      if (activeMode === "classic") {
        // En modo clásico alternamos de fase automáticamente
        if (finishedPhase === "focus") {
          setCurrentPhase("break");
        } else {
          setCurrentPhase("focus");
          setCurrentSession((prev) => Math.min(prev + 1, sessions));
        }
        // Al alternar automáticamente, la nueva fase arranca desde su valor por defecto limpio
        isDirtyRef.current = false;

        // Si el auto-start está activo, continuamos sin esperar a que el usuario pulse Start
        if (autoStart) {
          setIsRunning(true);
        }
      }
      // En modo Flex no se hace nada automático al terminar; el usuario controla el flujo.
    },
    [activeMode, sessions, autoStart, onPhaseComplete],
  );

  // Recalcula los segundos restantes contra el punto de finalización absoluto
  // (endTimeRef). La usan tanto el tick del setInterval como el listener de
  // visibilitychange, de forma que al volver de una pestaña en background el
  // tiempo se corrige al instante en vez de esperar al próximo tick, que el
  // navegador puede haber demorado por sus políticas de throttling.
  const syncTimeLeft = useCallback(() => {
    if (!endTimeRef.current) return;

    setEndTime(endTimeRef.current);

    const msRemaining = endTimeRef.current - Date.now();
    const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));

    if (currentPhase === "focus") {
      setTimeLeftFocus(secondsRemaining);
      if (secondsRemaining <= 0) {
        handlePhaseCompletion("focus");
      }
    } else {
      setTimeLeftBreak(secondsRemaining);
      if (secondsRemaining <= 0) {
        handlePhaseCompletion("break");
      }
    }
  }, [currentPhase, handlePhaseCompletion]);

  // Loop principal del temporizador de alta precisión
  useEffect(() => {
    if (isRunning) {
      isDirtyRef.current = true; // El temporizador ya está en uso, bloqueamos reescrituras de inputs

      // Definir el punto de finalización absoluto en el futuro (en ms)
      const secondsToCount =
        currentPhase === "focus" ? timeLeftFocus : timeLeftBreak;
      endTimeRef.current = Date.now() + secondsToCount * 1000;

      intervalRef.current = setInterval(() => {
        onTick?.();
        syncTimeLeft();
      }, 200);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, currentPhase, timeLeftFocus, timeLeftBreak, syncTimeLeft, onTick]);

  // Al volver a foco la pestaña, recalculamos de inmediato en vez de esperar al
  // próximo tick del interval, que pudo haber sido pausado/limitado mientras
  // la pestaña estaba en background.
  useEffect(() => {
    if (typeof document === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && isRunning) {
        syncTimeLeft();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isRunning, syncTimeLeft]);

  // Controladores de acciones (Actions)

  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null; // Limpiamos la referencia para que se recalcule al reanudar
    setEndTime(null);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    isDirtyRef.current = false; // Permitimos que los inputs vuelvan a actualizar el estado del timer
    setCurrentPhase("focus");
    setCurrentSession(1);

    const multiplier = activeMode === "flex" ? sessions : 1;
    setTimeLeftFocus(focusTime * 60 * multiplier);
    setTimeLeftBreak(breakTime * 60 * multiplier);
    endTimeRef.current = null;
    setEndTime(null);
  }, [focusTime, breakTime, sessions, activeMode]);

  const togglePhase = useCallback(() => {
    // Solo permitimos alternar manualmente en modo Flexible
    if (activeMode !== "flex") return;

    setCurrentPhase((prev) => (prev === "focus" ? "break" : "focus"));
  }, [activeMode]);

  const changeMode = useCallback(
    (mode: PomodoroMode) => {
      setActiveMode(mode);
      // Forzamos el reset utilizando los parámetros locales actualizados para evitar desincronizaciones de estado inmediatas
      setIsRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      isDirtyRef.current = false;
      setCurrentPhase("focus");
      setCurrentSession(1);

      const multiplier = mode === "flex" ? sessions : 1;
      setTimeLeftFocus(focusTime * 60 * multiplier);
      setTimeLeftBreak(breakTime * 60 * multiplier);
      endTimeRef.current = null;
      setEndTime(null);
    },
    [focusTime, breakTime, sessions],
  );

  // Persistimos configuración y sesión en curso para sobrevivir a un refresh.
  useEffect(() => {
    saveState({
      focusTime,
      breakTime,
      sessions,
      activeMode,
      currentPhase,
      currentSession,
      isRunning,
      endTime: isRunning ? endTime : null,
      autoStart,
      ambientSoundEnabled,
      ambientSoundType,
      notificationsEnabled,
    });
  }, [
    focusTime,
    breakTime,
    sessions,
    activeMode,
    currentPhase,
    currentSession,
    isRunning,
    endTime,
    autoStart,
    ambientSoundEnabled,
    ambientSoundType,
    notificationsEnabled,
  ]);

  return {
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
    startTimer,
    pauseTimer,
    resetTimer,
    togglePhase,
    changeMode,
  };
}
