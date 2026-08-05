import { useCallback, useEffect, useState } from "react";
import {
  PomodoroProfile,
  PREDEFINED_PROFILES,
  createProfileId,
  loadProfiles,
  saveProfiles,
} from "../utils/profiles";

export type ProfileFormData = Omit<PomodoroProfile, "id" | "isPredefined">;

export function useProfiles() {
  // Se inicializan con los perfiles predefinidos (sin tocar localStorage) para
  // que el primer render del cliente coincida con el HTML del servidor; el
  // estado persistido se aplica luego en un efecto, una vez montado en el
  // navegador. Leerlo de forma síncrona a nivel de módulo producía un
  // mismatch de hidratación (SSR no tiene acceso a localStorage).
  const [profiles, setProfiles] = useState<PomodoroProfile[]>(
    PREDEFINED_PROFILES,
  );
  const [defaultProfileId, setDefaultProfileId] = useState(
    PREDEFINED_PROFILES[0].id,
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const persisted = loadProfiles();
    setProfiles(persisted.profiles);
    setDefaultProfileId(persisted.defaultProfileId);
    setHydrated(true);
  }, []);

  // Persistimos perfiles y el predeterminado ante cualquier cambio. Se espera
  // a `hydrated` para no pisar el localStorage con los predefinidos antes de
  // haber aplicado el estado ya guardado.
  useEffect(() => {
    if (!hydrated) return;
    saveProfiles({ profiles, defaultProfileId });
  }, [profiles, defaultProfileId, hydrated]);

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
