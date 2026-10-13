import { SUPPORT } from "./exercises-support";
import { STRENGTH } from "./exercises-strength";
import { YOGA } from "./exercises-yoga";
import { SESSIONS } from "./sessions";
import type { Exercise, PainArea, SessionTemplate } from "./types";

export const EXERCISES: Exercise[] = [...SUPPORT, ...STRENGTH, ...YOGA];

export const EXERCISE_MAP: Record<string, Exercise> = Object.fromEntries(
  EXERCISES.map((exercise) => [exercise.id, exercise]),
);

function assertCatalog() {
  const seen = new Set<string>();
  for (const exercise of EXERCISES) {
    if (seen.has(exercise.id)) throw new Error(`Duplicate exercise ${exercise.id}`);
    seen.add(exercise.id);
  }
  for (const exercise of EXERCISES) {
    for (const target of Object.values(exercise.substitute ?? {})) {
      if (!EXERCISE_MAP[target]) throw new Error(`Bad substitute ${target} on ${exercise.id}`);
    }
  }
  const sessionIds = new Set<string>();
  for (const session of SESSIONS) {
    if (sessionIds.has(session.id)) throw new Error(`Duplicate session ${session.id}`);
    sessionIds.add(session.id);
    for (const block of session.blocks) {
      if (!EXERCISE_MAP[block.exerciseId]) {
        throw new Error(`Unknown exercise ${block.exerciseId} in ${session.id}`);
      }
    }
  }
}

assertCatalog();

export function getExercise(id: string): Exercise | undefined {
  return EXERCISE_MAP[id];
}

export function getSession(id: string): SessionTemplate | undefined {
  return SESSIONS.find((session) => session.id === id);
}

export function adaptExercise(id: string, pain: PainArea[]): { id: string; note?: string } {
  const seen = new Set<string>();
  let current = id;
  const swapped: string[] = [];
  while (!seen.has(current)) {
    seen.add(current);
    const exercise = EXERCISE_MAP[current];
    if (!exercise) break;
    const hit = pain.find((area) => exercise.substitute?.[area]);
    if (!hit) break;
    const next = exercise.substitute?.[hit];
    if (!next || next === current) break;
    swapped.push(`${exercise.name} is swapped because of your ${hit}`);
    current = next;
  }
  const exercise = EXERCISE_MAP[current];
  let note = swapped.length > 0 ? `${swapped.join(". ")}.` : undefined;
  if (exercise) {
    const still = pain.find((area) => exercise.loads.includes(area));
    if (still && exercise.modifications[0]) {
      const extra = exercise.modifications[0];
      note = note ? `${note} ${extra}` : extra;
    }
  }
  return { id: current, note };
}
