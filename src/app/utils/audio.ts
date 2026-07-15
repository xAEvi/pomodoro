// Declaramos la variable del contexto fuera de la función, pero sin inicializarla.
let audioCtx: AudioContext | null = null;

/**
 * Obtiene o inicializa de forma segura el AudioContext en el cliente.
 * Evita fallos de compilación durante el Server-Side Rendering (SSR).
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  if (!audioCtx) {
    // Soporte para navegadores antiguos y modernos
    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }

  // Si el navegador suspendió el contexto de audio por políticas de interacción, lo reactivamos.
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  return audioCtx;
}

/**
 * Genera un tono de alerta simple (un pitido corto de interfaz).
 */
export function playClickSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  // Frecuencia del sonido (un "click" agudo y rápido)
  osc.frequency.setValueAtTime(600, ctx.currentTime);

  // Envolvente de volumen rápida para simular un switch físico
  gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.08);

  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.08);
}

/**
 * Genera un sonido de alarma melódico de dos tonos continuos para avisar el fin de una sesión.
 */
export function playAlertSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Primer Tono (Grave)
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.connect(gain1);
  gain1.connect(ctx.destination);
  osc1.frequency.setValueAtTime(440, now); // Nota La (A4)
  gain1.gain.setValueAtTime(0.15, now);
  gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  osc1.start(now);
  osc1.stop(now + 0.25);

  // Segundo Tono (Agudo, ligeramente desfasado para crear armonía)
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2);
  gain2.connect(ctx.destination);
  osc2.frequency.setValueAtTime(554.37, now + 0.15); // Nota Do sostenido (C#5)
  gain2.gain.setValueAtTime(0.15, now + 0.15);
  gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
  osc2.start(now + 0.15);
  osc2.stop(now + 0.45);
}
