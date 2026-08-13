# PWA — Ideas de implementación para el Pomodoro

Catálogo de capacidades que la app puede aprovechar ahora que es una PWA instalable.
Ordenado por relación impacto/esfuerzo, con notas honestas de soporte por navegador.

## Punto de partida (ya implementado)

- `src/app/manifest.ts` — manifest instalable (standalone, tema oscuro).
- `src/app/icon.tsx`, `apple-icon.tsx`, `icon-*.png/route.tsx` — íconos generados con `next/og`.
- `public/sw.js` — service worker: network-first para HTML, cache-first para assets.
- `src/app/hooks/useInstallPrompt.ts` + fila "Install app" en `SettingsSheet`.
- `src/app/hooks/useWakeLock.ts` + toggle "Keep screen awake" en `SettingsSheet` (idea 1).
- `shortcuts` en `manifest.ts` + lógica de aplicación en `PomodoroContainer` (idea 2).
- `src/app/hooks/useServiceWorkerUpdate.ts` + `UpdateBanner` (idea 5).
- `src/app/hooks/useMediaSession.ts` + toggle "Lock screen controls" en `SettingsSheet` (idea 7).

**Ventaja estructural que ya tienes:** `usePomodoro` calcula el tiempo restante contra
`endTimeRef` (un timestamp absoluto), no acumulando ticks. Por eso el timer sobrevive al
throttling de pestañas en background y a un refresh. Varias ideas de abajo dependen de eso.

---

## Tabla resumen

| # | Idea | Impacto | Esfuerzo | Soporte |
|---|------|---------|----------|---------|
| 1 | ✅ Screen Wake Lock | Alto | Bajo | Amplio |
| 2 | ✅ Atajos en el manifest | Alto | Bajo | Chromium, Safari parcial |
| 3 | Badge en el ícono | Medio | Bajo | Chromium, Safari macOS |
| 4 | Almacenamiento persistente | Medio | Muy bajo | Chromium, Firefox |
| 5 | ✅ Aviso de nueva versión | Medio | Bajo | Amplio |
| 6 | `launch_handler: focus-existing` | Medio | Muy bajo | Chromium |
| 7 | ✅ Media Session (controles en pantalla bloqueada) | Alto | Medio | Amplio (con truco) |
| 8 | Vibración al terminar fase | Medio | Muy bajo | Android; **no** iOS |
| 9 | Historial y estadísticas (IndexedDB) | Alto | Medio-alto | Amplio |
| 10 | Exportar/importar perfiles | Medio | Medio | Con fallback: amplio |
| 11 | Push notifications reales | Alto | Alto (backend) | Amplio, con requisitos |
| 12 | Window Controls Overlay (escritorio) | Bajo | Bajo | Chromium escritorio |
| 13 | Idle Detection (auto-pausa) | Medio | Medio | Solo Chromium |
| 14 | Web Share | Bajo | Muy bajo | Móvil + Safari |

---

## Nivel 1 — Alto impacto, bajo esfuerzo

### ✅ 1. Screen Wake Lock — que no se apague la pantalla en foco

**Implementado.** Ver `src/app/hooks/useWakeLock.ts` y el toggle "Keep screen awake" en
Settings. Aplicado a foco y break (no solo foco, como sugería el borrador original de
esta idea), con re-adquisición en `visibilitychange` verificada por test.

El caso de uso más obvio en móvil: dejas el celular al lado mirando el timer y la pantalla
se apaga a los 30 segundos.

```ts
// src/app/hooks/useWakeLock.ts
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const acquire = async () => {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // Denegado, batería baja o pestaña oculta; simplemente no se retiene la pantalla.
      }
    };
    acquire();

    // El SO libera el lock al ocultar la pestaña: hay que volver a pedirlo al regresar.
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !cancelled) acquire();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibility);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
```

Uso en `PomodoroContainer`: `useWakeLock(isRunning && currentPhase === "focus")`, con un
toggle en Settings ("Keep screen awake") porque no todos lo quieren.

**Gotcha:** el lock se pierde solo al minimizar; el listener de `visibilitychange` es
obligatorio, no opcional.

---

### ✅ 2. Atajos en el manifest — arrancar un perfil desde el ícono

**Implementado.** `manifest.ts` expone los 3 atajos (`?profile=<id>&start=1`);
`PomodoroContainer` los lee en el mount y limpia la URL enseguida para que un refresh no
vuelva a dispararlos.

