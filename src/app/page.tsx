"use client"; // 👈 Indica a NextJS que este es un Componente de Cliente (usa interactividad)

import { useEffect, useState } from "react";

export default function Home() {
  // 1. Estados de control y modos 🎛️
  const [activeMode, setActiveMode] = useState<"classic" | "flex">("classic");
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<"focus" | "break">("focus");

  // 2. Estados de configuración (en minutos) ⚙️
  const [focusTime, setFocusTime] = useState<number>(25);
  const [breakTime, setBreakTime] = useState<number>(5);
  const [autoStartBreak, setAutoStartBreak] = useState<boolean>(false);

  // 3. Dos estados de tiempo independientes (en segundos) ⏱️
  const [timeLeftFocus, setTimeLeftFocus] = useState<number>(25 * 60);
  const [timeLeftBreak, setTimeLeftBreak] = useState<number>(5 * 60);

  const classicTimeToShow =
    currentPhase === "focus" ? timeLeftFocus : timeLeftBreak;

  const [sessions, setSessions] = useState<number>(1);

  // --- Funciones de Sonido Integradas (Web Audio API) 🔊 ---
  const playClickSound = () => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, ctx.currentTime); // Tono medio
      osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.1); // Caída rápida para simular un "pop"

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (e) {
      console.error("Error reproduciendo sonido de click:", e);
    }
  };

  const playAlertSound = () => {
    if (typeof window === "undefined") return;
    try {
      const ctx = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();

      // Primer tono (agudo)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "triangle";
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // Nota C5
      gain1.gain.setValueAtTime(0.15, ctx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start();
      osc1.stop(ctx.currentTime + 0.4);

      // Segundo tono (un poco más agudo, desfasado)
      setTimeout(() => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(659.25, ctx.currentTime); // Nota E5
        gain2.gain.setValueAtTime(0.15, ctx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start();
        osc2.stop(ctx.currentTime + 0.5);
      }, 200);
    } catch (e) {
      console.error("Error reproduciendo sonido de alerta:", e);
    }
  };

  // Wrapper para interactividad que hace sonar el click
  const handleInteractiveClick = (action: () => void) => {
    playClickSound();
    action();
  };

  // 4. Sincronizar los relojes cuando el temporizador esté pausado y cambien los inputs 🔄
  useEffect(() => {
    if (!isRunning) {
      if (activeMode === "flex") {
        setTimeLeftFocus(focusTime * sessions * 60);
        setTimeLeftBreak(breakTime * sessions * 60);
      } else {
        setTimeLeftFocus(focusTime * 60);
        setTimeLeftBreak(breakTime * 60);
      }
    }
  }, [focusTime, breakTime, sessions, activeMode, isRunning]);

  // 5. Efecto principal del cronómetro para ambos modos ⏳
  useEffect(() => {
    let interval: any = null;

    if (isRunning) {
      // Caso A: Descontar de la fase de Enfoque
      if (currentPhase === "focus" && timeLeftFocus > 0) {
        interval = setInterval(() => {
          setTimeLeftFocus((prev) => prev - 1);
        }, 1000);
      }
      // Caso B: Descontar de la fase de Descanso
      else if (currentPhase === "break" && timeLeftBreak > 0) {
        interval = setInterval(() => {
          setTimeLeftBreak((prev) => prev - 1);
        }, 1000);
      }
      // Caso C: El tiempo del reloj activo llegó a cero ⏱️
      else {
        playAlertSound(); // 🚨 Alarma al terminar la fase
        if (activeMode === "classic") {
          // Lógica Classic: Transición automática/semiautomática secuencial
          if (currentPhase === "focus") {
            setCurrentPhase("break");
            setIsRunning(autoStartBreak);
            alert("¡Tiempo de enfoque terminado! Hora de un descanso. ☕");
          } else {
            setCurrentPhase("focus");
            setIsRunning(false);
            alert("¡Descanso terminado! ¿Listo para volver a trabajar? 💪");
          }
        } else {
          // Lógica Flex: Se detiene el reloj que llegó a cero y se pausa
          setIsRunning(false);
          alert(
            `El tiempo de ${currentPhase === "focus" ? "enfoque" : "descanso"} ha llegado a su fin. 🚨`,
          );
        }
      }
    }

    return () => clearInterval(interval);
  }, [
    isRunning,
    currentPhase,
    timeLeftFocus,
    timeLeftBreak,
    activeMode,
    autoStartBreak,
  ]);

  // 6. Cambiar de modo con advertencia de seguridad 🚨
  const handleModeChange = (newMode: "classic" | "flex") => {
    if (newMode === activeMode) return;

    if (isRunning) {
      const confirmChange = window.confirm(
        "Tienes un temporizador activo. Si cambias de modo perderás el progreso actual. ¿Deseas continuar?",
      );
      if (!confirmChange) return;
    }

    // Reiniciamos y cambiamos de modo
    setIsRunning(false);
    setCurrentPhase("focus");
    setTimeLeftFocus(focusTime * 60);
    setTimeLeftBreak(breakTime * 60);
    setActiveMode(newMode);
  };

  // 7. Alternar manualmente de fase (Util para el Modo Flex) 🔄
  const togglePhase = () => {
    setCurrentPhase((prev) => (prev === "focus" ? "break" : "focus"));
  };

  // --- 8. Función para restablecer el temporizador (Reset actualizado) ---
  const handleReset = () => {
    setIsRunning(false);
    setCurrentPhase("focus");
    if (activeMode === "flex") {
      setTimeLeftFocus(focusTime * sessions * 60);
      setTimeLeftBreak(breakTime * sessions * 60);
    } else {
      setTimeLeftFocus(focusTime * 60);
      setTimeLeftBreak(breakTime * 60);
    }
  };

  // 9. Formateador de segundos a formato MM:SS ⏰
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formattedMins = String(mins).padStart(2, "0");
    const formattedSecs = String(secs).padStart(2, "0");
    return `${formattedMins}:${formattedSecs}`;
  };

  // --- 10. Determinación dinámica de la clase de fondo según las reglas indicadas 🎨 ---
  const getBackgroundClass = () => {
    if (activeMode === "classic") {
      return !isRunning
        ? "bg-red-500/20 border-red-700/30"
        : "bg-yellow-950 border-zinc-900/50";
    } else {
      return currentPhase === "focus"
        ? "bg-yellow-950 border-zinc-900/50"
        : "bg-green-500/20 border-red-800/30";
    }
  };

  return (
    <div
      className={`flex min-h-screen flex-col items-center justify-center p-6 text-zinc-100 font-sans transition-colors duration-500 ${getBackgroundClass()}`}
    >
      {/* Contenedor Principal */}
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/50 p-8 shadow-2xl backdrop-blur-md">
        {/* Selector de Modos */}
        <div className="mb-8 flex rounded-xl bg-zinc-950 p-1">
          <button
            onClick={() =>
              handleInteractiveClick(() => handleModeChange("classic"))
            }
            className={`w-full rounded-lg py-2 text-sm font-medium transition-all ${
              activeMode === "classic"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Modo Classic
          </button>
          <button
            onClick={() =>
              handleInteractiveClick(() => handleModeChange("flex"))
            }
            className={`w-full rounded-lg py-2 text-sm font-medium transition-all ${
              activeMode === "flex"
                ? "bg-zinc-800 text-white shadow-sm"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Modo Flex
          </button>
        </div>

        {/* --- CONTENIDO DEL MODO CLASSIC --- */}
        {activeMode === "classic" && (
          <div className="flex flex-col items-center">
            {/* Indicador de Fase Activa (Enfoque / Descanso) */}
            <span
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                currentPhase === "focus"
                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {currentPhase === "focus"
                ? "Sesión de Enfoque 🎯"
                : "Tiempo de Descanso ☕"}
            </span>

            {/* Reloj Principal Gigante */}
            <div className="my-10 select-none text-center">
              <h1 className="text-8xl font-light tabular-nums tracking-tighter">
                {formatTime(classicTimeToShow)}
              </h1>
            </div>

            {/* Panel de Controles (Play/Pause, Reset) */}
            <div className="flex items-center gap-4">
              <button
                onClick={() =>
                  handleInteractiveClick(() => setIsRunning(!isRunning))
                }
                className={`flex h-16 w-36 items-center justify-center rounded-2xl text-base font-semibold shadow-lg transition-all active:scale-95 ${
                  isRunning
                    ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                    : currentPhase === "focus"
                      ? "bg-amber-500 hover:bg-amber-400 text-black"
                      : "bg-emerald-500 hover:bg-emerald-400 text-black"
                }`}
              >
                {isRunning ? (
                  <span className="flex items-center gap-2">
                    {/* Icono de Pausa */}
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                    </svg>
                    Pausa
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    {/* Icono de Play */}
                    <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    Iniciar
                  </span>
                )}
              </button>

              <button
                onClick={() => handleInteractiveClick(handleReset)}
                title="Reiniciar temporizador"
                className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 active:scale-95 transition-all"
              >
                {/* Icono de Reset */}
                <svg
                  className="h-6 w-6 stroke-current fill-none"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                  />
                </svg>
              </button>
            </div>

            {/* Ajustes Rápidos e Inputs */}
            <div className="mt-8 w-full border-t border-zinc-800/60 pt-6">
              <h3 className="mb-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Configuración inicial
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Enfoque (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isRunning}
                    value={focusTime}
                    onChange={(e) =>
                      setFocusTime(Math.max(1, parseInt(e.target.value) || 0))
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-zinc-700 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Descanso (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isRunning}
                    value={breakTime}
                    onChange={(e) =>
                      setBreakTime(Math.max(1, parseInt(e.target.value) || 0))
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-zinc-700 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Sesiones
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isRunning}
                    value={sessions}
                    onChange={(e) =>
                      setSessions(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-zinc-700 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- ESPACIO RESERVADO PARA EL MODO FLEX --- */}
        {activeMode === "flex" && (
          <div className="flex flex-col items-center">
            {/* Indicador de Estado General */}
            <span
              className={`rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors duration-300 ${
                !isRunning
                  ? "bg-zinc-800 text-zinc-400"
                  : currentPhase === "focus"
                    ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}
            >
              {!isRunning
                ? "Temporizador Pausado ⏸️"
                : currentPhase === "focus"
                  ? "Corriendo Enfoque 🎯"
                  : "Corriendo Descanso ☕"}
            </span>

            {/* Panel de Doble Reloj (Lado a Lado) */}
            <div className="my-10 grid w-full grid-cols-2 gap-4">
              {/* Reloj de Enfoque */}
              <div
                className={`flex flex-col items-center rounded-2xl border p-4 transition-all duration-300 ${
                  currentPhase === "focus" && isRunning
                    ? "border-amber-500/30 bg-amber-500/[0.02] shadow-lg shadow-amber-500/5"
                    : "border-zinc-800/60 bg-zinc-950/20 opacity-50"
                }`}
              >
                <span className="text-xs font-medium text-amber-500/80 uppercase tracking-wider">
                  Enfoque
                </span>
                <span className="mt-2 text-3xl font-light tabular-nums tracking-tight text-zinc-100">
                  {formatTime(timeLeftFocus)}
                </span>
              </div>

              {/* Reloj de Descanso */}
              <div
                className={`flex flex-col items-center rounded-2xl border p-4 transition-all duration-300 ${
                  currentPhase === "break" && isRunning
                    ? "border-emerald-500/30 bg-emerald-500/[0.02] shadow-lg shadow-emerald-500/5"
                    : "border-zinc-800/60 bg-zinc-950/20 opacity-50"
                }`}
              >
                <span className="text-xs font-medium text-emerald-400/80 uppercase tracking-wider">
                  Descanso
                </span>
                <span className="mt-2 text-3xl font-light tabular-nums tracking-tight text-zinc-100">
                  {formatTime(timeLeftBreak)}
                </span>
              </div>
            </div>

            {/* Botonera de Control */}
            <div className="flex flex-col w-full gap-3">
              {/* Botón Principal (Play / Pause) y Reset */}
              <div className="flex items-center gap-3 w-full">
                <button
                  onClick={() =>
                    handleInteractiveClick(() => setIsRunning(!isRunning))
                  }
                  className={`flex h-14 flex-1 items-center justify-center rounded-2xl text-sm font-semibold shadow-lg transition-all active:scale-95 ${
                    isRunning
                      ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                      : currentPhase === "focus"
                        ? "bg-amber-500 hover:bg-amber-400 text-black"
                        : "bg-emerald-500 hover:bg-emerald-400 text-black"
                  }`}
                >
                  {isRunning ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                      </svg>
                      Pausar Flujo
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Iniciar Flujo
                    </span>
                  )}
                </button>

                <button
                  onClick={() => handleInteractiveClick(handleReset)}
                  title="Reiniciar temporizadores"
                  className="flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-850 hover:text-zinc-200 active:scale-95 transition-all"
                >
                  <svg
                    className="h-5 w-5 stroke-current fill-none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
                    />
                  </svg>
                </button>
              </div>

              {/* Botón de Cambio Rápido de Fase */}
              <button
                onClick={() => handleInteractiveClick(togglePhase)}
                className="flex h-12 w-full items-center justify-center rounded-xl border border-zinc-800/80 bg-zinc-950 text-xs font-medium text-zinc-300 hover:bg-zinc-900 active:scale-98 transition-all"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="h-4 w-4 stroke-current fill-none"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                    />
                  </svg>
                  Alternar a modo{" "}
                  {currentPhase === "focus" ? "Descanso ☕" : "Enfoque 🎯"}
                </span>
              </button>
            </div>

            {/* Ajustes Rápidos e Inputs */}
            <div className="mt-8 w-full border-t border-zinc-800/60 pt-6">
              <h3 className="mb-4 text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Configuración inicial
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Enfoque (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isRunning}
                    value={focusTime}
                    onChange={(e) =>
                      setFocusTime(Math.max(1, parseInt(e.target.value) || 0))
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-zinc-700 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Descanso (min)
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isRunning}
                    value={breakTime}
                    onChange={(e) =>
                      setBreakTime(Math.max(1, parseInt(e.target.value) || 0))
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-zinc-700 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium text-zinc-400">
                    Sesiones
                  </label>
                  <input
                    type="number"
                    min="1"
                    disabled={isRunning}
                    value={sessions}
                    onChange={(e) =>
                      setSessions(Math.max(1, parseInt(e.target.value) || 1))
                    }
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none transition-colors focus:border-zinc-700 disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
