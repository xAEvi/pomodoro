"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Registra el service worker y expone cuándo hay una versión nueva instalada
 * y esperando (en vez de aplicarla sola). `applyUpdate()` le pide al worker en
 * espera que tome control; una vez que lo hace, recargamos la página para que
 * cargue los assets de la versión nueva.
 */
export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const handleInstallingStateChange = (installing: ServiceWorker) => () => {
      // "installed" con un controller ya activo significa que esto es una
      // actualización (no la primera instalación, que no tiene controller
      // todavía porque ningún worker está controlando la página aún).
      if (installing.state === "installed" && navigator.serviceWorker.controller) {
        setWaitingWorker(installing);
      }
    };

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Por si ya había un worker en espera de una visita anterior (la
        // pestaña se cerró antes de recargar y confirmar la actualización).
        if (registration.waiting && navigator.serviceWorker.controller) {
          setWaitingWorker(registration.waiting);
        }

        registration.addEventListener("updatefound", () => {
          const installing = registration.installing;
          if (!installing) return;
          installing.addEventListener(
            "statechange",
            handleInstallingStateChange(installing),
          );
        });
      })
      .catch(() => {
        // El registro puede fallar en contextos no seguros o navegadores sin soporte; se ignora.
      });

    let reloaded = false;
    const handleControllerChange = () => {
      // El evento puede dispararse más de una vez; solo nos interesa la
      // primera vez que el worker nuevo toma control tras nuestro postMessage.
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", handleControllerChange);

    return () => {
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        handleControllerChange,
      );
    };
  }, []);

  const applyUpdate = useCallback(() => {
    waitingWorker?.postMessage({ type: "SKIP_WAITING" });
  }, [waitingWorker]);

  return { updateAvailable: waitingWorker !== null, applyUpdate };
}
