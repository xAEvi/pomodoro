# Flexible Pomodoro

This project is a Pomodoro timer created with Next.js and React, built specifically for my daily workflow. I had never seen a pomodoro that naturally incorporated a "flex" feature, so I vibe-coded it to use in my day-to-day.

## What it does

The application offers two modes:

- **Classic Mode**: automatically alternates between focus and rest once each interval ends.
- **Flexible Mode**: displays the focus and rest timers side-by-side, letting the user control when to switch phases.

In Flexible Mode, the total time is calculated by multiplying the focus and rest minutes by the configured number of sessions. This allows you to work in longer blocks and adapt them to a less rigid routine.

## Key Features

- Configuration for focus minutes, rest minutes, and number of sessions, plus quick presets ("25/5", "50/10", "90/20") in classic mode.
- Auto-start toggle in classic mode to chain phases without pressing Start again.
- Persistent configuration and in-progress session: settings and a running timer survive a page refresh (restored from `localStorage`).
- Dynamic tab title (`25:00 - Focus`) and favicon color (red in focus, sky in break, gray when paused) so you can track the timer without the tab in focus.
- Browser notifications and a distinct alert sound when a phase ends, even if the tab isn't active.
- Optional ambient sound during focus (rain / white noise), toggle on/off.
- "Always-on-top" mode: pop the timer into a floating Picture-in-Picture window that stays visible over other apps.
- Keyboard shortcuts: `Space` to play/pause, `R` to reset, `T` to toggle phase in Flex mode.
- Session progress dots showing how many sessions in the cycle are completed.
- Click sounds on buttons for interface feedback.
- Modern dark-themed interface with smooth transitions.
- Confirmation prompt before changing modes if the timer is already running.
- Mode-specific behavior:
  - In **classic**, the timer automatically alternates phases.
  - In **flex**, the user decides when to switch phases using the "Toggle Phase" button.

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

1. Adjust the values for `Focus`, `Break`, and `Sessions` before starting (or use a quick preset in classic mode).
2. Press `Start` to begin.
3. In classic mode, the timer will alternate between focus and rest automatically.
4. In flexible mode, use `Toggle Phase` to switch from focus to rest and vice versa.
5. Press `Reset` to return to the initial state.

While the timer is active, configuration controls are disabled to prevent inconsistent changes.

Click the floating-window icon next to the "Pomodoro" title to pop the timer into a Picture-in-Picture window (Start/Pause and Toggle Phase are also available there). This requires a Chromium-based browser with support for the [Document Picture-in-Picture API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Picture-in-Picture_API); the button is hidden automatically if it's not supported.
