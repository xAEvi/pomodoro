/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  // Reemplazá 'pomodoro' por el nombre exacto de tu repositorio en GitHub
  basePath: "/pomodoro",
};

export default nextConfig;
