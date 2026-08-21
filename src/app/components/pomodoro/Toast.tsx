"use client";

import React, { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

export default function Toast({ message, onDismiss, actionLabel, onAction, duration = 3500 }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(onDismiss, duration);
    return () => clearTimeout(timeout);
  }, [message, onDismiss, duration]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[69] bg-ink text-[#101318] text-[13px] font-medium px-4 py-2.5 rounded-full shadow-xl max-w-[90vw] flex items-center gap-2 whitespace-nowrap"
    >
      <span className="truncate">{message}</span>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={() => {
            onAction();
            onDismiss();
          }}
          className="shrink-0 ml-1 px-3 py-1 rounded-full bg-[#101318] text-ink text-xs font-medium hover:bg-[#1a1d22] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
