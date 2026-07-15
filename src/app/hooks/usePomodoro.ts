import { useState, useEffect, useRef, useCallback } from "react";

export type PomodoroMode = "classic" | "flex";
export type PomodoroPhase = "focus" | "break";

interface UsePomodoroProps {
  onPhaseComplete?: (completedPhase: PomodoroPhase) => void;
  onTick?: () => void;
}

export function usePomodoro({
  onPhaseComplete,
  onTick,
}: UsePomodoroProps = {}) {
  // Configuración de tiempos (en minutos)
  const [focusTime, setFocusTime] = useState(25);
  const [breakTime, setBreakTime] = useState(5);
  const [sessions, setSessions] = useState(4);

  // Estados del temporizador (en segundos)
  const [timeLeftFocus, setTimeLeftFocus] = useState(25 * 60);
  const [timeLeftBreak, setTimeLeftBreak] = useState(5 * 60);

  // Control de ejecución
  const [activeMode, setActiveMode] = useState<PomodoroMode>("classic");
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);

  // Referencias para el loop de alta precisión
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Referencia para saber si el cronómetro ha sido alterado o iniciado
  const isDirtyRef = useRef(false);

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
      }
      // En modo Flex no se hace nada automático al terminar; el usuario controla el flujo.
    },
    [activeMode, sessions, onPhaseComplete],
  );

  // Loop principal del temporizador de alta precisión
  useEffect(() => {
    if (isRunning) {
      isDirtyRef.current = true; // El temporizador ya está en uso, bloqueamos reescrituras de inputs

      // 1. Definir el punto de finalización absoluto en el futuro (en ms)
      const secondsToCount =
        currentPhase === "focus" ? timeLeftFocus : timeLeftBreak;
      endTimeRef.current = Date.now() + secondsToCount * 1000;

      intervalRef.current = setInterval(() => {
        if (!endTimeRef.current) return;

        // 2. Calcular los segundos restantes reales
        const msRemaining = endTimeRef.current - Date.now();
        const secondsRemaining = Math.max(0, Math.ceil(msRemaining / 1000));

        onTick?.();

        // 3. Actualizar la fase correspondiente
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
      }, 200);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [
    isRunning,
    currentPhase,
    timeLeftFocus,
    timeLeftBreak,
    handlePhaseCompletion,
    onTick,
  ]);

  // Controladores de acciones (Actions)

  const startTimer = useCallback(() => {
    setIsRunning(true);
  }, []);

  const pauseTimer = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null; // Limpiamos la referencia para que se recalcule al reanudar
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
    },
    [focusTime, breakTime, sessions],
  );

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
    startTimer,
    pauseTimer,
    resetTimer,
    togglePhase,
    changeMode,
  };
}
