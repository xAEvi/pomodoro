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
    if (disabled || mode === activeMode) return;

    if (isDirty) {
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
  const message = dirtyDetail
    ? `Switch to ${pendingLabel}? Your current progress (${dirtyDetail}) will be reset.`
    : `Switch to ${pendingLabel}? The timer's current progress will be reset.`;

  return (
    <>
      <div
        className="flex bg-white/5 rounded-full p-[3px]"
        role="group"
        aria-label="Timer mode"
      >
        <button
          onClick={() => handleModeChange("classic")}
          disabled={disabled}
          aria-pressed={activeMode === "classic"}
          aria-label="Classic mode"
          title={disabled ? "Pause or reset to change mode" : undefined}
          className={`flex-1 min-w-0 text-center text-xs py-[5px] rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 truncate px-2 ${
            activeMode === "classic"
              ? "bg-ink text-[#101318] font-medium"
              : "text-muted hover:text-zinc-200 disabled:opacity-50 disabled:pointer-events-none"
          }`}
        >
          Classic
        </button>
        <button
          onClick={() => handleModeChange("flex")}
          disabled={disabled}
          aria-pressed={activeMode === "flex"}
          aria-label="Flex mode"
          title={disabled ? "Pause or reset to change mode" : undefined}
          className={`flex-1 min-w-0 text-center text-xs py-[5px] rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 truncate px-2 ${
            activeMode === "flex"
              ? "bg-ink text-[#101318] font-medium"
              : "text-muted hover:text-zinc-200 disabled:opacity-50 disabled:pointer-events-none"
          }`}
        >
          Flex
        </button>
      </div>

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
