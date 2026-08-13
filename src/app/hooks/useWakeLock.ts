"use client";

import { useEffect, useSyncExternalStore } from "react";

function getIsSupportedSnapshot() {
  return "wakeLock" in navigator;
}

function getIsSupportedServerSnapshot() {
  return false;
}

function subscribeNoop() {
  return () => {};
}

/**
 * Mantiene la pantalla encendida mientras `active` sea true, para que el timer
 * siga visible sin que el dispositivo se duerma.
 *
 * El sistema libera el lock automáticamente cuando el documento deja de estar
 * visible (cambio de pestaña, bloqueo de pantalla), así que hay que volver a
 * pedirlo al regresar: sin ese listener el wake lock solo funcionaría hasta la
 * primera vez que el usuario sale de la app.
 */
export function useWakeLock(active: boolean) {
  // El soporte es constante durante la sesión; useSyncExternalStore solo se usa
  // para que el primer render del cliente coincida con el del servidor (donde
  // `navigator` no existe) y no haya mismatch de hidratación.
  const isSupported = useSyncExternalStore(
    subscribeNoop,
    getIsSupportedSnapshot,
    getIsSupportedServerSnapshot,
  );

  useEffect(() => {
    if (!isSupported || !active) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;
    let pending = false;

    const acquire = async () => {
      // Evitamos pedir un segundo lock si ya hay uno vigente o una petición en
      // curso: sobrescribir `sentinel` dejaría el anterior sin liberar.
      if (pending || (sentinel && !sentinel.released)) return;

      pending = true;
      try {
        const next = await navigator.wakeLock.request("screen");
        if (cancelled) {
          // El efecto se limpió mientras la promesa estaba pendiente.
          next.release().catch(() => {});
        } else {
          sentinel = next;
        }
      } catch {
        // El navegador puede rechazarlo (batería baja, documento oculto o
        // permiso denegado); en ese caso simplemente no se retiene la pantalla.
      } finally {
        pending = false;
      }
    };

    acquire();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && !cancelled) acquire();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinel?.release().catch(() => {});
      sentinel = null;
    };
  }, [isSupported, active]);

  return { isSupported };
}
