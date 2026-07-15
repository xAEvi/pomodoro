/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Fuerza la generación de HTML/CSS/JS estáticos en la carpeta /out
  images: {
    unoptimized: true, // Requerido por Next.js para exportaciones estáticas
  },
  // ¡IMPORTANTE!: Si tu repositorio de GitHub NO es el principal de tu perfil
  // (es decir, tu URL va a ser de tipo usuario.github.io/nombre-del-repo),
  // debés descomentar la siguiente línea y poner el nombre de tu repositorio:
  // basePath: '/nombre-de-tu-repositorio',
};

export default nextConfig;
