import { useState, useEffect, useRef, useCallback } from "react";
import { loadState, saveState } from "../utils/storage";
import type { AmbientSoundType } from "../utils/audio";

export type PomodoroMode = "classic" | "flex";
export type PomodoroPhase = "focus" | "break";

interface UsePomodoroProps {
  onPhaseComplete?: (completedPhase: PomodoroPhase) => void;
  onTick?: () => void;
}

const DEFAULT_FOCUS_TIME = 25;
const DEFAULT_BREAK_TIME = 5;
const DEFAULT_SESSIONS = 4;

export function usePomodoro({
  onPhaseComplete,
  onTick,
}: UsePomodoroProps = {}) {
  // Configuración de tiempos (en minutos). Se inicializan con los valores por
  // defecto (sin tocar localStorage) para que el primer render del cliente
  // coincida con el HTML del servidor; el estado persistido se aplica luego
  // en un efecto (ver más abajo), una vez montado en el navegador.
  const [focusTime, setFocusTime] = useState(DEFAULT_FOCUS_TIME);
  const [breakTime, setBreakTime] = useState(DEFAULT_BREAK_TIME);
  const [sessions, setSessions] = useState(DEFAULT_SESSIONS);

  // Control de ejecución
  const [activeMode, setActiveMode] = useState<PomodoroMode>("classic");
  const [currentPhase, setCurrentPhase] = useState<PomodoroPhase>("focus");
  const [isRunning, setIsRunning] = useState(false);
  const [currentSession, setCurrentSession] = useState(1);
  const [autoStart, setAutoStart] = useState(false);
  const [ambientSoundEnabled, setAmbientSoundEnabled] = useState(false);
  const [ambientSoundType, setAmbientSoundType] =
    useState<AmbientSoundType>("rain");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [wakeLockEnabled, setWakeLockEnabled] = useState(false);

  // Estados del temporizador (en segundos)
  const [timeLeftFocus, setTimeLeftFocus] = useState(
    DEFAULT_FOCUS_TIME * 60,
  );
  const [timeLeftBreak, setTimeLeftBreak] = useState(DEFAULT_BREAK_TIME * 60);

  // Referencias para el loop de alta precisión
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const endTimeRef = useRef<number | null>(null);

  // Espejo en estado de endTimeRef, solo para exponerlo a la UI (ej. "ends
  // 14:26"). Se actualiza desde syncTimeLeft/las acciones de usuario, nunca
  // directamente en el cuerpo de un efecto.
  const [endTime, setEndTime] = useState<number | null>(null);

  // Referencia para saber si el cronómetro ha sido alterado o iniciado. También
  // se considera "dirty" si alguna de las fases tenía un tiempo banked distinto
  // al de una sesión recién iniciada, para no perder ese progreso al montar
  // (ver los efectos de sincronización de inputs más abajo).
  const isDirtyRef = useRef(false);

  // Bloquea el efecto de persistencia hasta que el estado guardado (si lo
  // hay) se haya aplicado, para no pisar localStorage con los valores por
  // defecto antes de leerlo.
  const [hydrated, setHydrated] = useState(false);

  // Aplicamos el estado persistido en localStorage recién al montar en el
  // cliente, nunca durante el render inicial: leerlo de forma síncrona ahí
  // producía un mismatch de hidratación (SSR no tiene acceso a localStorage).
  useEffect(() => {
    const persisted = loadState();

    if (!persisted) {
      setHydrated(true);
      return;
    }

    // Si había una sesión corriendo y su tiempo ya expiró mientras la pestaña
    // estaba cerrada, no queremos reanudarla como si siguiera activa.
    const restoredEndTime =
      persisted.isRunning && persisted.endTime && persisted.endTime > Date.now()
        ? persisted.endTime
        : null;
    const restoredWasRunning = Boolean(
      persisted.isRunning && restoredEndTime !== null,
    );

    const nextFocusTime = persisted.focusTime ?? DEFAULT_FOCUS_TIME;
    const nextBreakTime = persisted.breakTime ?? DEFAULT_BREAK_TIME;
    const nextSessions = persisted.sessions ?? DEFAULT_SESSIONS;
    const nextActiveMode = persisted.activeMode ?? "classic";
    const nextCurrentPhase = persisted.currentPhase ?? "focus";
    const multiplier = nextActiveMode === "flex" ? nextSessions : 1;

    // Valor "banked" de cada fase: el que tenía guardado la última vez que se
    // persistió el estado, sin importar si esa fase estaba corriendo o no.
    // Esto es lo que le permite a la fase inactiva (ej. break mientras corre
    // focus en modo Flex) sobrevivir a un refresh en vez de reiniciarse.
    const bankedFocus = persisted.timeLeftFocus ?? nextFocusTime * 60 * multiplier;
    const bankedBreak = persisted.timeLeftBreak ?? nextBreakTime * 60 * multiplier;

    const nextTimeLeftFocus =
      restoredWasRunning && restoredEndTime && nextCurrentPhase === "focus"
        ? Math.max(0, Math.ceil((restoredEndTime - Date.now()) / 1000))
        : bankedFocus;
    const nextTimeLeftBreak =
      restoredWasRunning && restoredEndTime && nextCurrentPhase === "break"
        ? Math.max(0, Math.ceil((restoredEndTime - Date.now()) / 1000))
        : bankedBreak;

    setFocusTime(nextFocusTime);
    setBreakTime(nextBreakTime);
    setSessions(nextSessions);
    setActiveMode(nextActiveMode);
    setCurrentPhase(nextCurrentPhase);
    setIsRunning(restoredWasRunning);
    setCurrentSession(persisted.currentSession ?? 1);
    setAutoStart(persisted.autoStart ?? false);
    setAmbientSoundEnabled(persisted.ambientSoundEnabled ?? false);
    setAmbientSoundType(persisted.ambientSoundType ?? "rain");
    setNotificationsEnabled(persisted.notificationsEnabled ?? true);
    setWakeLockEnabled(persisted.wakeLockEnabled ?? false);
    setTimeLeftFocus(nextTimeLeftFocus);
    setTimeLeftBreak(nextTimeLeftBreak);
    endTimeRef.current = restoredEndTime;
    setEndTime(restoredWasRunning ? restoredEndTime : null);
    isDirtyRef.current =
      restoredWasRunning ||
      (persisted.currentSession ?? 1) > 1 ||
      nextTimeLeftFocus !== nextFocusTime * 60 * multiplier ||
      nextTimeLeftBreak !== nextBreakTime * 60 * multiplier;

    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        // En modo clásico el último focus no tiene break final (ej. 2×25/10 = 25+10+25)
        if (finishedPhase === "focus") {
          if (currentSession >= sessions) {
            // Ciclo completo: queda en focus 00:00 pausado hasta Reset
            isDirtyRef.current = false;
            return;
          }
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
    [activeMode, sessions, autoStart, onPhaseComplete, currentSession],
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

  const restoreSnapshot = useCallback(
    (snap: { timeLeftFocus: number; timeLeftBreak: number; currentSession: number; currentPhase: PomodoroPhase; isRunning: boolean }) => {
      setTimeLeftFocus(snap.timeLeftFocus);
      setTimeLeftBreak(snap.timeLeftBreak);
      setCurrentSession(snap.currentSession);
      setCurrentPhase(snap.currentPhase);
      setIsRunning(snap.isRunning);
      isDirtyRef.current = true;
      if (snap.isRunning) {
        endTimeRef.current = Date.now() + (snap.currentPhase === "focus" ? snap.timeLeftFocus : snap.timeLeftBreak) * 1000;
        setEndTime(endTimeRef.current);
      } else {
        endTimeRef.current = null;
        setEndTime(null);
      }
    },
    [],
  );

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
  // Se espera a `hydrated` para no pisar el localStorage con los valores por
  // defecto antes de haber aplicado el estado ya guardado (ver efecto de arriba).
  useEffect(() => {
    if (!hydrated) return;

    saveState({
      focusTime,
      breakTime,
      sessions,
      activeMode,
      currentPhase,
      currentSession,
      isRunning,
      endTime: isRunning ? endTime : null,
      timeLeftFocus,
      timeLeftBreak,
      autoStart,
      ambientSoundEnabled,
      ambientSoundType,
      notificationsEnabled,
      wakeLockEnabled,
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
    timeLeftFocus,
    timeLeftBreak,
    autoStart,
    ambientSoundEnabled,
    ambientSoundType,
    notificationsEnabled,
    wakeLockEnabled,
    hydrated,
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
    wakeLockEnabled,
    setWakeLockEnabled,
    startTimer,
    pauseTimer,
    resetTimer,
    restoreSnapshot,
    togglePhase,
    changeMode,
  };
}
