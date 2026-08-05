"use client";

import React, { useEffect, useRef, useState } from "react";
import { PomodoroProfile } from "../../utils/profiles";
import { formatDurationHM } from "../../utils/time";
import { CloseIcon } from "./icons";
import type { ProfileFormData } from "../../hooks/useProfiles";

const FOCUS_LIMITS = { min: 1, max: 120 };
const BREAK_LIMITS = { min: 1, max: 60 };
const SESSIONS_LIMITS = { min: 1, max: 10 };

interface ProfileModalProps {
  open: boolean;
  profile: PomodoroProfile | null; // null = create, defined = edit
  onClose: () => void;
  onSave: (data: ProfileFormData) => void;
}

export default function ProfileModal({
  open,
  profile,
  onClose,
  onSave,
}: ProfileModalProps) {
  const [name, setName] = useState(profile?.name ?? "");
  const [focusTime, setFocusTime] = useState(profile?.focusTime ?? 25);
  const [breakTime, setBreakTime] = useState(profile?.breakTime ?? 5);
  const [sessions, setSessions] = useState(profile?.sessions ?? 4);
  const [error, setError] = useState<string | null>(null);
  const overlayMouseDownRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const totalMinutes = sessions * (focusTime + breakTime);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Profile name is required.");
      return;
    }
    if (focusTime < FOCUS_LIMITS.min || focusTime > FOCUS_LIMITS.max) {
      setError(`Focus must be between ${FOCUS_LIMITS.min} and ${FOCUS_LIMITS.max} min.`);
      return;
    }
    if (breakTime < BREAK_LIMITS.min || breakTime > BREAK_LIMITS.max) {
      setError(`Break must be between ${BREAK_LIMITS.min} and ${BREAK_LIMITS.max} min.`);
      return;
    }
    if (sessions < SESSIONS_LIMITS.min || sessions > SESSIONS_LIMITS.max) {
      setError(`Sessions must be between ${SESSIONS_LIMITS.min} and ${SESSIONS_LIMITS.max}.`);
      return;
    }

    onSave({ name: trimmedName, focusTime, breakTime, sessions });
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      onMouseDown={(e) => {
        overlayMouseDownRef.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && overlayMouseDownRef.current)
          onClose();
      }}
      role="presentation"
    >
      <div
        className="w-full sm:max-w-md bg-surface border border-line rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={profile ? "Edit profile" : "Create profile"}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-ink text-sm font-medium">
            {profile ? "Edit profile" : "Create profile"}
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-ink transition-colors"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <label className="block mb-4">
          <span className="block text-[11px] text-muted mb-1.5">
            Profile name
          </span>
          <input
            type="text"
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            placeholder="E.g: Coding, Extended break"
            className="w-full bg-white/[0.04] rounded-[10px] px-3 py-2.5 text-sm text-ink placeholder:text-faint focus:outline-none focus:ring-1 focus:ring-white/20"
          />
        </label>

        <div className="grid grid-cols-3 gap-3 mb-4">
          <label className="bg-white/[0.04] rounded-[10px] px-3 py-2.5 block">
            <span className="block text-[11px] text-muted mb-1">Focus</span>
            <span className="flex items-baseline justify-between gap-1">
              <input
                type="number"
                min={FOCUS_LIMITS.min}
                max={FOCUS_LIMITS.max}
                value={focusTime}
                onChange={(e) =>
                  setFocusTime(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full min-w-0 font-mono text-xl text-ink bg-transparent focus:outline-none"
              />
              <span className="text-[11px] text-faint shrink-0">min</span>
            </span>
          </label>

          <label className="bg-white/[0.04] rounded-[10px] px-3 py-2.5 block">
            <span className="block text-[11px] text-muted mb-1">Break</span>
            <span className="flex items-baseline justify-between gap-1">
              <input
                type="number"
                min={BREAK_LIMITS.min}
                max={BREAK_LIMITS.max}
                value={breakTime}
                onChange={(e) =>
                  setBreakTime(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full min-w-0 font-mono text-xl text-ink bg-transparent focus:outline-none"
              />
              <span className="text-[11px] text-faint shrink-0">min</span>
            </span>
          </label>

          <label className="bg-white/[0.04] rounded-[10px] px-3 py-2.5 block">
            <span className="block text-[11px] text-muted mb-1">
              Sessions
            </span>
            <span className="flex items-baseline justify-between gap-1">
              <input
                type="number"
                min={SESSIONS_LIMITS.min}
                max={SESSIONS_LIMITS.max}
                value={sessions}
                onChange={(e) =>
                  setSessions(Math.max(0, parseInt(e.target.value) || 0))
                }
                className="w-full min-w-0 font-mono text-xl text-ink bg-transparent focus:outline-none"
              />
            </span>
          </label>
        </div>

        <div className="flex items-center justify-between text-[11px] text-faint mb-5">
          <span>Estimated total duration</span>
          <span className="text-ink font-mono">
            {formatDurationHM(totalMinutes)}
          </span>
        </div>

        {error && (
          <p className="text-[12px] text-focus mb-4" role="alert">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3.5 py-2 rounded-full border border-white/[0.14] text-[#C9CFD8] hover:border-white/30 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="text-xs px-3.5 py-2 rounded-full bg-ink text-[#101318] font-medium hover:bg-ink/90 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
