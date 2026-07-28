let faviconLink: HTMLLinkElement | null = null;

/**
 * Repinta el favicon con un círculo de color sólido, generado on-the-fly vía canvas.
 * Reutiliza (o crea) el <link rel="icon"> del documento en vez de recargarlo desde /favicon.ico.
 */
export function setFaviconColor(color: string): void {
  if (typeof document === "undefined") return;

  if (!faviconLink) {
    faviconLink =
      document.querySelector<HTMLLinkElement>("link[rel~='icon']") ??
      document.createElement("link");
    faviconLink.rel = "icon";
    if (!faviconLink.isConnected) {
      document.head.appendChild(faviconLink);
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();

  faviconLink.href = canvas.toDataURL("image/png");
}
