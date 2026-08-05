# Changelog

## 2026-08-05

### Fixed

- **El modal de perfil se cerraba al hacer click fuera de la ventana**: se quitó el cierre por click en el overlay (que además se rompía al seleccionar texto y soltar el mouse afuera). Ahora el modal de Crear/Editar perfil solo se cierra explícitamente con el botón Cancel, el botón X o la tecla Escape.

### Docs

- **Traducción al inglés del modal de Crear/Editar perfil**: los textos visibles (labels, botones, mensajes de validación) del modal `ProfileModal` estaban en español mientras el resto de la interfaz ya estaba en inglés; se tradujeron para mantener consistencia.

## 2026-08-03

### Added

- **Perfiles personalizados en Settings**: se reemplazaron los presets fijos (25/5, 50/10, 90/20) por un selector de perfiles completo. Los usuarios pueden crear, editar y eliminar sus propios perfiles de Focus/Break/Sessions desde un modal dedicado (con validación de límites y cálculo de duración total en tiempo real), marcar uno como predeterminado (se carga automáticamente en la primera visita, indicado con una estrella), reordenarlos por drag & drop y ver una notificación toast al crear/editar/eliminar. Los tres perfiles predefinidos originales se mantienen como semilla y no pueden eliminarse, solo editarse. Todo persiste en localStorage bajo una clave separada (`pomodoro-profiles`).

## 2026-07-31

### Added

- **Hora de finalización combinada en modo Flex**: en la vista normal de la aplicación, el temporizador en modo Flex ahora calcula y muestra la hora exacta en que terminarán ambos procesos combinados (focus + break restantes), siguiendo el mismo estilo visual "ends HH:MM" del modo clásico.

## 2026-07-30

### Added

- **Fondo dinámico según la fase**: el fondo de la app (y el de la ventana de Picture-in-Picture) ahora cambia según la fase activa: un tinte rojo durante el foco y uno cian durante el descanso, con transición suave entre ambos.
- **Barra de progreso en Picture-in-Picture**: la ventana flotante ahora muestra, entre el contador y los botones, una barra de progreso lineal (con el porcentaje transcurrido y el que falta) para ver de un vistazo cuánto queda de la fase activa sin necesitar la pestaña principal.

### Fixed

- **En modo Flex, el contador de la fase inactiva se reiniciaba al refrescar**: solo se persistía el `endTime` de la fase que estaba corriendo, así que el tiempo restante "banked" de la otra fase (ej. break dejado en 19:59 mientras corría focus) nunca se guardaba y volvía a su duración completa tras un refresh. Ahora `timeLeftFocus` y `timeLeftBreak` se persisten explícitamente y se restauran ambos al recargar la página.

## 2026-07-29

### Fixed

- **El timer no avanzaba al presionar Start**: el callback `onPhaseComplete` se pasaba como arrow function inline, así que cambiaba de identidad en cada render; eso encadenaba (vía `handlePhaseCompletion`/`syncTimeLeft`) un reinicio del efecto principal del timer en cada tick de 200ms, reseteando `endTimeRef` a "ahora + duración completa" antes de que pasara un segundo real. Se estabilizó el callback con un ref, sin cambiar su comportamiento.
- El indicador "N of M used" en modo Flex se cambió por un porcentaje (`{n}% used`) sobre el tiempo total de la fase activa.

### Added

- **Modo "siempre visible" (Picture-in-Picture)**: botón junto al título que abre el timer en una ventana flotante (Document Picture-in-Picture API) para verlo por encima de otras aplicaciones. La ventana incluye fase, tiempo restante, botón Start/Pause y, en modo Flex, Toggle Phase.
- **Sonidos ambientales opcionales durante el foco**: toggle "Ambient sound during focus" con dos opciones (lluvia / ruido blanco) generadas con la Web Audio API, que solo suenan mientras el timer corre en fase de foco.
- **Rediseño completo de la interfaz** siguiendo una nueva referencia de diseño:
  - Modo clásico: anillo de progreso circular con la fase y el tiempo restante dentro, más una línea "ends HH:MM".
  - Modo flex: tarjetas emparejadas (fase activa con progreso y "N of M used" · fase banked, más discreta).
  - Barra de sesiones segmentada bajo el timer (reemplaza los puntos sueltos), con "Session X of Y" / minutos restantes en clásico y la línea "Block budget" (`4 × 25/5 · 2 h 00 m`) en flex.
  - La configuración se movió a una hoja modal detrás del ícono de engranaje, en vez de un formulario siempre visible compitiendo con el timer.
  - Jerarquía de botones: pastilla rellena para Start/Pause, pastilla con borde para cambiar de fase (nombra el destino, ej. "Break"), botón ícono para Reset.
  - Ícono de sonido ambiental en el header con tinte turquesa cuando está activo, en vez de un checkbox al final de la tarjeta.
  - Footer con los atajos de teclado disponibles.
  - Nuevo toggle de **Notifications** en la hoja de configuración para habilitar/deshabilitar las notificaciones del navegador.
  - Color de acento de la fase de descanso cambiado de celeste a turquesa (`#5dcaa5`), incluyendo favicon y ventana de Picture-in-Picture.

### Fixed

- **Precisión en pestañas en background**: al volver a foco la pestaña se recalcula de inmediato el tiempo restante contra `endTimeRef` en vez de esperar al próximo tick del `setInterval`, que el navegador puede haber demorado por políticas de throttling.
- **Manejo de errores en notificaciones y audio**: `Notification.requestPermission()` y la reproducción de sonidos (clicks, alerta, sonido ambiental) ahora están envueltos en try/catch, así un bloqueo del navegador (permiso denegado, políticas de autoplay, límite de `AudioContext`) no rompe el resto de la app.
- **Mismatch de hidratación en el botón de Picture-in-Picture**: la detección de soporte de la API se movió a `useSyncExternalStore` para que el primer render del cliente coincida con el del servidor.

### Docs

- `README.md`: se actualizó "Key Features" y "How to use" para reflejar todas las funcionalidades agregadas hasta la fecha (persistencia, notificaciones, atajos de teclado, presets, favicon dinámico, progreso de sesiones, Picture-in-Picture, sonido ambiental y el rediseño de la interfaz).

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
