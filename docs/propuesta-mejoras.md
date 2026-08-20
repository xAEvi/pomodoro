# Análisis y Propuesta de Mejoras — Flexible Pomodoro

> **Fecha:** 2026-08-20  
> **Autor:** Revisión automática del codebase  
> **Estado:** Propuesta — no implementada

---

## 1. Resumen ejecutivo

Flexible Pomodoro es un timer Pomodoro con dos modos diferenciados (Classic y Flex) muy bien resuelto a nivel de UX y con un nivel de pulido por encima de la media para un proyecto frontend-only: persistencia con `localStorage` resiliente a hidratación (`src/app/hooks/usePomodoro.ts:69`, `src/app/hooks/useProfiles.ts:18`), sonido ambiental con Web Audio API (`src/app/utils/audio.ts:123`), favicon/título dinámicos, Picture-in-Picture y sistema de perfiles con drag & drop.

El mayor diferencial del producto —el modo Flex con presupuesto de tiempo (*block budget*)— es único y merece ser el eje de la evolución. La propuesta prioriza: **(a)** cerrar deuda técnica y huecos de calidad, **(b)** potenciar Flex y **(c)** abrir el producto hacia historial/estadísticas y colaboración sin perder la simplicidad actual.

---

## 2. Estado actual

### 2.1 Stack

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16.2.10 (App Router) + React 19.2 + TypeScript 5 |
| Estilos | Tailwind CSS 4, CSS variables en `src/app/globals.css:3` |
| Estado | Hooks locales (`usePomodoro`, `useProfiles`) + `localStorage` |
| Audio | Web Audio API nativa |
| PiP | Document Picture-in-Picture API (`src/app/hooks/usePictureInPicture.ts:41`) |
| Tooling | ESLint (next/core-web-vitals), sin tests, sin CI |

### 2.2 Estructura

```
src/app/
  page.tsx → PomodoroContainer
  layout.tsx
  globals.css
  hooks/ usePomodoro.ts (372L) · useProfiles.ts · usePictureInPicture.ts
  utils/ storage.ts · profiles.ts · audio.ts · time.ts · favicon.ts
  components/pomodoro/ PomodoroContainer.tsx (442L) · SettingsSheet.tsx ·
    ProfileSelector.tsx · ProfileModal.tsx · PhaseCard.tsx · ProgressRing.tsx ·
    SessionBar.tsx · TimerControls.tsx · PipTimer.tsx · ConfirmModal.tsx ·
    Toast.tsx · ModeSelector.tsx · icons.tsx
```

### 2.3 Inventario de funcionalidades existentes

- **Dos modos:** Classic (auto-alterna) y Flex (switch manual `T`) — `src/app/hooks/usePomodoro.ts:278`
- **Perfiles:** 3 predefinidos + CRUD completo, default con estrella, drag & drop, persistencia `pomodoro-profiles` — `src/app/utils/profiles.ts:17`
- **Persistencia completa:** tiempos, fase, sesión, `endTime` absoluto y `timeLeftFocus/Break` independientes para sobrevivir refresh en Flex — `src/app/hooks/usePomodoro.ts:98`
- **Indicadores:** ProgressRing circular (Classic), cards + barra de progreso (Flex), SessionBar segmentada, `ends HH:MM` y `Block budget` (`4 × 25/5 · 2 h 00 m`)
- **Controles:** Start/Pause, Reset, Toggle Phase, header toggles (ambient sound, PiP), SettingsSheet modal
- **Atajos:** `Space`, `R`, `T` — `src/app/components/pomodoro/PomodoroContainer.tsx:191`
- **Notificaciones + sonido alerta + clicks + sonido ambiental** (rain / white-noise)
- **Fondo dinámico** según fase (`globals.css:22`, `PomodoroContainer.tsx:245`)
- **SEO/básico:** `metadata` genérico en `src/app/layout.tsx:15`

### 2.4 Qué se hizo bien

- **Hidratación correcta:** inicialización con defaults + `useEffect` para aplicar `localStorage` (`usePomodoro.ts:69`, `useProfiles.ts:26`). Evita el error clásico de mismatch SSR.
- **Precisión del timer:** cálculo contra `endTimeRef` + `visibilitychange` para throttling en background (`usePomodoro.ts:188`, `234`)
- **Persistencia de fase inactiva en Flex:** guardar ambos `timeLeft` (`storage.ts:15`, `usePomodoro.ts:98`) — fix no trivial.
- **PiP sin mismatch:** `useSyncExternalStore` para detección de soporte (`usePictureInPicture.ts:35`)
- **Accesibilidad base decente:** `role="dialog"`, `aria-modal`, `aria-pressed` en varios controles.

---

