"use client";

import { useCallback, useEffect, useState } from "react";

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

export function usePictureInPicture() {
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const isSupported =
    typeof window !== "undefined" && "documentPictureInPicture" in window;

  const openPip = useCallback(async () => {
    if (!isSupported || !window.documentPictureInPicture) return;

    const pip = await window.documentPictureInPicture.requestWindow({
      width: 260,
      height: 160,
    });

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
