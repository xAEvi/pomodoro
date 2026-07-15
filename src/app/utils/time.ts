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
