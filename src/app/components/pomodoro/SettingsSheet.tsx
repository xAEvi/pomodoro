"use client";

import React, { useState } from "react";
import { AmbientSoundType } from "../../utils/audio";
import { formatDurationHM } from "../../utils/time";
import { PomodoroProfile } from "../../utils/profiles";
import { ProfileFormData } from "../../hooks/useProfiles";
import { useInstallPrompt } from "../../hooks/useInstallPrompt";
import { CloseIcon, DownloadIcon, PlusIcon } from "./icons";
import ProfileSelector from "./ProfileSelector";
import ProfileModal from "./ProfileModal";
import ConfirmModal from "./ConfirmModal";
import Toast from "./Toast";

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
  wakeLockEnabled: boolean;
  setWakeLockEnabled: (value: boolean) => void;
  isWakeLockSupported: boolean;
  profiles: PomodoroProfile[];
  defaultProfileId: string;
  addProfile: (data: ProfileFormData) => PomodoroProfile;
  updateProfile: (id: string, data: ProfileFormData) => void;
  deleteProfile: (id: string) => void;
  setAsDefault: (id: string) => void;
  reorderProfiles: (orderedIds: string[]) => void;
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
  wakeLockEnabled,
  setWakeLockEnabled,
  isWakeLockSupported,
  profiles,
  defaultProfileId,
  addProfile,
  updateProfile,
  deleteProfile,
  setAsDefault,
  reorderProfiles,
}: SettingsSheetProps) {
  const [modalProfile, setModalProfile] = useState<PomodoroProfile | null | undefined>(
    undefined,
  ); // undefined = cerrado, null = crear, perfil = editar
  const [deleteTarget, setDeleteTarget] = useState<PomodoroProfile | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { canInstall, isStandalone, isIos, promptInstall } = useInstallPrompt();

  if (!open) return null;

  const activeProfile = profiles.find(
    (p) =>
      p.focusTime === focusTime && p.breakTime === breakTime && p.sessions === sessions,
  );
  const totalMinutes = sessions * (focusTime + breakTime);
  const ambientLabel = ambientSoundType === "rain" ? "Rain" : "White noise";
  const showInstallRow = !isStandalone && (canInstall || isIos);

  const applyProfile = (profile: PomodoroProfile) => {
    if (disabled) return;
    setFocusTime(profile.focusTime);
    setBreakTime(profile.breakTime);
    setSessions(profile.sessions);
  };

  const handleSaveProfile = (data: ProfileFormData) => {
    if (modalProfile) {
      updateProfile(modalProfile.id, data);
      // Si el perfil editado es el activo, reflejamos los nuevos valores de inmediato.
      if (
        activeProfile?.id === modalProfile.id ||
        (modalProfile.focusTime === focusTime &&
          modalProfile.breakTime === breakTime &&
          modalProfile.sessions === sessions)
      ) {
        applyProfile({ ...modalProfile, ...data });
      }
      setToastMessage(`Profile "${data.name}" updated`);
    } else {
      const created = addProfile(data);
      applyProfile(created);
      setToastMessage(`Profile "${data.name}" created`);
    }
    setModalProfile(undefined);
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const wasActive = activeProfile?.id === deleteTarget.id;
    deleteProfile(deleteTarget.id);
    setToastMessage(`Profile "${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
    if (wasActive) {
      const fallback = profiles.find((p) => p.id !== deleteTarget.id);
      if (fallback) applyProfile(fallback);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4"
      role="presentation"
    >
      <div
        className="w-full sm:max-w-md bg-surface border border-line rounded-t-2xl sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto"
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

        <div className="mb-4">
          <ProfileSelector
            profiles={profiles}
            activeProfile={activeProfile}
            defaultProfileId={defaultProfileId}
            disabled={disabled}
            onSelect={applyProfile}
            onEdit={(profile) => setModalProfile(profile)}
            onSetDefault={(profile) => {
              setAsDefault(profile.id);
              setToastMessage(`"${profile.name}" is now the default profile`);
            }}
            onDelete={(profile) => setDeleteTarget(profile)}
            onReorder={reorderProfiles}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 mb-3">
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

        <button
          type="button"
          disabled={disabled}
          onClick={() => setModalProfile(null)}
          className="w-full flex items-center justify-center gap-1.5 text-xs text-muted hover:text-ink py-2 mb-4 rounded-[10px] border border-dashed border-white/[0.14] hover:border-white/30 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          Create profile
        </button>

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
            className={`w-full flex items-center justify-between py-3 ${
              isWakeLockSupported || showInstallRow ? "border-b border-line-soft" : ""
            }`}
          >
            <span className="text-left">
              <span className="block text-[13px] text-ink">Notifications</span>
              <span className="block text-[11px] text-faint">
                Alert when a phase ends
              </span>
            </span>
            <Switch on={notificationsEnabled} />
          </button>

          {isWakeLockSupported && (
            <button
              type="button"
              onClick={() => setWakeLockEnabled(!wakeLockEnabled)}
              className={`w-full flex items-center justify-between py-3 ${
                showInstallRow ? "border-b border-line-soft" : ""
              }`}
            >
              <span className="text-left">
                <span className="block text-[13px] text-ink">Keep screen awake</span>
                <span className="block text-[11px] text-faint">
                  Prevents sleep while the timer runs
                </span>
              </span>
              <Switch on={wakeLockEnabled} />
            </button>
          )}

          {showInstallRow && (
            <div className="w-full flex items-center justify-between gap-3 py-3">
              <span className="text-left">
                <span className="block text-[13px] text-ink">Install app</span>
                <span className="block text-[11px] text-faint">
                  {isIos
                    ? 'Tap the Share icon, then "Add to Home Screen"'
                    : "Run Pomodoro offline from your home screen"}
                </span>
              </span>
              {canInstall && (
                <button
                  type="button"
                  onClick={promptInstall}
                  className="flex items-center gap-1.5 text-xs text-ink bg-white/[0.08] hover:bg-white/[0.14] px-3 py-1.5 rounded-full transition-colors shrink-0"
                >
                  <DownloadIcon className="w-3.5 h-3.5" />
                  Install
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <ProfileModal
        key={modalProfile === undefined ? "closed" : (modalProfile?.id ?? "create")}
        open={modalProfile !== undefined}
        profile={modalProfile ?? null}
        onClose={() => setModalProfile(undefined)}
        onSave={handleSaveProfile}
      />

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete this profile?"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <Toast message={toastMessage} onDismiss={() => setToastMessage(null)} />
    </div>
  );
}