## 3. Hallazgos — deuda técnica y oportunidades

### 3.1 Bugs / fragilidades vigentes

| # | Archivo | Problema | Impacto |
|---|---------|----------|---------|
| B1 | `usePomodoro.ts:209` | El efecto principal depende de `timeLeftFocus/Break` y `currentPhase`. Cada tick que llama `syncTimeLeft` → `setTimeLeft*` reinicia `endTimeRef`. Si el intervalo es de 200 ms, funciona pero es frágil; un cambio futuro puede reintroducir el bug de `2026-07-29`. Separar `endTimeRef` del estado derivado lo haría robusto. | Medio |
| B2 | `useProfiles.ts:60` | `deleteProfile` cierra sobre `profiles` stale (del render donde se creó el callback). Si se borran dos perfiles seguidos sin re-render intermedio, `setDefaultProfileId` puede elegir un `remaining` incorrecto. Debería usar updater funcional para ambos. | Bajo |
| B3 | `ProfileModal.tsx:26` | `useState(profile?.name ?? "")` solo inicializa en el primer mount. Si se reutiliza la instancia (key no cambia en ciertos flujos), edita con datos viejos. Hoy se mitiga con `key` en `SettingsSheet.tsx:303`, pero es implícito. | Bajo |
| B4 | `PomodoroContainer.tsx:113` | `appliedInitialProfileRef` solo corre una vez; si el usuario borra `localStorage` manualmente sin recargar, no reaplica el default. No crítico. | Bajo |
| B5 | `storage.ts` / `profiles.ts` | Sin versionado del schema de `localStorage`. Un cambio de forma (ej. renombrar `ambientSoundType`) rompe la carga silenciosamente. | Medio |

### 3.2 Faltantes de calidad

- **Sin tests:** 0 archivos `*.test.*` / `*.spec.*`. Hooks críticos (`usePomodoro`) sin cobertura.
- **Sin validación de schema al cargar `localStorage`:** `JSON.parse` sin `zod`/`valibot`. Datos corruptos caen en `catch` y se descartan.
- **`PomodoroContainer.tsx` con 442 líneas:** orquesta timer + PiP + perfiles + efectos de título/favicon/atajos/sonido. Cuesta testear y mantener.
- **Metadata genérica:** `title: "Create Next App"` en `layout.tsx:16` — sin SEO, sin OG, sin `theme-color` por fase.
- **Accesibilidad incompleta:** inputs `type="number"` sin `aria-label` explícito, contrastes no auditados, `Toast` sin `role="status"`/`aria-live`, focus trap ausente en Sheets/Modals.
- **Sin CI/CD ni pre-commit:** `eslint` existe pero no se ejecuta en husky/lint-staged ni en GitHub Actions (`.github/workflows` vacío/antiguo).
- **Sin PWA / offline:** no hay `manifest.json`, ni Service Worker, ni `beforeinstallprompt`.
- **Internacionalización:** UI en inglés pero `CHANGELOG.md` y comentarios en español — inconsistente si se quiere escalar.
- **Dependencias mínimas pero sin utilidades:** sin `clsx`, sin `zod`, sin framework de tests.

---

## 4. Propuesta — Cambios (mejoras sobre lo existente)

### 4.1 P0 — Fundacionales (hacer primero)

**C1 — Versionado y validación de `localStorage`**
- Añadir `version: 1` a `PersistedPomodoroState` y `PersistedProfiles`.
- Validar con `zod` al hacer `loadState`/`loadProfiles`; migrar automáticamente si `version` es vieja.
- *Archivos:* `src/app/utils/storage.ts:23`, `src/app/utils/profiles.ts:49`

**C2 — Extraer lógica de `PomodoroContainer`**
- Crear `useDocumentTitle`, `useFavicon`, `useKeyboardShortcuts`, `useAmbientSound` y un `PomodoroHeader` / `PomodoroMain` para bajar `PomodoroContainer.tsx` de 442L a <150L.
- Mejora testeabilidad y evita re-renders innecesarios.

**C3 — Estabilizar `usePomodoro`**
- Desacoplar `endTimeRef` de `timeLeftFocus/Break` en la dep-array del efecto (`usePomodoro.ts:232`). Usar ref para `secondsToCount` o un `useReducer` con acción `TICK`.
- Añadir tests unitarios del hook con `vitest` + `@testing-library/react`.

**C4 — Metadata y SEO**
- Reemplazar `layout.tsx:15` por: `title: "Flexible Pomodoro — Classic & Flex Timer"`, `description`, `themeColor`, `openGraph`, `manifest` link.

**C5 — Tests + CI**
- Añadir `vitest`, `testing-library/react`, `playwright` (e2e: start → tick → notif).
- GitHub Action: `lint` + `typecheck` + `test` + `build` en PR.

