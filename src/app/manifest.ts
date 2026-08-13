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
    // Atajos al mantener presionado el ícono (Android) o click derecho
    // (escritorio). Apuntan a los perfiles predefinidos por id fijo, ya que el
    // manifest es estático y no puede leer los perfiles personalizados del
    // usuario en localStorage.
    shortcuts: [
      {
        name: "Start 25 / 5",
        short_name: "25 / 5",
        url: "/?profile=predefined-25-5&start=1",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Start 50 / 10",
        short_name: "50 / 10",
        url: "/?profile=predefined-50-10&start=1",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
      {
        name: "Start 90 / 20",
        short_name: "90 / 20",
        url: "/?profile=predefined-90-20&start=1",
        icons: [{ src: "/icon-192.png", sizes: "192x192", type: "image/png" }],
      },
    ],
  };
}
