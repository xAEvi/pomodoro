/**
 * Convierte una cantidad de segundos en un formato legible de minutos y segundos.
 *
 * @param seconds - Segundos totales a formatear.
 * @returns Un string formateado como "MM:SS" (ej. "05:04", "25:00").
 *
 * @example
 * formatTime(304) // Retorna "05:04"
 * formatTime(0)   // Retorna "00:00"
 */
export function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return "00:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Usamos padStart para asegurar el padding de dos dígitos siempre
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

/**
 * Formatea una cantidad de minutos como duración legible en horas y minutos.
 *
 * @example
 * formatDurationHM(120) // "2 h 00 m"
 * formatDurationHM(45)  // "45 m"
 */
export function formatDurationHM(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} m`;
  }
  return `${hours} h ${String(minutes).padStart(2, "0")} m`;
}

/**
 * Formatea un timestamp absoluto (ms) como hora local "HH:MM".
 */
export function formatClockTime(timestampMs: number): string {
  const date = new Date(timestampMs);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

/**
 * Total del ciclo en modo clásico: N focuses + (N-1) breaks (sin break final).
 * Ej. 2×25/10 → 25+10+25 = 60.
 */
export function getClassicTotalMinutes(
  focusTime: number,
  breakTime: number,
  sessions: number,
): number {
  return sessions * focusTime + Math.max(0, sessions - 1) * breakTime;
}

/** Total del bloque en modo flex: N*(focus+break) (presupuesto completo). */
export function getFlexTotalMinutes(
  focusTime: number,
  breakTime: number,
  sessions: number,
): number {
  return sessions * (focusTime + breakTime);
}

/**
 * Segundos restantes del ciclo clásico incluyendo la fase actual.
 * - En focus k: quedan (s-k) pares focus+break
 * - En break k: quedan (s-k) focuses + (s-k-1) breaks
 */
export function getClassicRemainingSeconds(
  timeLeft: number,
  currentPhase: "focus" | "break",
  currentSession: number,
  focusTime: number,
  breakTime: number,
  sessions: number,
): number {
  if (currentPhase === "focus") {
    return timeLeft + (sessions - currentSession) * (focusTime + breakTime) * 60;
  }
  return (
    timeLeft +
    (sessions - currentSession) * focusTime * 60 +
    Math.max(0, sessions - currentSession - 1) * breakTime * 60
  );
}
