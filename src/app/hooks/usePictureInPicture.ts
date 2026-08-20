"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

declare global {
  interface Window {
    documentPictureInPicture?: {
      requestWindow: (options?: {
        width?: number;
        height?: number;
      }) => Promise<Window>;
      window: Window | null;
    };
  }
}

function getIsSupportedSnapshot() {
  return "documentPictureInPicture" in window;
}

function getIsSupportedServerSnapshot() {
  return false;
}

function subscribeNoop() {
  return () => {};
}

export function usePictureInPicture() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  // El soporte de la API es constante en la sesión del navegador, así que no
  // hace falta suscribirse a cambios: solo usamos useSyncExternalStore para
  // que el primer render del cliente coincida con el del servidor (donde
  // `window` no existe) y no se produzca un mismatch de hidratación.
  const isSupported = useSyncExternalStore(
    subscribeNoop,
    getIsSupportedSnapshot,
    getIsSupportedServerSnapshot,
  );

  const openPip = useCallback(async () => {
    if (!isSupported || !window.documentPictureInPicture) return;

    const pip = await window.documentPictureInPicture.requestWindow({
      width: 260,
      height: 148,
    });

    // El user agent aplica un margin por defecto al <body> del documento
    // PiP, lo que provoca scrollbars visibles cuando la ventana es chica.
    pip.document.documentElement.style.height = "100%";
    pip.document.body.style.margin = "0";
    pip.document.body.style.height = "100%";
    pip.document.body.style.overflow = "hidden";

    // Copiamos los estilos de la página principal para que el timer
    // flotante se vea igual dentro de la ventana Picture-in-Picture.
    [...document.styleSheets].forEach((styleSheet) => {
      try {
        const cssRules = [...styleSheet.cssRules]
          .map((rule) => rule.cssText)
          .join("");
        const style = document.createElement("style");
        style.textContent = cssRules;
        pip.document.head.appendChild(style);
      } catch {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.type = styleSheet.type;
        if (styleSheet.href) link.href = styleSheet.href;
        pip.document.head.appendChild(link);
      }
    });

    pip.addEventListener("pagehide", () => setPipWindow(null), {
      once: true,
    });

    setPipWindow(pip);
  }, [isSupported]);

  const closePip = useCallback(() => {
    pipWindow?.close();
    setPipWindow(null);
  }, [pipWindow]);

  // Cerramos la ventana PiP si el componente se desmonta.
  useEffect(() => {
    return () => {
      pipWindow?.close();
    };
  }, [pipWindow]);

  return { isSupported, pipWindow, openPip, closePip };
}
