# Changelog

## 2026-08-21

### Fixed

- **Polish final: banner arriba y scroll del selector** — `UpdateBanner.tsx:15` movido `bottom-5 → top-4` con `border-white/10` para salir del thumb zone móvil y no competir con `Toast` (`bottom-5`); `ProfileSelector.tsx:134` lista ahora `max-h-[40vh] overflow-y-auto overscroll-contain` para que 8+ perfiles hagan scroll interno sin forzar `SettingsSheet` `max-h-[90vh]` a nested scroll; evita flicker y stacking `z-[70]` entre banner/toast. Verificación `npm run build` ✓ y `detect --scope layout` clean.
- **Flex sin `Block budget` redundante** — `PomodoroContainer.tsx:555` eliminado el label inferior `Block budget 4 × 25/5 · 2 h 00 m` en Flex (`PomodoroContainer.tsx:541` antes duplicaba el pill superior `25/5 · 4×` + `F 2 h 00 m` de `PomodoroContainer.tsx:474`); el grupo ahora solo conserva `SessionBar` + `ends HH:MM` (`mt-1 gap-1.5`), y se removió `blockTotalMinutes` no usado. Sin texto duplicado el card respira y la fuente única de verdad es el pill superior.
- **Harden: confirmación de cambio de modo sin `window.confirm`** — `ModeSelector.tsx:1` reemplazado `window.confirm` nativo (P1 `User Control` del critique, chrome OS rompe `dark surface` y bloquea hilo) por `ConfirmModal` (`role=alertdialog`, `useFocusTrap`, `Escape`/`click fuera`) con `pendingMode` y mensaje contextual `dirtyDetail` (`PomodoroContainer.tsx:497` pasa `"14:22 left in Focus · Session 2 of 4"` vía `formatTime(timeLeft)` + fase + sesión); `disabled` ahora con `title="Pause or reset to change mode"` y `disabled:pointer-events-none` + `aria-pressed`; botones `flex-1 min-w-0 truncate px-2` para tolerar `Klassisch` 30% expansión (i18n) sin overflow; maneja doble click y race (overwrite `pendingMode`) y preserva `playClickSound`.
- **Layout: perfil visible en el card y ritmo del contenido** — `PomodoroContainer.tsx:131` nuevo derivado `activeProfile`/`isDefaultActive` + `classicTotalMinutes`/`flexTotalMinutes` movidos arriba para uso en el header; `PomodoroContainer.tsx:459` fila de contexto de perfil `mt-2 mb-3` con pill `bg-white/[0.04] border-line-soft` que muestra nombre truncado (`max-w-[110px]`), `focus/break · sessions×` en mono y estrella `StarIcon` si es default (P1 recognition del critique), abre `SettingsSheet` al click y muestra `C`/`F` totals `hidden sm:inline`; `PomodoroContainer.tsx:500` Classic reagrupado `flex justify-center mb-4` + `flex-col gap-1.5 mb-auto` (barra + meta tight) vs `mb-1.5`/`mb-auto` separados; `PomodoroContainer.tsx:541` Flex reagrupado `flex-col gap-2` para las dos `PhaseCard` + grupo `mt-1 gap-1.5` para `Block budget`/`SessionBar`/`ends` (antes `mt-3.5 mb-1.5`/`mt-1.5` disjuntos); `PhaseCard.tsx:30` removidos `mb-2.5`/`mb-auto` internos para que el `gap` padre controle el ritmo. Corrige lectura Order squint y evita monotonia de `mb-1.5` repetido.
- **Polish: break wash, atajos y focus del botón primario** — `globals.css:21` corregido `break-wash` de `cyan #22D3EE` a `break #5DCAA5` al 18% sobre `canvas` para que el fondo de descanso coincida con el anillo `text-break` (P1 del critique `src-app-components-pomodoro-pomodorocontainer-tsx`); `PomodoroContainer.tsx:392` header `gap-0.5→1` para respiración entre iconos de 26px; `PomodoroContainer.tsx:542` hints `space / T / R` elevados de `text-[11px] text-subtle` a `kbd` chips (`bg-white/[0.06] border` + `text-faint` 4.5:1) con `tracking-wide` y separadores `·` para persona keyboard-first; `TimerControls.tsx:37` anillo de foco del botón primario `bg-ink` con `ring-offset-surface` para contraste sobre claro.

### Added

- **PiP compact muestra "ends HH:MM" en el centro**: `PipTimerCompact` (`src/app/components/pomodoro/PipTimer.tsx:132`) ahora renderiza `endsAtLabel` (`pipEndsAtLabel` de `PomodoroContainer.tsx:353` — `endsAtLabel` en classic y `flexEndsAtLabel` combinado en flex) en el medio de la barra compacta, entre el contador y el botón de pausa. Antes solo se veía en el modo PiP grande (`PipTimerFull`), el layout chiquito (`isCompact` de `usePipSize.ts:6`) solo mostraba `timeLabel` y el botón. Se usa `flex-1` centrado con `text-faint`, `tabular-nums` y `drop-shadow` para legibilidad sobre el wash de progreso, y un `span` vacío como spacer cuando no hay `endsAtLabel` (timer pausado) para mantener `space-between`.

