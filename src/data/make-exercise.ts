import type { Exercise, ExerciseKind, Focus, LevelId, PainArea } from "./types";

const ALL: LevelId[] = ["beginner", "intermediate", "advanced", "expert"];

export type Draft = {
  id: string;
  name: string;
  kind: ExerciseKind;
  tracks?: Array<"strength" | "yoga">;
  levels?: LevelId[];
  focus: Focus[];
  equipment?: string;
  setup: string;
  instructions: string;
  cues: string[];
  mistakes: string[];
  modifications: string[];
  progressions: string[];
  why: string;
  sets?: number;
  reps?: string;
  hold?: number;
  rest?: number;
  loads?: PainArea[];
  substitute?: Partial<Record<PainArea, string>>;
  prerequisite?: string;
};

export function ex(d: Draft): Exercise {
  return {
    id: d.id,
    name: d.name,
    kind: d.kind,
    tracks: d.tracks ?? ["strength", "yoga"],
    levels: d.levels ?? ALL,
    focus: d.focus,
    equipment: d.equipment ?? "None",
    setup: d.setup,
    instructions: d.instructions,
    cues: d.cues,
    mistakes: d.mistakes,
    modifications: d.modifications,
    progressions: d.progressions,
    why: d.why,
    defaultSets: d.sets ?? (d.hold ? 3 : 3),
    defaultReps: d.reps,
    defaultHoldSec: d.hold,
    defaultRestSec: d.rest ?? 30,
    loads: d.loads ?? [],
    substitute: d.substitute,
    prerequisite: d.prerequisite,
  };
}
