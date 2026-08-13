"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

function getIsSupportedSnapshot() {
  return typeof navigator !== "undefined" && "mediaSession" in navigator;
}

function getIsSupportedServerSnapshot() {
  return false;
}

function subscribeNoop() {
  return () => {};
}

function setActionHandler(action: MediaSessionAction, handler: MediaSessionActionHandler | null) {
  try {
    navigator.mediaSession.setActionHandler(action, handler);
  } catch {
    // Esta acción en particular puede no estar soportada por el navegador; se ignora.
  }
}

interface UseMediaSessionParams {
  isRunning: boolean;
  timeLabel: string;
  phaseLabel: string;
  currentSession: number;
  sessions: number;
  startTimer: () => void;
  pauseTimer: () => void;
  resetTimer: () => void;
}

/**
 * Expone el timer en los controles de medios del sistema (pantalla bloqueada,
 * notificación persistente en Android, auriculares Bluetooth) mientras `active`
 * sea true.
 *
 * El sistema operativo solo muestra esos controles si hay un elemento de audio
 * real reproduciéndose; el sonido ambiental de `utils/audio.ts` usa Web Audio
 * API puro, que no cuenta por sí solo. Por eso este hook mantiene su propio
 * `AudioContext` con un loop de silencio digital (generado, sin asset externo)
 * enrutado a un `<audio>` vía `MediaStream` mientras esté activo — no hace
 * falta montarlo en el DOM, un `HTMLAudioElement` reproduciendo cuenta para el
 * heurístico del sistema aunque no esté en el árbol.
 */
export function useMediaSession(active: boolean, params: UseMediaSessionParams) {
  const isSupported = useSyncExternalStore(
    subscribeNoop,
    getIsSupportedSnapshot,
    getIsSupportedServerSnapshot,
  );

  // Los action handlers leen desde acá en vez de recibir los callbacks
  // directamente, para no tener que recrear el <audio>/AudioContext en cada
  // render solo porque cambió una referencia (mismo motivo que
  // notificationsEnabledRef en PomodoroContainer).
  const paramsRef = useRef(params);
  useEffect(() => {
    paramsRef.current = params;
  });

  useEffect(() => {
    if (!isSupported || !active) return;

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const destination = ctx.createMediaStreamDestination();

    // Un segundo de silencio digital en loop: es audio real (cuenta para el
    // heurístico del SO) pero no se escucha nada.
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    source.connect(destination);
    source.start();

    const audio = new Audio();
    audio.srcObject = destination.stream;
    audio.play().catch(() => {
      // Sin gesto de usuario reciente el navegador puede bloquear el
      // autoplay; en ese caso el SO simplemente no mostrará los controles.
    });

    setActionHandler("play", () => paramsRef.current.startTimer());
    setActionHandler("pause", () => paramsRef.current.pauseTimer());
    setActionHandler("stop", () => paramsRef.current.resetTimer());

    return () => {
      setActionHandler("play", null);
      setActionHandler("pause", null);
      setActionHandler("stop", null);
      navigator.mediaSession.metadata = null;

      try {
        source.stop();
        audio.pause();
        audio.srcObject = null;
        ctx.close().catch(() => {});
      } catch {
        // El contexto o el nodo ya pudieron haberse cerrado/detenido.
      }
    };
  }, [isSupported, active]);

  useEffect(() => {
    if (!isSupported || !active) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${params.timeLabel} - ${params.phaseLabel}`,
      artist: "Pomodoro",
      album: `Session ${params.currentSession} of ${params.sessions}`,
      artwork: [{ src: "/icon-512.png", sizes: "512x512", type: "image/png" }],
    });
    navigator.mediaSession.playbackState = params.isRunning ? "playing" : "paused";
  }, [
    isSupported,
    active,
    params.timeLabel,
    params.phaseLabel,
    params.isRunning,
    params.currentSession,
    params.sessions,
  ]);

  return { isSupported };
}