### 4.2 P1 — Pulido de UX/UI

**C6 — Accesibilidad (a11y)**
- Focus trap + `aria-live="polite"` en `Toast.tsx`, `role="status"` en `SessionBar`.
- Labels asociados a los 3 inputs de `SettingsSheet.tsx:175` (añadir `id` + `htmlFor`).
- Auditoría Lighthouse a11y ≥95 (hoy no medida).
- Contraste de `text-faint`/`text-subtle` sobre `bg-surface` — verificar WCAG AA.

**C7 — Micro-interacciones**
- Animación del `ProgressRing` con `motion`/`framer-motion` o CSS `transition` más elástica.
- Confetti / haptics (`navigator.vibrate`) al completar ciclo de `sessions`.
- Sonido de tick opcional en últimos 5s (toggle en Settings).

**C8 — Onboarding y empty states**
- Primer visita: tooltip/coachmark explicando Classic vs Flex (hoy el usuario aterriza sin contexto).
- Estado vacío de perfiles con ilustración + CTA "Create your first profile".

**C9 — Responsive y PiP**
- `PipTimer.tsx` hoy es minimal: añadir barra de progreso y `ends HH:MM` también en PiP (consistente con `ProgressRing`).
- Soporte teclado en PiP (delegar `postMessage` desde `pipWindow`).

**C10 — Tema claro + densidad**
- Hoy solo dark (`globals.css:8`). Añadir `prefers-color-scheme` real o toggle Light/Dark con `next-themes`.

### 4.3 P2 — Robustez

**C11 — Manejo de permisos de Notification**
- UI que explica por qué se piden (hoy se pide al montar si `notificationsEnabled`). Pasar a pedir solo tras gesto del usuario + fallback visual si `denied`.

**C12 — Audio mejorado**
- Pre-cargar `AudioBuffer` de rain/white-noise una sola vez (hoy `createNoiseBuffer` genera 2s en cada `startAmbientSound`).
- Volumen configurable (slider 0-100%) y cross-fade al cambiar tipo.

---

## 5. Propuesta — Funcionalidades nuevas

### 5.1 P1 — Alto valor, bajo riesgo

**F1 — Historial y estadísticas locales**
- *Qué:* cada `onPhaseComplete` guarda `{date, phase, duration, mode, profileId}` en `localStorage` (`pomodoro-history`).
- *UI:* panel "History" con calendario, racha (streak), total de horas/focus hoy/semana, gráfico de barras por día (usar `recharts` o canvas ligero).
- *Por qué:* sin métricas el usuario no percibe progreso; es el feature más pedido en apps Pomodoro.
- *Complejidad:* Baja (solo local).

**F2 — Tareas asociadas al timer**
- *Qué:* input "What are you working on?" arriba del timer; lista de tareas con check. Al completar un focus, asocia la tarea y descuenta del estimado.
- *UI:* debajo del `ProgressRing`/`PhaseCard`, lista colapsable.
- *Ref:* inspirado en Pomofocus / Forest.

**F3 — Long break y ciclos configurables**
- *Qué:* `longBreakTime` (ej. 15m) + `longBreakInterval` (ej. cada 4 focus). Hoy `breakTime` es único.
- *Dónde:* `usePomodoro.ts:13` + `SettingsSheet.tsx:175` (4º campo).
- *Migración:* default `longBreakTime = breakTime`.

**F4 — Export / Import y Share**
- *Qué:* botones "Export profiles & history (JSON)" / "Import" + "Share profile" (copia URL con `?profile=base64` o QR).
- *Por qué:* backup y onboarding entre dispositivos sin backend.

**F5 — Presets de sonido y volumen por fase**
- *Qué:* elegir sonido de alerta (3-4 opciones generadas con Web Audio) + volumen maestro. Toggle "Tick in last 10s".

### 5.2 P2 — Valor medio, complejidad media

**F6 — Analytics de productividad**
- *Qué:* dashboard con: foco por día/semana, distribución por perfil, ratio focus/break en Flex, mejor hora del día.
- *Stack:* `recharts` + agregación en `utils/history.ts`.

**F7 — Mini calendario / Planificación de bloques**
- *Qué:* vista "Plan your day" donde el usuario apila perfiles (ej. 2× 50/10 + 1× 25/5) y ve la timeline con `ends HH:MM` por bloque.
- *Valor:* Flex ya es "block budget"; este feature lo hace planificable.

**F8 — PWA instalable + offline**
- *Qué:* `manifest.json`, `next-pwa`, icono por fase, `start_url: "/"`, `display: standalone`.
- *Bonus:* badge count con tiempo restante (`navigator.setAppBadge`).

