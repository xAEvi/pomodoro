"use client";

import { useEffect, useRef, useState } from "react";

const ENTER_COMPACT_HEIGHT = 130;
const ENTER_COMPACT_WIDTH = 200;
const EXIT_COMPACT_HEIGHT = 150;
const EXIT_COMPACT_WIDTH = 220;

interface PipSize {
  width: number;
  height: number;
  isCompact: boolean;
}

function getIsCompact(width: number, height: number, wasCompact: boolean) {
  if (wasCompact) {
    return !(width >= EXIT_COMPACT_WIDTH && height >= EXIT_COMPACT_HEIGHT);
  }
  return width <= ENTER_COMPACT_WIDTH || height <= ENTER_COMPACT_HEIGHT;
}

// Usa el ResizeObserver del propio contexto PiP (no el del documento
// principal) para observar el <html> de esa ventana. Aplica histéresis
// entre entrar y salir del modo compacto para evitar parpadeos al
// arrastrar el borde justo en el umbral.
export function usePipSize(pipWindow: Window | null): PipSize {
  const [size, setSize] = useState<PipSize>({
    width: 0,
    height: 0,
    isCompact: false,
  });
  const wasCompactRef = useRef(false);

  useEffect(() => {
    if (!pipWindow) {
      wasCompactRef.current = false;
      setSize({ width: 0, height: 0, isCompact: false });
      return;
    }

    const updateSize = (width: number, height: number) => {
      const isCompact = getIsCompact(width, height, wasCompactRef.current);
      wasCompactRef.current = isCompact;
      setSize({ width, height, isCompact });
    };

    updateSize(pipWindow.innerWidth, pipWindow.innerHeight);

    const ResizeObserverCtor =
      (pipWindow as unknown as { ResizeObserver?: typeof ResizeObserver })
        .ResizeObserver ?? ResizeObserver;
    if (ResizeObserverCtor) {
      const observer = new ResizeObserverCtor((entries: ResizeObserverEntry[]) => {
        const entry = entries[0];
        if (!entry) return;
        const { width, height } = entry.contentRect;
        updateSize(width, height);
      });
      observer.observe(pipWindow.document.documentElement);
      return () => observer.disconnect();
    }

    const handleResize = () => {
      updateSize(pipWindow.innerWidth, pipWindow.innerHeight);
    };
    pipWindow.addEventListener("resize", handleResize);
    return () => pipWindow.removeEventListener("resize", handleResize);
  }, [pipWindow]);

  return size;
}