**Gotcha real encontrado al implementarlo, no obvio de antemano:** React ejecuta *todos*
los efectos de un componente al menos una vez en el montaje, sin importar sus arrays de
dependencias — no solo el primero que "cambió". Un efecto que aplica el perfil
(`setFocusTime`/`setBreakTime`/`setSessions`) y un segundo efecto que arranca el timer
(`resetTimer` + `startTimer`) corren en el **mismo flush inicial**, así que el segundo
capturaba el closure viejo de `resetTimer` (con el `focusTime` por defecto, 25, no el del
perfil elegido) y el timer arrancaba con el tiempo equivocado. La solución fue que el
efecto de arranque ignore su primera ejecución (la de montaje) y actúe recién en la
siguiente pasada, cuando el cambio de perfil ya se re-renderizó de verdad y `resetTimer`
quedó recreado con el closure fresco. Se verificó con cuatro casos: visita fresca con
`start=1`, visita fresca sin `start`, id de perfil inexistente (perfil borrado) y —el que
expuso el bug— una sesión distinta ya en curso y "dirty" al momento de disparar el atajo.

Mantener presionado el ícono en Android (o click derecho en escritorio) muestra accesos
directos. Encaja perfecto con tus perfiles predefinidos de `utils/profiles.ts`.

```ts
// src/app/manifest.ts
shortcuts: [
  {
    name: "Start 25 / 5",
    short_name: "25 / 5",
    url: "/?profile=predefined-25-5&start=1",
    icons: [{ src: "/icon-192.png", sizes: "192x192" }],
  },
  { name: "Start 50 / 10", short_name: "50 / 10", url: "/?profile=predefined-50-10&start=1" },
  { name: "Start 90 / 20", short_name: "90 / 20", url: "/?profile=predefined-90-20&start=1" },
],
```

Del lado de la app, leer los params al montar (con `useSearchParams`) y aplicar el perfil
antes de arrancar. Ojo con el efecto que ya tienes en `PomodoroContainer` para el perfil
por defecto (`appliedInitialProfileRef`): el atajo debe tener prioridad sobre él.

Se puede extender a perfiles del usuario generando los shortcuts dinámicamente, aunque el
manifest es estático — se necesitaría una route handler que lo genere leyendo... nada, en
realidad el manifest no tiene acceso al localStorage del usuario. Quedarse con los tres
predefinidos es lo pragmático.

---

### 3. Badge en el ícono de la app

Un número sobre el ícono, sin abrir la app.

```ts
// Minutos restantes de la fase, o sesiones completadas.
if ("setAppBadge" in navigator) {
  isRunning
    ? navigator.setAppBadge(Math.ceil(timeLeft / 60))
    : navigator.clearAppBadge();
}
```

**Decisión de diseño:** actualizarlo cada minuto (no cada segundo) para no castigar la
batería. Alternativa más tranquila: mostrar sesiones completadas del ciclo en vez de
minutos, que cambia 4 veces por bloque en lugar de 25.

Solo funciona en la app **instalada**, no en pestaña normal.

---

### 4. Almacenamiento persistente — proteger el localStorage

Todo tu estado vive en `localStorage` (`utils/storage.ts` y `utils/profiles.ts`). El
navegador puede desalojarlo bajo presión de disco. Una línea lo evita:

```ts
if (navigator.storage?.persist) {
  const granted = await navigator.storage.persist();
}
```

En Chromium se concede automáticamente si la PWA está instalada. Barato y evita el peor
bug posible: "perdí todos mis perfiles".

---

### ✅ 5. Aviso de nueva versión disponible

**Implementado.** `sw.js` ya no llama `skipWaiting()` en `install`; el hook
`useServiceWorkerUpdate` detecta el worker nuevo en estado "waiting" (vía `updatefound` +
`statechange`) y `UpdateBanner` ofrece "Reload" o descartar el aviso.

**Ajuste sobre el borrador original de esta idea:** no se reutilizó el componente `Toast`
como se sugería acá — su contrato (auto-descarte a los 2.5s, sin botones) no encaja con
algo que requiere una decisión explícita del usuario. Se construyó un banner dedicado, con
el mismo lenguaje visual (píldora, mismo color) pero sin auto-dismiss y con dos acciones.

Verificado de punta a punta con Playwright, simulando un deploy nuevo (bump de
`CACHE_NAME` en el `sw.js` servido en disco, sin reiniciar el server): el worker nuevo
queda en "waiting" sin auto-activarse, el banner aparece, "Reload" dispara `skipWaiting` →
`activate` → `controllerchange` → recarga sola con la cache nueva, y el botón de descarte
solo oculta el aviso sin interrumpir el worker en espera ni la sesión en curso.

---

### 6. `launch_handler` — no abrir dos ventanas del mismo timer