**F9 — Atajos y command palette**
- *Qué:* `Cmd+K` abre palette: "Start/Pause", "Switch phase", "Apply profile X", "Enable PiP".
- *Lib:* `cmdk`.

### 5.3 P3 — Visión / requieren backend

**F10 — Sincronización cloud (opt-in)**
- *Qué:* auth (email / OAuth) + sync de perfiles/historial. Backend ligero (Supabase / Firebase / Next API + Postgres).
- *Por qué:* el `localStorage` no cruza dispositivos; es la queja #1 cuando el usuario valora la app.

**F11 — Modo colaborativo / Room**
- *Qué:* sala compartida donde varios usuarios ven el mismo timer (WebSocket / Supabase Realtime). Para pair-programming o study rooms.
- *Inspiración:* Flocus, Study Together.

**F12 — Integraciones**
- *Qué:* webhook / API para marcar tarea en Todoist/Notion/Linear al completar focus; calendario (Google Calendar) que bloquea "Focus time".
- *Primero:* exportar `.ics` de bloques planificados (sin OAuth).

**F13 — Gamificación ligera**
- *Qué:* rachas, niveles, "Focus pet" que crece con horas. Mantenerlo opcional y no infantilizar.

---

## 6. Priorización sugerida (MoSCoW adaptado)

| Prioridad | Items | Esfuerzo | Impacto |
|-----------|-------|----------|---------|
| **Must (próx. 2 semanas)** | C1, C2, C3, C4, C5, C6-a11y-básico, F1 (hist. mínimo) | M | Alto |
| **Should (1 mes)** | C7, C8, C9, F2 (tareas), F3 (long break), F4 (export) | M | Alto |
| **Could (2-3 meses)** | C10 (tema claro), C12, F6, F7, F8 (PWA), F9 | L | Medio |
| **Won't / Future** | F10, F11, F12, F13 | XL | Alto pero con backend |

### Roadmap visual (3 sprints)

```
Sprint 1 — Calidad
  [C1] versionado storage  [C3] estabilizar timer  [C5] tests+CI  [C4] SEO
Sprint 2 — Producto
  [F1] historial  [F2] tareas  [F3] long break  [F4] export/import  [C8] onboarding
Sprint 3 — Pulido
  [F8] PWA  [C6] a11y full  [C7] micro-interacciones  [F6] dashboard  [C10] light mode
```

---

## 7. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| `localStorage` se llena / falla en privado | Try/catch ya existe (`storage.ts:40`), pero añadir quota check + fallback a memoria + aviso en Toast |
| Document PiP no soportado (Firefox/Safari) | Ya está oculto con `isSupported` (`PomodoroContainer.tsx:273`), mantener banner "Try Chrome/Edge for always-on-top" |
| Autoplay bloqueado para audio | Mensaje "Click to enable sound" si `AudioContext.state === "suspended"` |
| Flex confuso para nuevos usuarios | Onboarding + tooltip en `PhaseCard.tsx:63` ("banked = tiempo que te queda de la otra fase") |

---

## 8. Métricas de éxito

- **Retención:** % usuarios que vuelven al día 7 (con historial local se puede medir).
- **Activación Flex:** % sesiones iniciadas en Flex (objetivo >30% si se comunica bien).
- **Completitud:** ratio de ciclos completados vs abandonados.
- **Calidad:** Lighthouse Performance ≥90, a11y ≥95, 0 errores de hidratación en prod.

---

## 9. Próximos pasos concretos

1. **Decidir alcance Sprint 1** con el equipo (este doc propone Must).
2. **Crear issues** a partir de C1-C6 y F1 con etiquetas `tech-debt`, `enhancement`, `a11y`.
3. **Añadir `vitest` + primer test de `usePomodoro`** como prueba de CI.
4. **Diseñar F1/F2 en Figma** tomando `reference.html` como base (mantener tokens de `globals.css:7`).
5. **Actualizar `CHANGELOG.md`** tras cada sprint siguiendo `AGENTS.md` (entrada `## YYYY-MM-DD` + commit Conventional).

---

## 10. Referencias internas

- Timer y persistencia: `src/app/hooks/usePomodoro.ts:1`, `src/app/utils/storage.ts:1`
- Perfiles: `src/app/hooks/useProfiles.ts:1`, `src/app/utils/profiles.ts:1`
- Contenedor principal: `src/app/components/pomodoro/PomodoroContainer.tsx:1`
- Diseño de referencia: `reference.html:1`, `src/app/globals.css:1`
- Changelog: `CHANGELOG.md:1`

---

*Este documento vive en `docs/propuesta-mejoras.md` y debe evolucionar con cada sprint. Si se implementa un item, moverlo a `CHANGELOG.md` y tacharlo aquí.*
