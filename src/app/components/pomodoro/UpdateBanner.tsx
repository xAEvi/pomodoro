"use client";

import React from "react";
import { CloseIcon, RefreshIcon } from "./icons";

interface UpdateBannerProps {
  onReload: () => void;
  onDismiss: () => void;
}

export default function UpdateBanner({ onReload, onDismiss }: UpdateBannerProps) {
  return (
    <div
      role="status"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-3 bg-ink text-[#101318] text-[13px] font-medium pl-4 pr-2 py-2 rounded-full shadow-xl"
    >
      <span>A new version is available</span>
      <button
        type="button"
        onClick={onReload}
        className="flex items-center gap-1 bg-[#101318] text-ink px-3 py-1.5 rounded-full hover:opacity-90 transition-opacity"
      >
        <RefreshIcon className="w-3.5 h-3.5" />
        Reload
      </button>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss update notice"
        className="text-[#101318]/60 hover:text-[#101318] p-1"
      >
        <CloseIcon className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
