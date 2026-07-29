# Changelog

## 2026-07-29

### Added

- **Modo "siempre visible" (Picture-in-Picture)**: botón junto al título que abre el timer en una ventana flotante (Document Picture-in-Picture API) para verlo por encima de otras aplicaciones. La ventana incluye fase, tiempo restante, botón Start/Pause y, en modo Flex, Toggle Phase.

## 2026-07-28

### Added

- **Persistencia de configuración**: `focusTime`, `breakTime`, `sessions` y `activeMode` se guardan en `localStorage` y se restauran al recargar la página.
- **Persistencia de la sesión en curso**: si el timer estaba corriendo, el conteo se reconstruye a partir de un `endTime` absoluto guardado, sobreviviendo a un refresh accidental sin perder progreso.
- **Título de pestaña dinámico**: el `<title>` del documento muestra el tiempo restante y la fase actual (ej. `25:00 - Focus`) mientras el timer corre.
- **Notificaciones del navegador**: se solicita permiso de `Notification` al cargar la app y se dispara una notificación del sistema al terminar cada fase, además del sonido existente.
- **Atajos de teclado**: `Space` para play/pause, `R` para reset, `T` para alternar fase en modo Flex (se ignoran mientras se escribe en los inputs de configuración).
- **Modo "Auto-start siguiente fase"**: toggle en modo clásico que reanuda el timer automáticamente al terminar una fase, sin esperar que el usuario pulse Start.
- **Presets rápidos**: botones "25/5", "50/10" y "90/20" para configurar focus/break de un click, visibles solo en modo clásico.
- **Favicon dinámico**: el ícono de la pestaña cambia de color según la fase (rojo en foco, celeste en descanso, gris en pausa).
- **Vista de progreso de sesiones**: fila de puntos bajo el header que muestra cuántas sesiones del ciclo se completaron.
- Sección "Running locally" en el README con los pasos para instalar y correr la app.

### Fixed

- Los presets rápidos se restringieron a modo clásico, ya que en modo Flex el total se multiplica por `sessions` y el preset daba un resultado engañoso.

### Docs

- `ROADMAP.md`: los ítems ya implementados se marcaron como tachados en vez de eliminarse, preservando el historial de ideas.