Riesgo concreto con tu arquitectura: dos ventanas abiertas escriben al mismo
`localStorage` desde dos instancias de `usePomodoro`, pisándose entre sí.

```ts
// manifest.ts
launch_handler: { client_mode: "focus-existing" },
```

Complemento sin manifest, para pestañas normales: un `BroadcastChannel("pomodoro")` que
propague cambios de estado entre pestañas, o al menos que la segunda pestaña muestre "ya
hay una sesión corriendo en otra ventana".

---

## Nivel 2 — Alto impacto, esfuerzo medio

### ✅ 7. Media Session — controlar el timer desde la pantalla bloqueada

**Implementado.** `src/app/hooks/useMediaSession.ts` + toggle "Lock screen controls" en
`SettingsSheet` (apagado por defecto). El SO solo muestra estos controles si hay un
elemento de audio real reproduciendo — el sonido ambiental (`utils/audio.ts`) usa Web
Audio API pura, que no cuenta por sí sola. En vez de atarlo al ambiental (que viene
apagado por defecto y se pausa en break), se optó por un `AudioContext` propio con un
loop de silencio digital enrutado a un `<audio>` oculto vía `MediaStream` — así los
controles funcionan también en pausa y en break, no solo cuando el ambiental está sonando.

Reutiliza `isRunning`/`currentPhase`/`timeLeft`/`currentSession`/`sessions` ya calculados
en `PomodoroContainer` para el título (`"MM:SS - Focus"`), álbum (`"Session X of Y"`) y
artwork (`/icon-512.png`, ya servido). Action handlers: `play`/`pause`/`stop` (este último
mapea a terminar la sesión, no estaba en el sketch original).

**Dos bugs reales encontrados y corregidos durante la implementación (no de test, del
comportamiento real):**

1. **Race en el primer tick**: si el usuario pausaba dentro de los ~200ms posteriores a
   Start (antes de que el intervalo tickeara una vez), `isDirty` —la señal obvia para
   "hay una sesión en curso"— todavía era `false` porque depende de que `timeLeftFocus` ya
   haya decrementado. Resultado: los controles desaparecían al instante en vez de
   sobrevivir a la pausa, exactamente lo opuesto al objetivo. Se resolvió con una señal
   dedicada (`hasStartedSession`), que pasa a `true` apenas `isRunning` se observa `true`
   por primera vez, ajustada durante el render (patrón que React documenta para esto)
   en vez de en un efecto.
2. **El botón "stop" del lock screen no cerraba la sesión**: el handler llamaba al
   `resetTimer` crudo de `usePomodoro` en vez del `handleReset` que además limpia
   `hasStartedSession`, así que terminar la sesión desde el lock screen dejaba controles
   fantasma (audio y metadata seguían activos). Ahora usa el mismo `handleReset` que el
   botón Reset de la UI y el atajo de teclado `R`.

Verificado con Playwright interceptando `setActionHandler`/`.metadata`/`.playbackState` y
el estado real del `AudioContext`/`<audio>`: ciclo completo start→pause→resume-vía-
handler→pause-vía-handler→stop-vía-handler con limpieza total; apagar el toggle a mitad de
sesión limpia todo sin afectar el timer; la fila se oculta sin soporte del navegador;
persiste tras recargar.

---

### 8. Vibración al terminar una fase

```ts
// Junto a playAlertSound() en handlePhaseComplete
navigator.vibrate?.(completedPhase === "focus" ? [200, 100, 200] : 200);
```

Patrones distintos para fin de foco vs. fin de break. **No funciona en iOS Safari** (nunca
implementaron la API), así que es una mejora aditiva para Android.

---

### 9. Historial de sesiones y estadísticas

Hoy la app es amnésica: al terminar un ciclo no queda registro. Esta es probablemente la
feature con más valor real de toda la lista, y la PWA la potencia porque funciona offline.

- Guardar cada fase completada en **IndexedDB** (mejor que localStorage para series de
  datos): `{ fecha, tipo: "focus"|"break", minutos, perfilUsado }`.
- Una vista de estadísticas: minutos de foco por día, racha de días, hora del día en que
  más te concentras, perfil más usado.
- Enganche natural: `handlePhaseComplete` en `PomodoroContainer` ya es el punto exacto
  donde se sabe que una fase terminó.

Sugerencia de alcance mínimo para no sobre-construir: un heatmap tipo GitHub de las
últimas 12 semanas + total de la semana actual. Con eso ya se siente valioso.

---

### 10. Exportar / importar perfiles y estadísticas

Backup manual, útil para migrar de dispositivo sin backend.

