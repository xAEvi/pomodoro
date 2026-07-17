# Flexible Pomodoro

This project is a Pomodoro timer created with Next.js and React, built specifically for my daily workflow. I had never seen a pomodoro that naturally incorporated a "flex" feature, so I vibe-coded it to use in my day-to-day.

## What it does

The application offers two modes:

- **Classic Mode**: automatically alternates between focus and rest once each interval ends.
- **Flexible Mode**: displays the focus and rest timers side-by-side, letting the user control when to switch phases.

In Flexible Mode, the total time is calculated by multiplying the focus and rest minutes by the configured number of sessions. This allows you to work in longer blocks and adapt them to a less rigid routine.

## Key Features

- Configuration for focus minutes, rest minutes, and number of sessions.
- Click sounds on buttons and an alert sound when a phase ends.
- Modern dark-themed interface with smooth transitions.
- Confirmation prompt before changing modes if the timer is already running.
- Mode-specific behavior:
  - In **classic**, the timer automatically alternates phases.
  - In **flex**, the user decides when to switch phases using the "Toggle Phase" button.

## How to use

1. Adjust the values for `Focus`, `Break`, and `Sessions` before starting.
2. Press `Start` to begin.
3. In classic mode, the timer will alternate between focus and rest automatically.
4. In flexible mode, use `Toggle Phase` to switch from focus to rest and vice versa.
5. Press `Reset` to return to the initial state.

While the timer is active, configuration controls are disabled to prevent inconsistent changes.
