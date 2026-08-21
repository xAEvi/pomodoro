---
name: Pomodoro
description: Focused, distraction-free Pomodoro timer with dual-mode budgeting
colors:
  canvas: "#0B0D11"
  surface: "#101318"
  surface-soft: "rgba(255,255,255,0.04)"
  ink: "#F2F4F7"
  muted: "#8A929E"
  faint: "#6D7480"
  subtle: "#565C66"
  line: "rgba(255,255,255,0.09)"
  line-soft: "rgba(255,255,255,0.06)"
  focus: "#E24B4A"
  break: "#5DCAA5"
  cyan: "#22D3EE"
  focus-wash: "color-mix(in srgb, #E24B4A 18%, #0B0D11)"
  break-wash: "color-mix(in srgb, #5DCAA5 18%, #0B0D11)"
typography:
  display:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "38px"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "Geist Mono, monospace"
    fontSize: "22px"
    fontWeight: 400
    lineHeight: 1.1
  label:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    letterSpacing: "0.08em"
    textTransform: "lowercase"
  micro:
    fontFamily: "Geist Mono, monospace"
    fontSize: "10px"
    fontWeight: 400
  chip:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "12px"
    fontWeight: 500
  chip-sm:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "13px"
    fontWeight: 400
  title-sm:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "15px"
    fontWeight: 500
  pip-micro:
    fontFamily: "Geist Sans, sans-serif"
    fontSize: "9px"
    fontWeight: 400
  pip-display:
    fontFamily: "Geist Mono, monospace"
    fontSize: "24px"
    fontWeight: 500
rounded:
  sm: "6px"
  md: "10px"
  lg: "12px"
  xl: "16px"
  pill: "999px"
spacing:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 18px"
    height: "44px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
---

# Design System: Pomodoro

## Overview

**Creative North Star: "The Quiet Desk Instrument"**

A dark, instrument-like timer designed to stay legible at a glance and disappear when not needed. The canvas is near-black (#0B0D11) with tonal layering via surface (#101318) and 4% white soft fills — no light mode. Accent is surgical: focus coral (#E24B4A) and break mint (#5DCAA5) carry phase meaning only; everything else stays ink/muted on dark. Density is comfortable-airy: large mono numerals, generous padding, and a single hero element (ring or paired cards) per view.

**Key Characteristics:**
- Near-black canvas with tonal surfaces, no shadows
- Pill controls, 12-16px card radius, hairline 0.5px borders
- Geist Sans + Geist Mono, lowercase phase labels at 11px/0.08em
- Surgical accent: color only on active phase, ring, and progress

## Colors

Surgical dark palette: canvas does the work, accent signals phase.

### Primary
- **Focus Coral** (#E24B4A): Active focus phase — ring stroke, phase label, progress fill, active toggle. Wash is 18% mix over canvas for card backgrounds.

### Secondary
- **Break Mint** (#5DCAA5): Active break phase — same roles as focus but for break semantics. Wash at 18% over canvas.

### Neutral
- **Canvas** (#0B0D11): Page background.
- **Surface** (#101318): Cards, sheets, header — 0.5px line border at rgba(255,255,255,0.09).
- **Surface Soft** (rgba(255,255,255,0.04)): Input/field fills and secondary wells.
- **Ink** (#F2F4F7): Primary text, active pill, mono numerals.
- **Muted** (#8A929E): Secondary text, icons, unselected segment controls.
- **Faint** (#6D7480): Tertiary meta — ends time, session counts, hint text.
- **Subtle** (#565C66): Hint suffixes and disabled hints.
- **Line** (rgba(255,255,255,0.09)): Hairline dividers and card borders.
- **Cyan** (#22D3EE): Available accent token, not currently prominent in UI.

## Typography

**Display Font:** Geist Sans (with system fallback)
**Body Font:** Geist Sans
**Mono Font:** Geist Mono

**Character:** Technical, calm, and precise — sans for UI, mono for all numerals and timers. Lowercase phase labels at small size create a quiet instrument readout.

### Hierarchy
- **Display** (500, 38-40px mono, -0.02em): Central timer (17:42) in ring or flex card.
- **Title** (500, 14px sans): Header brand and sheet titles.
- **Body** (400, 13-14px sans): Controls, settings rows.
- **Label** (400, 11px sans, 0.08em, lowercase): Phase tags (focus/break), ends/session meta.
- **Mono Small** (400, 22px mono): Secondary break banked value.

## Layout

Single-column centered stack at max ~400px, mimicking a desk instrument. Header row (brand left, 32px icon cluster with 44px inclusive hit area right), segmented pill toggle for Classic/Flex, faint profile link (demoted, not pill), hero element (176px ring centered or paired phase cards), session/budget bar, then pill controls with `aria-keyshortcuts` and muted kbd legend. Settings sheet is full-width bottom card. Spacing rhythm 12-20px between sections, 8-10px inside cards. Grid in Settings uses auto-fit minmax 150px.

## Elevation & Depth

Flat by default. No shadows — depth via tonal layering (canvas #0B0D11 vs surface #101318) and hairline borders. Progress and rings provide the only dimensional cue via accent stroke. This keeps the timer honest on dark and prevents glow competition with the countdown.

## Shapes

Gently rounded instrument language. Cards at 12px (phase cards) to 16px (outer shell), field wells at 10px, toggles and primary buttons fully pill (999px). Borders are 0.5px hairlines at 9% white; active flex card uses 1px solid at 50% accent. Pill segmented control has off-white (#F2F4F7) active thumb on 5% white track.

## Components

### Buttons
- **Shape:** Pill (999px), 44px height.
- **Primary:** Ink (#F2F4F7) fill, surface (#101318) text, 14px medium — used for Pause/Start.
- **Ghost/Icon:** Transparent with 0.5px line border, muted icon, 44px circle — Reset.
- **Secondary pill:** 0.5px line border, ink text — Break switch in Flex.

### Chips
- **Style:** 12px, 6px vertical / 14px horizontal, pill. Selected is ink fill/surface text; unselected is 0.5px line border/muted text; custom dashed variant. Used for profile pills.

### Cards / Containers
- **Corner Style:** 12px (phase cards), 16px (outer, sheet).
- **Background:** Surface (#101318) on canvas; focus card wash at 7% when active.
- **Border:** 0.5px rgba(255,255,255,0.09); active focus 1px rgba(226,75,74,0.5).
- **Internal Padding:** 14-18px.

### Inputs / Fields
- **Style:** Surface-soft fill (4% white), 10px radius, 10px vertical padding.
- **Focus:** Hairline accent or ring, not shadow.

### Navigation
- **Segmented control:** 5% white track, pill, 3px padding; active thumb ink fill. Typography 12px medium.

## Do's and Don'ts

### Do:
- **Do** keep canvas #0B0D11 and surface #101318 as the only large fills — tonal layering, not shadows.
- **Do** use mono numerals at -0.02em for all time values.
- **Do** reserve focus/break accent strictly for active phase indicators.

### Don't:
- **Don't** introduce light backgrounds or colored surfaces beyond the 18% washes.
- **Don't** use drop shadows — depth is border + tone only.
- **Don't** uppercase phase labels — they are lowercase at 11px/0.08em.