```ts
// Chromium: diálogo nativo de guardar
const handle = await window.showSaveFilePicker({
  suggestedName: "pomodoro-backup.json",
  types: [{ description: "JSON", accept: { "application/json": [".json"] } }],
});
```

Con fallback universal para Safari/Firefox: generar un `Blob` y un `<a download>`
temporal. Para importar, un `<input type="file">` normal, validando el JSON contra la
forma de `PomodoroProfile` antes de escribirlo.

---

## Nivel 3 — Ambicioso (requiere backend)

### 11. Push notifications reales

**Este es el único camino honesto** para que suene una alerta cuando la app está
completamente cerrada. Hoy `notifyPhaseComplete` solo dispara si la página sigue viva.

Requiere:
- Un backend que guarde la suscripción push y programe el envío (`web-push` + claves VAPID).
- Vercel Cron o similar para disparar el push en el `endTime` de la sesión.
- En iOS: solo funciona si la PWA está **instalada** en pantalla de inicio (16.4+), nunca
  desde Safari en pestaña.

Contra-argumento razonable: para un Pomodoro puede ser sobre-ingeniería. Si la app está
cerrada, probablemente el usuario dejó de trabajar. El wake lock (idea 1) y Media Session
(idea 7) cubren el 90% del caso real por una fracción del costo.

### 11b. Sincronización entre dispositivos

Extensión natural del backend anterior: perfiles y estadísticas compartidos entre el
celular y la computadora. Cambia el proyecto de "app local" a "app con cuentas", con todo
lo que eso implica (auth, privacidad, costos). Decisión de producto, no técnica.

---

## Nivel 4 — Nicho / experimental

### 12. Window Controls Overlay (escritorio)

```ts
display_override: ["window-controls-overlay", "standalone"],
```

Permite dibujar en la barra de título de la ventana instalada — se podría poner el
`25:00 — Focus` ahí y ganar espacio vertical. Solo Chromium escritorio. Requiere manejar
`titlebar-area-*` en CSS y el caso "sin overlay".

### 13. Idle Detection — auto-pausa

Detectar que el usuario se fue de la máquina y pausar el foco automáticamente (o
preguntarle al volver: "estuviste ausente 8 minutos, ¿descontamos?"). Solo Chromium,
detrás de un permiso explícito, y con matices de privacidad. Interesante conceptualmente,
tibio en la práctica.

### 14. Web Share

Compartir un resumen ("hoy hice 6 sesiones de foco, 2h 30m") al portapapeles o a otra app.
Trivial de implementar (`navigator.share({ text })`), pero solo tiene sentido si antes
existe el historial de la idea 9.

### 15. Widgets de Windows 11

El manifest admite un campo `widgets` para el panel de widgets de Windows. Muy nicho
(solo Edge en Windows 11) y la especificación sigue moviéndose. Mencionado solo por
completitud.

---

## Lo que NO se puede hacer (y conviene saber antes de intentarlo)

- **Notification Triggers** (`showTrigger` / `TimestampTrigger`): la API que habría
  permitido programar una notificación local para un momento futuro sin backend. Estuvo en
  origin trial en Chrome y **nunca llegó a shipear**. Si ves tutoriales viejos
  recomendándola, están desactualizados. No es una opción.
- **Correr JavaScript en background de forma confiable**: ni el service worker ni
  `setInterval` sobreviven a que el navegador o el SO decidan dormir la app. Tu diseño con
  `endTime` absoluto es exactamente la mitigación correcta: la app no necesita "haber
  estado contando", recalcula al volver.
- **Periodic Background Sync**: existe, pero solo Chromium, exige app instalada y
  heurísticas de "engagement" que no controlas. No sirve para precisión de timer.
- **Publicar en App Store / Play Store**: una PWA no entra sola. En Android se puede
  empaquetar con Trusted Web Activity (Bubblewrap); en iOS, prácticamente no.
- **iOS en general**: sin Vibration API, push solo si está instalada, y `beforeinstallprompt`
  no existe — por eso tu implementación actual muestra instrucciones manuales ahí.

---

## Recomendación de orden

Si tuviera que elegir un camino:

1. **Wake Lock** (1) — resuelve la molestia más concreta en móvil, en una tarde.
2. **Atajos del manifest** (2) + **badge** (3) — hacen que se *sienta* app nativa.
3. **Aviso de actualización** (5) + **persistencia** (4) — higiene, evitan bugs raros.
4. **Historial y estadísticas** (9) — la que más valor agrega al producto en sí.
5. **Media Session** (7) — el remate para el uso móvil.

Los puntos 11 y siguientes solo si el proyecto va a crecer hacia algo multi-dispositivo.
