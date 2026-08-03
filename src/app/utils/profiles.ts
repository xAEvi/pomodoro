const STORAGE_KEY = "pomodoro-profiles";

export interface PomodoroProfile {
  id: string;
  name: string;
  focusTime: number;
  breakTime: number;
  sessions: number;
  isPredefined: boolean;
}

interface PersistedProfiles {
  profiles: PomodoroProfile[];
  defaultProfileId: string;
}

export const PREDEFINED_PROFILES: PomodoroProfile[] = [
  {
    id: "predefined-25-5",
    name: "25 / 5",
    focusTime: 25,
    breakTime: 5,
    sessions: 4,
    isPredefined: true,
  },
  {
    id: "predefined-50-10",
    name: "50 / 10",
    focusTime: 50,
    breakTime: 10,
    sessions: 4,
    isPredefined: true,
  },
  {
    id: "predefined-90-20",
    name: "90 / 20",
    focusTime: 90,
    breakTime: 20,
    sessions: 4,
    isPredefined: true,
  },
];

const DEFAULT_STATE: PersistedProfiles = {
  profiles: PREDEFINED_PROFILES,
  defaultProfileId: PREDEFINED_PROFILES[0].id,
};

export function loadProfiles(): PersistedProfiles {
  if (typeof window === "undefined") return DEFAULT_STATE;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;

    const parsed = JSON.parse(raw) as Partial<PersistedProfiles>;
    if (!parsed?.profiles?.length) return DEFAULT_STATE;

    return {
      profiles: parsed.profiles,
      defaultProfileId: parsed.defaultProfileId ?? parsed.profiles[0].id,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function saveProfiles(state: PersistedProfiles): void {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage puede fallar (modo privado, cuota excedida, etc.); ignoramos silenciosamente.
  }
}

export function createProfileId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