### Fixed

- **Classic sin break final**: el ciclo clásico ya no añade un break después del último focus. `2×25/10` pasa de `1h10m` (`sessions*(focus+break)`) a `1h00m` (`sessions*focus+(sessions-1)*break`: `25+10+25`). Se corrigió `handlePhaseCompletion` (`src/app/hooks/usePomodoro.ts:164`) para detenerse en `focus` `00:00` cuando `currentSession >= sessions` en modo classic, y `getClassicRemainingSeconds`/`getClassicTotalMinutes` (`src/app/utils/time.ts:52`) para el `min left` (`PomodoroContainer.tsx:300`). Flex mantiene `sessions*(focus+break)`.
- **Doble etiquetado de duración**: `SettingsSheet` (`src/app/components/pomodoro/SettingsSheet.tsx:108`), `ProfileModal` (`src/app/components/pomodoro/ProfileModal.tsx:36`) y `ProfileSelector` (`src/app/components/pomodoro/ProfileSelector.tsx:189`) ahora muestran `C` (classic sin break final) y `F` (flex budget) separados: ej. `Classic 1h15m · Flex 2h00m` para `4×25/5`.

## 2026-08-20

### Added

- **Accesibilidad (C6)**: se añadió `useFocusTrap` (`src/app/hooks/useFocusTrap.ts:1`) con trampa de foco para Tab/Shift+Tab, cierre con `Escape` y restauración del foco previo. Se integró en `SettingsSheet`, `ProfileModal` y `ConfirmModal` (con `role="dialog"`/`alertdialog`, `aria-modal`, `aria-labelledby`/`aria-describedby` y `tabIndex=-1`). Se añadieron `id`/`htmlFor` y `aria-label` explícitos a los inputs de Focus/Break/Sessions y nombre de perfil.
- **Onboarding (C8)**: nuevo componente `Onboarding` (`src/app/components/pomodoro/Onboarding.tsx:1`) que explica en primera visita la diferencia entre modo Classic (auto-alterna) y Flex (block budget con switch manual `T`). Usa `useFocusTrap`, se muestra solo si `pomodoro-onboarding-dismissed` no existe y `hasPersistedState()` es falso, y se persiste el descarte en `localStorage`. Se añadió botón `?` en el header (`PomodoroContainer.tsx:303`) para reabrirlo en cualquier momento.
- **PiP con aro circular y atajos (C9)**: `PipTimer` (`src/app/components/pomodoro/PipTimer.tsx:27`) ahora muestra un aro circular de 98px con progreso (`circumference`/`dashOffset`) que integra `phase`, `time` y `ends HH:MM` en su interior, reemplazando la barra horizontal para ahorrar altura vertical. Se añadió `endsAtLabel` combinado (`classic`/`flex`) y soporte de teclado dentro de la ventana PiP (`Space`/`R`/`T`/`Esc` via `pipWindow.addEventListener` en `PomodoroContainer.tsx:332`). Se eliminó el hint inferior `space·r·t` y se ajustó la ventana a `300×180` (`usePictureInPicture.ts:44`) para que el nuevo layout encaje sin recortes.

### Fixed

- **PiP más grande**: se aumentó el aro de 78px a 98px y la ventana de 260×148 a 300×180 para mejor legibilidad sin desbordar.
- **Semántica de progreso y controles**: `SessionBar` (`src/app/components/pomodoro/SessionBar.tsx:11`), `ProgressRing` (`src/app/components/pomodoro/ProgressRing.tsx:13`) y `PhaseCard` ahora exponen `role="progressbar"` con `aria-valuenow/min/max` y `aria-label`; `ModeSelector` (`src/app/components/pomodoro/ModeSelector.tsx:36`) expone `role="group"` y `aria-pressed`; `TimerControls` y los botones del header (`PomodoroContainer.tsx:256`) ahora tienen `aria-label` descriptivos, `aria-pressed` y `focus-visible:ring` para navegación por teclado. `PhaseCard` expone `role="group"` por fase.

## 2026-08-14

### Added

