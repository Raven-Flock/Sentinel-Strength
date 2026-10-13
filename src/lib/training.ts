import { adaptExercise, getExercise, getSession } from "@/data/catalog";
import { SESSIONS } from "@/data/sessions";
import { deloadDue } from "@/data/progression";
import type {
  BlockSpec,
  LevelId,
  PainArea,
  Phase,
  SessionLength,
  SessionLog,
  SessionTemplate,
  Stage,
  TrackId,
} from "@/data/types";

export type ResolvedBlock = {
  exerciseId: string;
  phase: Phase;
  sets: number;
  reps?: string;
  holdSec?: number;
  restSec: number;
  adaptNote?: string;
};

export type Playable = {
  id: string;
  title: string;
  intent: string;
  track: TrackId;
  level: LevelId;
  stage: Stage | "both";
  minutes: number;
  blocks: ResolvedBlock[];
  deload: boolean;
  bridge: boolean;
  bridgeTo?: LevelId;
  scaffold: boolean;
  reason: "today" | "deload" | "bridge" | "library";
};

function estimateMinutes(blocks: ResolvedBlock[]): number {
  let sec = 0;
  for (const block of blocks) {
    const work = block.holdSec ?? 35;
    sec += block.sets * (work + 8) + Math.max(0, block.sets - 1) * block.restSec;
  }
  return Math.max(8, Math.round(sec / 60));
}

function resolveBlock(block: BlockSpec, pain: PainArea[]): ResolvedBlock {
  const adapted = adaptExercise(block.exerciseId, pain);
  const exercise = getExercise(adapted.id);
  const swapped = adapted.id !== block.exerciseId;
  const sets = Math.min(4, Math.max(1, block.sets ?? exercise?.defaultSets ?? 2));
  const restSec = block.restSec ?? exercise?.defaultRestSec ?? 30;
  const holdFromBlock = block.holdSec;
  const useHold =
    holdFromBlock != null ||
    (block.reps == null && (exercise?.defaultHoldSec != null || swapped && exercise?.defaultHoldSec != null));
  if (swapped && exercise) {
    if (exercise.defaultHoldSec && !exercise.defaultReps) {
      return {
        exerciseId: adapted.id,
        phase: block.phase,
        sets: Math.min(sets, exercise.defaultSets),
        holdSec: exercise.defaultHoldSec,
        restSec: exercise.defaultRestSec,
        adaptNote: adapted.note,
      };
    }
    return {
      exerciseId: adapted.id,
      phase: block.phase,
      sets: Math.min(sets, exercise.defaultSets),
      reps: exercise.defaultReps,
      holdSec: exercise.defaultHoldSec,
      restSec: exercise.defaultRestSec,
      adaptNote: adapted.note,
    };
  }
  if (useHold) {
    return {
      exerciseId: adapted.id,
      phase: block.phase,
      sets,
      holdSec: holdFromBlock ?? exercise?.defaultHoldSec ?? 20,
      restSec,
      adaptNote: adapted.note,
    };
  }
  return {
    exerciseId: adapted.id,
    phase: block.phase,
    sets,
    reps: block.reps ?? exercise?.defaultReps ?? "8",
    restSec,
    adaptNote: adapted.note,
  };
}

export function resolveSession(
  template: SessionTemplate,
  options: { length: SessionLength; pain: PainArea[]; stage: Stage; reason?: Playable["reason"] },
): Playable {
  let blocks = template.blocks.map((block) => ({ ...block }));
  if (!template.deload && !template.bridge && options.length === 15) {
    const warmup = blocks.filter((block) => block.phase === "warmup").slice(0, 2);
    const main = blocks
      .filter((block) => block.phase === "main")
      .slice(0, 3)
      .map((block) => ({ ...block, sets: Math.min(block.sets ?? 2, 2) }));
    const finisher = blocks.filter((block) => block.phase === "auxiliary").slice(0, 1);
    const cooldown = blocks.filter((block) => block.phase === "cooldown").slice(-1);
    blocks = [...warmup, ...main, ...finisher, ...cooldown];
  } else if (!template.deload && !template.bridge && options.length === 40) {
    blocks = blocks.map((block) =>
      block.phase === "main" ? { ...block, sets: Math.min(4, (block.sets ?? 3) + 1) } : block,
    );
  }
  if (
    !template.deload &&
    !template.bridge &&
    template.stage === "both" &&
    options.stage === 2 &&
    options.length !== 15
  ) {
    blocks = blocks.map((block) =>
      block.phase === "main" ? { ...block, sets: Math.min(4, (block.sets ?? 3) + 1) } : block,
    );
  }
  const resolved = blocks.map((block) => resolveBlock(block, options.pain));
  return {
    id: template.id,
    title: template.title,
    intent: template.intent,
    track: template.track,
    level: template.level,
    stage: template.stage,
    minutes: estimateMinutes(resolved),
    blocks: resolved,
    deload: Boolean(template.deload),
    bridge: Boolean(template.bridge),
    bridgeTo: template.bridgeTo,
    scaffold: Boolean(template.scaffold),
    reason: options.reason ?? "library",
  };
}

