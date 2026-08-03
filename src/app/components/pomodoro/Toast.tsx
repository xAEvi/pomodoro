"use client";

import React, { useEffect } from "react";

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

export default function Toast({ message, onDismiss }: ToastProps) {
  useEffect(() => {
    if (!message) return;
    const timeout = setTimeout(onDismiss, 2500);
    return () => clearTimeout(timeout);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] bg-ink text-[#101318] text-[13px] font-medium px-4 py-2.5 rounded-full shadow-xl"
    >
      {message}
    </div>
  );
}
