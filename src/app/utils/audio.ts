// Declaramos la variable del contexto fuera de la función, pero sin inicializarla.
let audioCtx: AudioContext | null = null;

/**
 * Obtiene o inicializa de forma segura el AudioContext en el cliente.
 * Evita fallos de compilación durante el Server-Side Rendering (SSR) y no
 * propaga excepciones si el navegador bloquea el audio (políticas de autoplay,
 * límite de AudioContexts, etc.): en ese caso simplemente no habrá sonido.
 */
function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!audioCtx) {
      // Soporte para navegadores antiguos y modernos
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    // Si el navegador suspendió el contexto de audio por políticas de interacción, lo reactivamos.
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {
        // El navegador puede rechazar el resume si no hubo interacción del usuario; se ignora.
      });
    }
  } catch {
    return null;
  }

  return audioCtx;
}

/**
 * Genera un tono de alerta simple (un pitido corto de interfaz).
 */
export function playClickSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
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
  } catch {
    // Reproducción bloqueada o contexto inválido; el click es puramente decorativo.
  }
}

/**
 * Genera un sonido de alarma melódico de dos tonos continuos para avisar el fin de una sesión.
 */
export function playAlertSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
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
  } catch {
    // Reproducción bloqueada o contexto inválido; ya se disparó la notificación del navegador.
  }
}

export type AmbientSoundType = "rain" | "white-noise";

// Referencias del sonido ambiental actualmente en reproducción, para poder detenerlo/reemplazarlo.
let ambientSource: AudioBufferSourceNode | null = null;
let ambientGain: GainNode | null = null;

function createNoiseBuffer(ctx: AudioContext): AudioBuffer {
  // 2 segundos de ruido blanco en loop; suficiente para que no se note la repetición.
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

/**
 * Inicia (o reemplaza) un sonido ambiental en loop (lluvia / ruido blanco).
 * Pensado para acompañar la fase de foco con un toggle on/off.
 */
export function startAmbientSound(type: AmbientSoundType): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  stopAmbientSound();

  try {
    const source = ctx.createBufferSource();
    source.buffer = createNoiseBuffer(ctx);
    source.loop = true;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1);

    if (type === "rain") {
      // Filtro pasa-bajos: suaviza el ruido blanco para que suene más a lluvia que a estática.
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1000, ctx.currentTime);
      source.connect(filter);
      filter.connect(gain);
    } else {
      source.connect(gain);
    }

    gain.connect(ctx.destination);
    source.start();

    ambientSource = source;
    ambientGain = gain;
  } catch {
    // Reproducción bloqueada por políticas de autoplay; el toggle simplemente no sonará.
    ambientSource = null;
    ambientGain = null;
  }
}

/** Detiene el sonido ambiental en reproducción, si lo hay, con un breve fade-out. */
export function stopAmbientSound(): void {
  if (!ambientSource) return;

  try {
    const ctx = ambientSource.context;
    const source = ambientSource;
    if (ambientGain) {
      ambientGain.gain.cancelScheduledValues(ctx.currentTime);
      ambientGain.gain.setValueAtTime(ambientGain.gain.value, ctx.currentTime);
      ambientGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
    }
    source.stop(ctx.currentTime + 0.3);
  } catch {
    // El contexto ya pudo haberse cerrado o el nodo ya estar detenido.
  }

  ambientSource = null;
  ambientGain = null;
}
