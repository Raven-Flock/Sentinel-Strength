export type TrackId = "strength" | "yoga" | "combined";
export type LevelId = "beginner" | "intermediate" | "advanced" | "expert";
export type Stage = 1 | 2;
export type SessionLength = 15 | 25 | 40;
export type Effort = "too-easy" | "just-right" | "too-hard";
export type PainArea = "back" | "knee" | "hip" | "shoulder" | "ankle" | "wrist";
export type JobDemand =
  | "lifting"
  | "carrying"
  | "uneven"
  | "overhead"
  | "bending"
  | "driving";
export type Activity = "getting-started" | "some-training" | "training-regularly";
export type Phase = "warmup" | "main" | "auxiliary" | "cooldown";
export type ExerciseKind = "warmup" | "strength" | "yoga" | "finisher" | "cooldown";
export type Focus =
  | "core"
  | "balance"
  | "landing"
  | "mobility"
  | "hips"
  | "shoulders";

export type Exercise = {
  id: string;
  name: string;
  kind: ExerciseKind;
  tracks: Array<"strength" | "yoga">;
  levels: LevelId[];
  focus: Focus[];
  equipment: string;
  setup: string;
  instructions: string;
  cues: string[];
  mistakes: string[];
  modifications: string[];
  progressions: string[];
  why: string;
  defaultSets: number;
  defaultReps?: string;
  defaultHoldSec?: number;
  defaultRestSec: number;
  loads: PainArea[];
  substitute?: Partial<Record<PainArea, string>>;
  prerequisite?: string;
};

export type BlockSpec = {
  exerciseId: string;
  phase: Phase;
  sets?: number;
  reps?: string;
  holdSec?: number;
  restSec?: number;
};

export type SessionTemplate = {
  id: string;
  track: TrackId;
  level: LevelId;
  stage: Stage | "both";
  order: number;
  title: string;
  intent: string;
  blocks: BlockSpec[];
  deload?: boolean;
  bridge?: boolean;
  bridgeTo?: LevelId;
  scaffold?: boolean;
};

export type Profile = {
  onboarded: boolean;
  disclaimerAccepted: boolean;
  activity: Activity;
  painAreas: PainArea[];
  jobDemands: JobDemand[];
  sessionLength: SessionLength;
  preferredTrack: TrackId;
  remindersOn: boolean;
  reminderTime: string;
};

export type TrackState = {
  level: LevelId;
  stage: Stage;
  stay: boolean;
  checks: Record<string, boolean>;
};

export type SessionLog = {
  id: string;
  at: number;
  sessionId: string;
  title: string;
  track: TrackId;
  level: LevelId;
  stage: Stage;
  date: string;
  form: 1 | 2 | 3 | 4 | 5;
  effort: Effort;
  pain: boolean;
  painNote: string;
  deload: boolean;
  bridge: boolean;
  partial: boolean;
  minutes: number;
};

export type Notice = { title: string; body: string } | null;

export const LEVELS: LevelId[] = ["beginner", "intermediate", "advanced", "expert"];

export const TRACKS: TrackId[] = ["strength", "yoga", "combined"];

export const PAIN_AREAS: PainArea[] = ["back", "knee", "hip", "shoulder", "ankle", "wrist"];

export const JOBS: JobDemand[] = [
  "lifting",
  "carrying",
  "uneven",
  "overhead",
  "bending",
  "driving",
];
