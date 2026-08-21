"use client";

import React, { useState } from "react";
import { PomodoroMode } from "../../hooks/usePomodoro";
import { playClickSound } from "../../utils/audio";
import ConfirmModal from "./ConfirmModal";

interface ModeSelectorProps {
  activeMode: PomodoroMode;
  onChange: (mode: PomodoroMode) => void;
  disabled?: boolean;
  isDirty?: boolean;
  dirtyDetail?: string; // e.g., "14:22 left · Session 2 of 4" — shown in confirm copy
}

export default function ModeSelector({
  activeMode,
  onChange,
  disabled,
  isDirty,
  dirtyDetail,
}: ModeSelectorProps) {
  const [pendingMode, setPendingMode] = useState<PomodoroMode | null>(null);

  const handleModeChange = (mode: PomodoroMode) => {
    if (mode === activeMode) return;

    // Never block click when isRunning — confirm will explain pause + reset
    if (isDirty || disabled) {
      setPendingMode(mode);
      return;
    }

    playClickSound();
    onChange(mode);
  };

  const handleConfirm = () => {
    if (!pendingMode) return;
    const next = pendingMode;
    setPendingMode(null);
    playClickSound();
    onChange(next);
  };

  const handleCancel = () => setPendingMode(null);

  const isConfirmOpen = pendingMode !== null;
  const pendingLabel = pendingMode === "classic" ? "Classic" : "Flex";
  const pendingIsDirty = isDirty || Boolean(disabled && dirtyDetail);
  const message = pendingIsDirty && dirtyDetail
    ? `Switch to ${pendingLabel}? ${disabled ? "This will pause the timer. " : ""}Your current progress (${dirtyDetail}) will be reset.`
    : pendingIsDirty
      ? `Switch to ${pendingLabel}? ${disabled ? "This will pause the timer and " : ""}The timer's current progress will be reset.`
      : `Switch to ${pendingLabel}?`;

  return (
    <>
      <div
        className="flex bg-white/5 rounded-full p-[3px]"
        role="group"
        aria-label="Timer mode"
        aria-describedby={disabled ? "mode-hint" : undefined}
      >
        <button
          onClick={() => handleModeChange("classic")}
          aria-pressed={activeMode === "classic"}
          aria-label="Classic mode"
          title={disabled ? "Will pause and switch to Classic" : undefined}
          className={`flex-1 min-w-0 text-center text-xs py-[5px] rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 truncate px-2 ${
            activeMode === "classic"
              ? "bg-ink text-[#101318] font-medium"
              : "text-muted hover:text-zinc-200"
          }`}
        >
          Classic
        </button>
        <button
          onClick={() => handleModeChange("flex")}
          aria-pressed={activeMode === "flex"}
          aria-label="Flex mode"
          title={disabled ? "Will pause and switch to Flex" : undefined}
          className={`flex-1 min-w-0 text-center text-xs py-[5px] rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 truncate px-2 ${
            activeMode === "flex"
              ? "bg-ink text-[#101318] font-medium"
              : "text-muted hover:text-zinc-200"
          }`}
        >
          Flex
        </button>
      </div>
      {disabled && !isConfirmOpen && (
        <p id="mode-hint" className="mt-1.5 text-center text-[11px] text-faint">
          Pauses to switch modes
        </p>
      )}

      <ConfirmModal
        open={isConfirmOpen}
        title="Change mode?"
        message={message}
        confirmLabel={`Switch to ${pendingLabel}`}
        cancelLabel="Keep current"
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}