- **Aviso de nueva versión disponible en vez de aplicarla sola**: `public/sw.js` ya no llama a `skipWaiting()` automáticamente al instalar un service worker nuevo; ahora queda en estado "waiting" y un banner (`UpdateBanner`, mostrado desde `PomodoroContainer` vía el hook `useServiceWorkerUpdate`) ofrece "Reload" para aplicarla cuando el usuario quiera, o descartar el aviso sin interrumpir la sesión. Antes, una pestaña abierta con JS viejo en memoria podía terminar pidiendo un chunk que el deploy nuevo ya había borrado y romperse a mitad de sesión; ahora la actualización solo se aplica cuando el usuario confirma (o al abrir la app de nuevo). Se eliminó el componente `ServiceWorkerRegistration` (el registro del service worker se movió al nuevo hook, junto al resto de los hooks de `PomodoroContainer`).

## 2026-08-13

### Added

- **La aplicación es instalable (PWA)**: se agregaron un manifest (`src/app/manifest.ts`), íconos generados con `next/og` (incluida una variante maskable para Android y un apple-touch-icon) y un service worker (`public/sw.js`) que cachea el app shell, de modo que el timer funciona sin conexión y puede instalarse en la pantalla de inicio o el escritorio. El service worker usa network-first para el HTML (para no servir una versión vieja habiendo red) y cache-first para los assets, que ya llevan hash en el nombre. Solo se registra en producción.
- **Opción "Install app" en Settings**: dispara el prompt nativo de instalación en Android/Chrome (vía `beforeinstallprompt`) y muestra las instrucciones manuales (Compartir → "Add to Home Screen") en iOS Safari, que no expone esa API. La fila se oculta cuando la app ya corre instalada. Importante: Chrome solo ofrece la instalación sobre HTTPS o `localhost`, nunca sobre `http://` por IP de red local, así que la opción no aparece al probar contra el servidor de desarrollo desde el celular.
- **Opción "Keep screen awake" en Settings**: mantiene la pantalla encendida mientras el timer corre (tanto en focus como en break) usando la Screen Wake Lock API, para poder dejar el dispositivo a la vista sin que se apague. Viene desactivada por defecto por su impacto en la batería y se persiste en `localStorage` junto al resto del estado. La fila se oculta en navegadores sin soporte. El sistema libera el lock cada vez que el documento deja de estar visible, así que `useWakeLock` lo vuelve a pedir al regresar a la app; sin eso, solo habría funcionado hasta la primera vez que el usuario cambia de pestaña.
- **Atajos de perfil en el manifest**: al mantener presionado el ícono de la app instalada (Android) o hacer click derecho (escritorio) aparecen accesos directos para arrancar "25/5", "50/10" y "90/20" al instante, sin pasar por Settings. Se implementan como `?profile=<id>&start=1` en la URL del atajo; `PomodoroContainer` los detecta al montar, aplica el perfil, arranca el timer y limpia la URL de inmediato para que un refresh no repita el arranque. Si el perfil apuntado ya no existe (por ejemplo, si el usuario lo borró) o el atajo no trae `start=1`, se degrada con gracia sin romper nada.

## 2026-08-05

### Fixed

- **Error de hidratación (`Hydration failed`) al cargar la app**: `usePomodoro` y `useProfiles` leían `localStorage` de forma síncrona al cargar el módulo (antes de renderizar), así que el primer render en el cliente ya usaba el estado guardado (modo activo, perfiles, etc.) mientras el HTML generado en el servidor usaba los valores por defecto, produciendo un mismatch. Ahora ambos hooks inicializan su estado con los valores por defecto (coincidiendo con el HTML del servidor) y aplican el estado persistido recién en un `useEffect` tras montar en el cliente, sin tocar `localStorage` durante el render. El efecto de guardado espera a que esa hidratación termine para no sobrescribir los datos guardados con los valores por defecto.

- **El modal de perfil se cerraba al hacer click fuera de la ventana**: se quitó el cierre por click en el overlay (que además se rompía al seleccionar texto y soltar el mouse afuera). Ahora el modal de Crear/Editar perfil solo se cierra explícitamente con el botón Cancel, el botón X o la tecla Escape.
- **El sheet de Settings se cerraba al hacer click afuera mientras el modal de Crear/Editar perfil quedaba abierto encima**: al igual que en `ProfileModal`, se quitó el cierre por click en el overlay de `SettingsSheet`. Ahora solo se cierra con el botón X.

### Docs

- **Traducción al inglés del modal de Crear/Editar perfil**: los textos visibles (labels, botones, mensajes de validación) del modal `ProfileModal` estaban en español mientras el resto de la interfaz ya estaba en inglés; se tradujeron para mantener consistencia.
- Se tradujo el botón **"Crear perfil"** de `SettingsSheet` a **"Create profile"**, texto que había quedado en español.
- **Traducción del resto de los textos en español**: el menú de acciones de `ProfileSelector` ("Editar", "Establecer predeterminado", "Eliminar", "Más opciones"), el `ConfirmModal` de borrado de perfil invocado desde `SettingsSheet` (título, mensaje y botones) y los toasts de creación/edición/eliminación/predeterminado de `SettingsSheet`.

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
