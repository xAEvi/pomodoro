"use client";

import React, { useEffect, useRef, useState } from "react";
import { PomodoroProfile } from "../../utils/profiles";
import {
  CheckIcon,
  ChevronDownIcon,
  GripIcon,
  MoreVerticalIcon,
  PencilIcon,
  StarIcon,
  TrashIcon,
} from "./icons";

interface ProfileSelectorProps {
  profiles: PomodoroProfile[];
  activeProfile: PomodoroProfile | undefined;
  defaultProfileId: string;
  disabled: boolean;
  onSelect: (profile: PomodoroProfile) => void;
  onEdit: (profile: PomodoroProfile) => void;
  onSetDefault: (profile: PomodoroProfile) => void;
  onDelete: (profile: PomodoroProfile) => void;
  onReorder: (orderedIds: string[]) => void;
}

export default function ProfileSelector({
  profiles,
  activeProfile,
  defaultProfileId,
  disabled,
  onSelect,
  onEdit,
  onSetDefault,
  onDelete,
  onReorder,
}: ProfileSelectorProps) {
  const [open, setOpen] = useState(false);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setMenuFor(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setMenuFor(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleDrop = (targetId: string) => {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setDragOverId(null);
      return;
    }

    const ids = profiles.map((p) => p.id);
    const fromIndex = ids.indexOf(dragId);
    const toIndex = ids.indexOf(targetId);
    ids.splice(fromIndex, 1);
    ids.splice(toIndex, 0, dragId);

    onReorder(ids);
    setDragId(null);
    setDragOverId(null);
  };

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="w-full flex items-center justify-between bg-white/[0.04] rounded-[10px] px-3 py-2.5 text-left disabled:opacity-50 transition-colors hover:bg-white/[0.06]"
      >
        <span className="text-sm text-ink font-medium">
          {activeProfile ? activeProfile.name : "Custom"}
        </span>
        <ChevronDownIcon
          className={`w-4 h-4 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1.5 z-20 bg-surface border border-line rounded-[10px] shadow-xl overflow-hidden"
          role="listbox"
        >
          {profiles.map((profile) => {
            const isActive = activeProfile?.id === profile.id;
            const isDefault = profile.id === defaultProfileId;

            return (
              <div
                key={profile.id}
                draggable
                onDragStart={() => setDragId(profile.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverId !== profile.id) setDragOverId(profile.id);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(profile.id);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setDragOverId(null);
                }}
                className={`relative flex items-center gap-1.5 px-2 py-2 border-b border-line-soft last:border-b-0 transition-colors ${
                  dragOverId === profile.id && dragId && dragId !== profile.id
                    ? "bg-white/[0.06]"
                    : ""
                } ${dragId === profile.id ? "opacity-40" : ""}`}
              >
                <span className="text-faint shrink-0 cursor-grab active:cursor-grabbing">
                  <GripIcon className="w-3.5 h-3.5" />
                </span>

                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onSelect(profile);
                    setOpen(false);
                  }}
                  className="flex-1 min-w-0 flex items-center gap-1.5 text-left"
                >
                  {isDefault && (
                    <StarIcon
                      filled
                      className="w-3 h-3 text-focus shrink-0"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="block text-[13px] text-ink truncate">
                      {profile.name}
                    </span>
                    <span className="block text-[11px] text-faint">
                      {profile.focusTime}/{profile.breakTime} ·{" "}
                      {profile.sessions}x
                    </span>
                  </span>
                  {isActive && (
                    <CheckIcon className="w-3.5 h-3.5 text-focus shrink-0 ml-auto" />
                  )}
                </button>

                <div className="relative shrink-0">
                  <button
                    type="button"
                    aria-label="Más opciones"
                    onClick={() =>
                      setMenuFor((prev) => (prev === profile.id ? null : profile.id))
                    }
                    className="w-6 h-6 flex items-center justify-center rounded-md text-muted hover:text-ink hover:bg-white/5 transition-colors"
                  >
                    <MoreVerticalIcon className="w-4 h-4" />
                  </button>

                  {menuFor === profile.id && (
                    <div className="absolute right-0 top-7 z-30 w-44 bg-surface border border-line rounded-[10px] shadow-xl overflow-hidden py-1">
                      <button
                        type="button"
                        onClick={() => {
                          onEdit(profile);
                          setMenuFor(null);
                          setOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-ink hover:bg-white/5 transition-colors"
                      >
                        <PencilIcon className="w-3.5 h-3.5" />
                        Editar
                      </button>
                      {!isDefault && (
                        <button
                          type="button"
                          onClick={() => {
                            onSetDefault(profile);
                            setMenuFor(null);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-ink hover:bg-white/5 transition-colors"
                        >
                          <StarIcon className="w-3.5 h-3.5" />
                          Establecer predeterminado
                        </button>
                      )}
                      {!profile.isPredefined && (
                        <button
                          type="button"
                          onClick={() => {
                            onDelete(profile);
                            setMenuFor(null);
                            setOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[13px] text-focus hover:bg-white/5 transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" />
                          Eliminar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
