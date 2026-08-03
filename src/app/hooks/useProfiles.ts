import { useCallback, useEffect, useState } from "react";
import {
  PomodoroProfile,
  PREDEFINED_PROFILES,
  createProfileId,
  loadProfiles,
  saveProfiles,
} from "../utils/profiles";

// Se calcula una sola vez al cargar el módulo, antes de que se inicialicen los estados.
const persisted = loadProfiles();

export type ProfileFormData = Omit<PomodoroProfile, "id" | "isPredefined">;

export function useProfiles() {
  const [profiles, setProfiles] = useState<PomodoroProfile[]>(
    persisted.profiles,
  );
  const [defaultProfileId, setDefaultProfileId] = useState(
    persisted.defaultProfileId,
  );

  // Persistimos perfiles y el predeterminado ante cualquier cambio.
  useEffect(() => {
    saveProfiles({ profiles, defaultProfileId });
  }, [profiles, defaultProfileId]);

  const defaultProfile =
    profiles.find((p) => p.id === defaultProfileId) ?? profiles[0];

  const addProfile = useCallback((data: ProfileFormData) => {
    const profile: PomodoroProfile = {
      ...data,
      id: createProfileId(),
      isPredefined: false,
    };
    setProfiles((prev) => [...prev, profile]);
    return profile;
  }, []);

  const updateProfile = useCallback((id: string, data: ProfileFormData) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...data } : p)),
    );
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles((prev) => {
      const remaining = prev.filter((p) => p.id !== id);
      return remaining;
    });
    setDefaultProfileId((prev) => {
      if (prev !== id) return prev;
      const remaining = profiles.filter((p) => p.id !== id);
      return remaining[0]?.id ?? PREDEFINED_PROFILES[0].id;
    });
  }, [profiles]);

  const setAsDefault = useCallback((id: string) => {
    setDefaultProfileId(id);
  }, []);

  const reorderProfiles = useCallback((orderedIds: string[]) => {
    setProfiles((prev) => {
      const byId = new Map(prev.map((p) => [p.id, p]));
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((p): p is PomodoroProfile => Boolean(p));
      return reordered.length === prev.length ? reordered : prev;
    });
  }, []);

  return {
    profiles,
    defaultProfileId,
    defaultProfile,
    addProfile,
    updateProfile,
    deleteProfile,
    setAsDefault,
    reorderProfiles,
  };
}
