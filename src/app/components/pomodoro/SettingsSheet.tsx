"use client";

import React from "react";
import { AmbientSoundType } from "../../utils/audio";
import { formatDurationHM } from "../../utils/time";
import { CloseIcon } from "./icons";

interface Preset {
  label: string;
  focusTime: number;
  breakTime: number;
}

const PRESETS: Preset[] = [
  { label: "25 / 5", focusTime: 25, breakTime: 5 },
  { label: "50 / 10", focusTime: 50, breakTime: 10 },
  { label: "90 / 20", focusTime: 90, breakTime: 20 },
];

interface SettingsSheetProps {
  open: boolean;
  onClose: () => void;
  focusTime: number;
  breakTime: number;
  sessions: number;
  setFocusTime: (value: number) => void;
  setBreakTime: (value: number) => void;
  setSessions: (value: number) => void;
  disabled: boolean;
  autoStart: boolean;
  setAutoStart: (value: boolean) => void;
  ambientSoundEnabled: boolean;
  setAmbientSoundEnabled: (value: boolean) => void;
  ambientSoundType: AmbientSoundType;
  setAmbientSoundType: (value: AmbientSoundType) => void;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (value: boolean) => void;
}

function Switch({ on }: { on: boolean }) {
  return (
    <span
      className={`w-9 h-5 rounded-full flex items-center p-0.5 transition-colors ${
        on ? "bg-focus justify-end" : "bg-white/[0.14] justify-start"
      }`}
    >
      <span
        className={`w-4 h-4 rounded-full transition-colors ${on ? "bg-white" : "bg-muted"}`}
      />
    </span>
  );
}

export default function SettingsSheet({
  open,
  onClose,
  focusTime,
  breakTime,
  sessions,
  setFocusTime,
  setBreakTime,
  setSessions,
  disabled,
  autoStart,
  setAutoStart,
  ambientSoundEnabled,
  setAmbientSoundEnabled,
  ambientSoundType,
  setAmbientSoundType,
  notificationsEnabled,
  setNotificationsEnabled,
}: SettingsSheetProps) {
  if (!open) return null;

  const matchesPreset = PRESETS.some(
    (preset) => preset.focusTime === focusTime && preset.breakTime === breakTime,
  );
  const totalMinutes = sessions * (focusTime + breakTime);
  const ambientLabel = ambientSoundType === "rain" ? "Rain" : "White noise";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full sm:max-w-md bg-surface border border-line rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-ink text-sm font-medium">Settings</span>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="text-muted hover:text-ink transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`flex gap-2 mb-4 flex-wrap transition-opacity ${
            disabled ? "opacity-50 pointer-events-none" : ""
          }`}
        >
          {PRESETS.map((preset) => {
            const isActive =
              preset.focusTime === focusTime && preset.breakTime === breakTime;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setFocusTime(preset.focusTime);
                  setBreakTime(preset.breakTime);
                }}
                className={`text-xs px-3.5 py-1.5 rounded-full transition-colors ${
                  isActive
                    ? "bg-ink text-[#101318]"
                    : "border border-white/[0.14] text-[#C9CFD8] hover:border-white/30"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
          <span
            className={`text-xs px-3.5 py-1.5 rounded-full border border-dashed ${
              matchesPreset
                ? "border-white/[0.14] text-muted"
                : "border-white/30 text-[#C9CFD8]"
            }`}
          >
            Custom
          </span>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <label className="bg-white/[0.04] rounded-[10px] px-3 py-2.5 block">
            <span className="block text-[11px] text-muted mb-1">Focus</span>
            <span className="flex items-baseline justify-between gap-1">
              <input
                type="number"
                min={1}
                max={120}
                value={focusTime}
                disabled={disabled}
                onChange={(e) =>
                  setFocusTime(Math.max(1, parseInt(e.target.value) || 0))
                }
                className="w-full min-w-0 font-mono text-xl text-ink bg-transparent focus:outline-none disabled:opacity-60"
              />
              <span className="text-[11px] text-faint shrink-0">min</span>
            </span>
          </label>

          <label className="bg-white/[0.04] rounded-[10px] px-3 py-2.5 block">
            <span className="block text-[11px] text-muted mb-1">Break</span>
            <span className="flex items-baseline justify-between gap-1">
              <input
                type="number"
                min={1}
                max={60}
                value={breakTime}
                disabled={disabled}
                onChange={(e) =>
                  setBreakTime(Math.max(1, parseInt(e.target.value) || 0))
                }
                className="w-full min-w-0 font-mono text-xl text-ink bg-transparent focus:outline-none disabled:opacity-60"
              />
              <span className="text-[11px] text-faint shrink-0">min</span>
            </span>
          </label>

          <label className="bg-white/[0.04] rounded-[10px] px-3 py-2.5 block">
            <span className="block text-[11px] text-muted mb-1">Sessions</span>
            <span className="flex items-baseline justify-between gap-1">
              <input
                type="number"
                min={1}
                max={12}
                value={sessions}
                disabled={disabled}
                onChange={(e) =>
                  setSessions(Math.max(1, parseInt(e.target.value) || 0))
                }
                className="w-full min-w-0 font-mono text-xl text-ink bg-transparent focus:outline-none disabled:opacity-60"
              />
              <span className="text-[11px] text-faint shrink-0">
                = {formatDurationHM(totalMinutes)}
              </span>
            </span>
          </label>
        </div>

        <div className="border-t border-line-soft">
          <button
            type="button"
            disabled={disabled}
            onClick={() => setAutoStart(!autoStart)}
            className="w-full flex items-center justify-between py-3 border-b border-line-soft disabled:opacity-50"
          >
            <span className="text-left">
              <span className="block text-[13px] text-ink">
                Auto-start next phase
              </span>
              <span className="block text-[11px] text-faint">
                Classic mode only
              </span>
            </span>
            <Switch on={autoStart} />
          </button>

          <div className="w-full flex items-center justify-between py-3 border-b border-line-soft">
            <button
              type="button"
              onClick={() =>
                setAmbientSoundType(
                  ambientSoundType === "rain" ? "white-noise" : "rain",
                )
              }
              disabled={!ambientSoundEnabled}
              className="text-left disabled:opacity-50"
            >
              <span className="block text-[13px] text-ink">Ambient sound</span>
              <span className="block text-[11px] text-faint underline decoration-dotted underline-offset-2">
                {ambientLabel} · plays during focus
              </span>
            </button>
            <button
              type="button"
              onClick={() => setAmbientSoundEnabled(!ambientSoundEnabled)}
              aria-label="Toggle ambient sound"
            >
              <Switch on={ambientSoundEnabled} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className="w-full flex items-center justify-between py-3"
          >
            <span className="text-left">
              <span className="block text-[13px] text-ink">Notifications</span>
              <span className="block text-[11px] text-faint">
                Alert when a phase ends
              </span>
            </span>
            <Switch on={notificationsEnabled} />
          </button>
        </div>
      </div>
    </div>
  );
}
