# Flexible Pomodoro

This project is a Pomodoro timer created with Next.js and React, built specifically for my daily workflow. I had never seen a pomodoro that naturally incorporated a "flex" feature, so I vibe-coded it to use in my day-to-day.

## What it does

The application offers two modes:

- **Classic Mode**: automatically alternates between focus and rest once each interval ends.
- **Flexible Mode**: displays the focus and rest timers side-by-side, letting the user control when to switch phases.

In Flexible Mode, the total time is calculated by multiplying the focus and rest minutes by the configured number of sessions. This allows you to work in longer blocks and adapt them to a less rigid routine.

## Key Features

- **Progress at a glance**: a circular ring in Classic mode and a filled bar in Flex mode show how much of the current phase is left, plus an "ends HH:MM" readout so you don't have to do the math yourself.
- **Settings live behind the gear icon**: focus/break/session length, quick presets ("25/5", "50/10", "90/20"), auto-start, ambient sound, and notifications are all in one settings sheet you set once and forget, instead of a form permanently competing with the timer.
- Session progress bar showing how many sessions in the cycle are completed, with minutes left in the whole cycle (classic) or the block budget breakdown, e.g. `4 × 25/5 · 2 h 00 m` (flex).
- In Flex mode, the active phase card shows how many minutes of its total have been used (`62 of 100 used`) while the other phase stays visible but quiet as "banked" time.
- Persistent configuration and in-progress session: settings and a running timer survive a page refresh (restored from `localStorage`).
- Dynamic tab title (`25:00 - Focus`) and favicon color (red in focus, teal in break, gray when paused) so you can track the timer without the tab in focus.
- Browser notifications (toggle in settings) and a distinct alert sound when a phase ends, even if the tab isn't active.
- Optional ambient sound during focus (rain / white noise) — toggle from the header speaker icon or from settings.
- "Always-on-top" mode: pop the timer into a floating Picture-in-Picture window that stays visible over other apps.
- **Installable as an app (PWA)**: install it to your home screen or desktop from the "Install app" row in settings and it runs in its own window, offline included. On iOS Safari the row shows the manual "Add to Home Screen" steps instead, since it has no install prompt API.
- **Profile shortcuts from the installed icon**: long-press (Android) or right-click (desktop) the installed app icon to jump straight into a "25/5", "50/10", or "90/20" session, no need to open Settings first.
- **Keep screen awake** (optional, in settings): holds a screen wake lock while the timer runs so the display doesn't sleep mid-session. Off by default, and hidden on browsers without support.
- **Update notice**: when a new deploy is available, a banner offers to reload instead of applying it silently — a stale open tab won't suddenly break mid-session because it requested an asset that no longer exists.
- Keyboard shortcuts: `Space` to play/pause, `R` to reset, `T` to switch phase in Flex mode (shown in a footer hint).
- Click sounds on buttons for interface feedback.
- Modern dark-themed interface with smooth transitions and no layout jump when switching between Classic and Flex.
- Confirmation prompt before changing modes if the timer is already running.
- Mode-specific behavior:
  - In **classic**, the timer automatically alternates phases.
  - In **flex**, the user decides when to switch phases using the phase-switch button (labeled with the destination phase, e.g. "Break").

## Running locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the development server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

Other available scripts:

- `npm run build` — create a production build.
- `npm run start` — run the production build (after `npm run build`).
- `npm run lint` — run ESLint.

## How to use

1. Open the gear icon to adjust `Focus`, `Break`, and `Sessions` (or use a quick preset) before starting.
2. Press `Start` to begin.
3. In classic mode, the timer will alternate between focus and rest automatically.
4. In flexible mode, use the phase-switch button to move from focus to break and vice versa.
5. Press the reset icon to return to the initial state.

While the timer is active, settings are disabled to prevent inconsistent changes — the ambient sound and Picture-in-Picture toggles in the header stay available either way.

Click the floating-window icon next to the "Pomodoro" title to pop the timer into a Picture-in-Picture window (Start/Pause and the phase-switch button are also available there). This requires a Chromium-based browser with support for the [Document Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API); the button is hidden automatically if it's not supported.