export function poolFor(track: TrackId, level: LevelId, stage: Stage): SessionTemplate[] {
  return SESSIONS.filter(
    (session) =>
      !session.deload &&
      !session.bridge &&
      session.track === track &&
      session.level === level &&
      (session.stage === stage || session.stage === "both"),
  ).sort((a, b) => a.order - b.order);
}

export function recommend(input: {
  track: TrackId;
  level: LevelId;
  stage: Stage;
  length: SessionLength;
  pain: PainArea[];
  logs: SessionLog[];
}): Playable {
  if (deloadDue(input.logs, input.track, input.level)) {
    const deload = SESSIONS.find((session) => session.deload && session.track === input.track);
    if (deload) {
      return resolveSession(deload, { ...input, reason: "deload" });
    }
  }
  const pool = poolFor(input.track, input.level, input.stage);
  const done = input.logs.filter((log) => log.track === input.track).length;
  const pick = pool[done % Math.max(pool.length, 1)] ?? pool[0];
  if (!pick) {
    throw new Error(`No session for ${input.track} ${input.level} stage ${input.stage}`);
  }
  return resolveSession(pick, { ...input, reason: "today" });
}

export function bridgeSession(input: {
  track: TrackId;
  level: LevelId;
  stage: Stage;
  length: SessionLength;
  pain: PainArea[];
}): Playable | null {
  const template = SESSIONS.find(
    (session) => session.bridge && session.track === input.track && session.level === input.level,
  );
  if (!template) return null;
  return resolveSession(template, { ...input, reason: "bridge" });
}

export function playableFromId(
  id: string,
  input: { length: SessionLength; pain: PainArea[]; stage: Stage },
): Playable | null {
  const template = getSession(id);
  if (!template) return null;
  return resolveSession(template, input);
}

export function todayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function streak(logs: SessionLog[], today = todayKey()): number {
  const days = new Set(logs.map((log) => log.date));
  if (days.size === 0) return 0;
  const [y, m, d] = today.split("-").map(Number);
  const cursor = new Date(y ?? 2026, (m ?? 1) - 1, d ?? 1);
  if (!days.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let count = 0;
  while (days.has(todayKey(cursor))) {
    count += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return count;
}

export function weekRhythm(track: TrackId): { label: string; track: TrackId; title: string }[] {
  if (track === "combined") {
    return [
      { label: "Day 1", track: "combined", title: "Integrated" },
      { label: "Day 2", track: "combined", title: "Integrated" },
      { label: "Day 3", track: "yoga", title: "Easy mobility" },
    ];
  }
  if (track === "strength") {
    return [
      { label: "Day 1", track: "strength", title: "Landings" },
      { label: "Day 2", track: "yoga", title: "Mobility" },
      { label: "Day 3", track: "strength", title: "Balance" },
    ];
  }
  return [
    { label: "Day 1", track: "yoga", title: "Yoga" },
    { label: "Day 2", track: "strength", title: "Core" },
    { label: "Day 3", track: "combined", title: "Mixed" },
  ];
}

export type CalendarCell = { iso: string; inRange: boolean; day: number };

export function calendarCells(today = new Date()): CalendarCell[] {
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);
  start.setDate(end.getDate() - 27);
  start.setDate(start.getDate() - start.getDay());
  const cells: CalendarCell[] = [];
  const cursor = new Date(start);
  while (cursor <= end || cells.length % 7 !== 0) {
    const iso = todayKey(cursor);
    const inRange = cursor >= new Date(end.getFullYear(), end.getMonth(), end.getDate() - 27) && cursor <= end;
    cells.push({ iso, inRange, day: cursor.getDate() });
    cursor.setDate(cursor.getDate() + 1);
    if (cells.length > 42) break;
  }
  return cells;
}

export function prescriptionLine(block: ResolvedBlock): string {
  const work = block.holdSec ? `Hold ${block.holdSec}s` : block.reps ?? "Steady reps";
  const rest = block.restSec > 0 ? `Rest ${block.restSec}s` : "Move on when you are ready";
  return `${block.sets} ${block.sets === 1 ? "set" : "sets"} · ${work} · ${rest}`;
}
