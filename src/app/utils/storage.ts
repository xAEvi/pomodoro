import type { PomodoroMode, PomodoroPhase } from "../hooks/usePomodoro";

const STORAGE_KEY = "pomodoro-state";

export interface PersistedPomodoroState {
  focusTime: number;
  breakTime: number;
  sessions: number;
  activeMode: PomodoroMode;
  currentPhase: PomodoroPhase;
  currentSession: number;
  isRunning: boolean;
  endTime: number | null;
  autoStart: boolean;
}

export function loadState(): Partial<PersistedPomodoroState> | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Partial<PersistedPomodoroState>;
  } catch {
    return null;
  }
}

export function saveState(state: PersistedPomodoroState): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage puede fallar (modo privado, cuota excedida, etc.); ignoramos silenciosamente.
  }
}
