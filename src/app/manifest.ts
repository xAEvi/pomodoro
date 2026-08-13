import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pomodoro",
    short_name: "Pomodoro",
    description: "A focused, distraction-free Pomodoro timer.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d11",
    theme_color: "#0b0d11",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icon-512-maskable.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
