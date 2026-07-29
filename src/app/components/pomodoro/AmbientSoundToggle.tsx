"use client";

import React from "react";
import { AmbientSoundType } from "../../utils/audio";

interface AmbientSoundToggleProps {
  enabled: boolean;
  type: AmbientSoundType;
  onToggle: (enabled: boolean) => void;
  onTypeChange: (type: AmbientSoundType) => void;
}

const SOUND_OPTIONS: { value: AmbientSoundType; label: string }[] = [
  { value: "rain", label: "Rain" },
  { value: "white-noise", label: "White noise" },
];

export default function AmbientSoundToggle({
  enabled,
  type,
  onToggle,
  onTypeChange,
}: AmbientSoundToggleProps) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-zinc-900/20 border border-zinc-900 rounded-2xl">
      <label className="flex items-center justify-between gap-2 text-xs text-zinc-400 cursor-pointer select-none">
        <span>Ambient sound during focus</span>
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onToggle(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-zinc-700 bg-zinc-900 accent-white"
        />
      </label>

      {enabled && (
        <div className="flex gap-2">
          {SOUND_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onTypeChange(option.value)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-colors duration-150 ${
                type === option.value
                  ? "bg-zinc-800 border-zinc-700 text-white"
                  : "bg-zinc-900 border-zinc-850 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
