"use client";

import React from "react";

import { PomodoroMode } from "../../hooks/usePomodoro";

interface Preset {
  label: string;
  focusTime: number;
  breakTime: number;
}

const PRESETS: Preset[] = [
  { label: "25/5", focusTime: 25, breakTime: 5 },
  { label: "50/10", focusTime: 50, breakTime: 10 },
  { label: "90/20", focusTime: 90, breakTime: 20 },
];

interface SettingsFormProps {
  focusTime: number;
  breakTime: number;
  sessions: number;
  setFocusTime: (value: number) => void;
  setBreakTime: (value: number) => void;
  setSessions: (value: number) => void;
  disabled: boolean;
  activeMode: PomodoroMode;
  autoStart: boolean;
  setAutoStart: (value: boolean) => void;
}

export default function SettingsForm({
  focusTime,
  breakTime,
  sessions,
  setFocusTime,
  setBreakTime,
  setSessions,
  disabled,
  activeMode,
  autoStart,
  setAutoStart,
}: SettingsFormProps) {
  return (
    <div
      className={`flex flex-col gap-3 p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl transition-opacity duration-200 ${
        disabled ? "opacity-50 pointer-events-none" : "opacity-100"
      }`}
    >
      <div className="flex gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={disabled}
            onClick={() => {
              setFocusTime(preset.focusTime);
              setBreakTime(preset.breakTime);
            }}
            className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors duration-150 disabled:opacity-60"
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Focus (min)
          </label>
          <input
            type="number"
            min="1"
            max="120"
            value={focusTime}
            disabled={disabled}
            onChange={(e) =>
              setFocusTime(Math.max(1, parseInt(e.target.value) || 0))
            }
            className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700 disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Break (min)
          </label>
          <input
            type="number"
            min="1"
            max="60"
            value={breakTime}
            disabled={disabled}
            onChange={(e) =>
              setBreakTime(Math.max(1, parseInt(e.target.value) || 0))
            }
            className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700 disabled:opacity-60"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
            Sessions
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={sessions}
            disabled={disabled}
            onChange={(e) =>
              setSessions(Math.max(1, parseInt(e.target.value) || 0))
            }
            className="w-full bg-zinc-900 border border-zinc-850 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-zinc-700 disabled:opacity-60"
          />
        </div>
      </div>

      {activeMode === "classic" && (
        <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={autoStart}
            disabled={disabled}
            onChange={(e) => setAutoStart(e.target.checked)}
            className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 accent-white"
          />
          Auto-start next phase
        </label>
      )}
    </div>
  );
}
