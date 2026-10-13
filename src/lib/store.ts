import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { evaluate, nextLevel } from "@/data/progression";
import type {
  LevelId,
  Notice,
  PainArea,
  Profile,
  SessionLog,
  TrackId,
  TrackState,
} from "@/data/types";
import { LEVELS } from "@/data/types";

export const defaultProfile: Profile = {
  onboarded: false,
  disclaimerAccepted: false,
  activity: "getting-started",
  painAreas: [],
  jobDemands: [],
  sessionLength: 25,
  preferredTrack: "combined",
  remindersOn: false,
  reminderTime: "06:30",
};

const defaultTrack: TrackState = {
  level: "beginner",
  stage: 1,
  stay: false,
  checks: {},
};

function freshTracks(level: LevelId = "beginner"): Record<TrackId, TrackState> {
  return {
    strength: { ...defaultTrack, level, checks: {} },
    yoga: { ...defaultTrack, level, checks: {} },
    combined: { ...defaultTrack, level, checks: {} },
  };
}

type State = {
  hydrated: boolean;
  profile: Profile;
  tracks: Record<TrackId, TrackState>;
  logs: SessionLog[];
  notice: Notice;
  updateProfile: (patch: Partial<Profile>) => void;
  finishOnboarding: (profile: Profile, level: LevelId) => void;
  setTrack: (track: TrackId) => void;
  toggleCheck: (track: TrackId, id: string) => void;
  setStay: (track: TrackId, stay: boolean) => void;
  logSession: (log: SessionLog, extraPain: PainArea[]) => void;
  advance: (track: TrackId) => void;
  dropTrack: (track: TrackId, level: LevelId) => void;
  dismissNotice: () => void;
  resetAll: () => void;
};

function memoryStorage(): Storage {
  if (typeof window === "undefined") {
    const map = new Map<string, string>();
    return {
      get length() {
        return map.size;
      },
      clear: () => map.clear(),
      getItem: (key) => map.get(key) ?? null,
      key: (index) => [...map.keys()][index] ?? null,
      removeItem: (key) => {
        map.delete(key);
      },
      setItem: (key, value) => {
        map.set(key, value);
      },
    };
  }
  return localStorage;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      hydrated: false,
      profile: defaultProfile,
      tracks: freshTracks(),
      logs: [],
      notice: null,
      updateProfile: (patch) => set((state) => ({ profile: { ...state.profile, ...patch } })),
      finishOnboarding: (profile, level) =>
        set({
          profile: { ...profile, onboarded: true, disclaimerAccepted: true },
          tracks: freshTracks(level),
          logs: [],
          notice: null,
        }),
      setTrack: (track) => set((state) => ({ profile: { ...state.profile, preferredTrack: track } })),
      toggleCheck: (track, id) =>
        set((state) => {
          const current = state.tracks[track];
          return {
            tracks: {
              ...state.tracks,
              [track]: {
                ...current,
                checks: { ...current.checks, [id]: !current.checks[id] },
              },
            },
          };
        }),
      setStay: (track, stay) =>
        set((state) => ({
          tracks: { ...state.tracks, [track]: { ...state.tracks[track], stay } },
        })),
      logSession: (log, extraPain) =>
        set((state) => ({
          logs: [...state.logs, log],
          profile: {
            ...state.profile,
            painAreas: [...new Set([...state.profile.painAreas, ...extraPain])],
          },
        })),
      advance: (track) => {
        const state = get();
        const current = state.tracks[track];
        const report = evaluate({
          track,
          level: current.level,
          stage: current.stage,
          logs: state.logs,
          checks: current.checks,
        });
        if (!report.ready) return;
        if (current.stage === 1) {
          set({
            tracks: {
              ...state.tracks,
              [track]: { ...current, stage: 2, stay: false },
            },
            notice: {
              title: "Stage updated",
              body: "You are owning the pattern now. Same level, a little more ask. If a cue falls apart, use the easier version.",
            },
          });
          return;
        }
        const to = nextLevel(current.level);
        if (!to) return;
        set({
          tracks: {
            ...state.tracks,
            [track]: { level: to, stage: 1, stay: false, checks: {} },
          },
          notice: {
            title: `${trackName(track)} moved to ${to}`,
            body: "The first sessions here stay modest. Keep one easier drill in the warm-up and stop if a landing gets loud.",
          },
        });
      },
      dropTrack: (track, level) =>
        set((state) => {
          const current = state.tracks[track].level;
          if (LEVELS.indexOf(level) >= LEVELS.indexOf(current)) return state;
          return {
            tracks: {
              ...state.tracks,
              [track]: { level, stage: 1, stay: false, checks: {} },
            },
            notice: {
              title: `${trackName(track)} moved down`,
              body: "You can earn the higher level again. The checks did not change.",
            },
          };
        }),
      dismissNotice: () => set({ notice: null }),
      resetAll: () =>
        set({
          profile: defaultProfile,
          tracks: freshTracks(),
          logs: [],
          notice: null,
          hydrated: true,
        }),
    }),
    {
      name: "sentinel-strength-v1",
      storage: createJSONStorage(memoryStorage),
      skipHydration: true,
      partialize: (state) => ({
        profile: state.profile,
        tracks: state.tracks,
        logs: state.logs,
      }),
      onRehydrateStorage: () => (state) => {
        useStore.setState({
          hydrated: true,
          profile: { ...defaultProfile, ...state?.profile },
          tracks: {
            strength: { ...defaultTrack, ...state?.tracks?.strength, checks: state?.tracks?.strength?.checks ?? {} },
            yoga: { ...defaultTrack, ...state?.tracks?.yoga, checks: state?.tracks?.yoga?.checks ?? {} },
            combined: {
              ...defaultTrack,
              ...state?.tracks?.combined,
              checks: state?.tracks?.combined?.checks ?? {},
            },
          },
          logs: Array.isArray(state?.logs) ? state.logs : [],
        });
      },
    },
  ),
);

function trackName(track: TrackId): string {
  if (track === "strength") return "Strength";
  if (track === "yoga") return "Yoga";
  return "Combined";
}
