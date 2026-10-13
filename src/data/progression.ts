import { LEVEL_COPY, LEVEL_NAME, STAGE_LABEL, TRACK_STEP } from "./labels";
import type { LevelId, SessionLog, Stage, TrackId } from "./types";
import { LEVELS } from "./types";

/**
 * Progression rules. Edit RULES to retune gates without rewriting the UI.
 *
 * A session counts toward a gate only when all of these are true:
 * - same track and level as the gate
 * - same stage, when the gate is stage-specific
 * - not a deload and not a partial (under 60% of the main work)
 * - form rating >= minForm (4 = Solid, 5 = Clean)
 * - pain is false
 * - effort is not "too-hard"
 *
 * Too-hard, pain, and low-form sessions are still saved. They just do not
 * unlock the next stage or level.
 */
export const RULES = {
  minForm: 4 as const,
  stageUp: {
    qualitySessions: 4,
    minSpanDays: 6,
  },
  levelUp: {
    beginner: { qualitySessions: 6, minSpanDays: 12 },
    intermediate: { qualitySessions: 8, minSpanDays: 18 },
    advanced: { qualitySessions: 10, minSpanDays: 28 },
  },
  /** Hard sessions at Advanced or Expert before a recovery session is recommended. */
  deloadAfter: 8,
};

export type CheckItem = { id: string; label: string };

export function nextLevel(level: LevelId): LevelId | null {
  const i = LEVELS.indexOf(level);
  return i >= 0 && i < LEVELS.length - 1 ? LEVELS[i + 1]! : null;
}

export function checksFor(track: TrackId, from: LevelId): CheckItem[] {
  if (from === "beginner") {
    return [
      {
        id: "b-balance",
        label: "I can stand on one leg for 20 seconds with a fingertip on a wall, both sides.",
      },
      {
        id: "b-brace",
        label: "I can hold a braced dead bug or plank for 20 seconds without my lower back arching.",
      },
      {
        id: "b-land",
        label: "I can land a small hop quietly and pause for a full second.",
      },
    ];
  }
  if (from === "intermediate") {
    return [
      {
        id: "i-balance",
        label: "I can stand on one leg for 20 seconds with no hand support, both sides.",
      },
      {
        id: "i-side",
        label: "I can hold a side plank, knee or full, for 15 seconds a side without the shoulder dumping.",
      },
      {
        id: "i-stick",
        label: "I can stick a lateral hop and pause without the knee caving in.",
      },
    ];
  }
  if (from === "advanced") {
    const shared: CheckItem[] = [
      {
        id: "a-brace",
        label: "I can breathe while holding a plank or bear position without losing the rib position.",
      },
      {
        id: "a-pain",
        label: "I have no sharp pain, and I will keep an easier variation in the warm-up.",
      },
    ];
    const specific: Record<TrackId, CheckItem> = {
      strength: {
        id: "a-strength",
        label: "I can decelerate a small hop and hold the landing for 2 seconds, both legs, without pain.",
      },
      yoga: {
        id: "a-yoga",
        label: "I can hold dolphin or a forearm plank without resting on my neck, and I will skip inversions on an off day.",
      },
      combined: {
        id: "a-combined",
        label: "I can pair a quiet landing and a steady balance pose in one session without rushing either.",
      },
    };
    return [...shared, specific[track]];
  }
  return [];
}

export type Criterion = {
  id: string;
  label: string;
  detail: string;
  met: boolean;
  progressText: string;
  /** When true, the user can toggle this in the level check. */
  selfCheck?: boolean;
};

export type Evaluation = {
  kind: "stage" | "level" | "maintain";
  ready: boolean;
  headline: string;
  nextTitle: string;
  changes: string;
  safer: string;
  how: string;
  flavor: string;
  criteria: Criterion[];
  qualityCount: number;
  qualityNeeded: number;
};

function isQuality(log: SessionLog, level: LevelId, stage: Stage | null): boolean {
  if (log.level !== level) return false;
  if (stage && log.stage !== stage) return false;
  if (log.deload || log.partial) return false;
  if (log.form < RULES.minForm) return false;
  if (log.pain) return false;
  if (log.effort === "too-hard") return false;
  return true;
}

function daySpan(dates: string[]): number {
  if (dates.length < 2) return 0;
  const ms = dates.map((d) => Date.parse(`${d}T00:00:00Z`));
  return Math.round((Math.max(...ms) - Math.min(...ms)) / 86_400_000);
}

function trackLogs(logs: SessionLog[], track: TrackId): SessionLog[] {
  return logs.filter((l) => l.track === track).sort((a, b) => b.at - a.at);
}

export function evaluate(input: {
  track: TrackId;
  level: LevelId;
  stage: Stage;
  logs: SessionLog[];
  checks: Record<string, boolean>;
}): Evaluation {
  const mine = trackLogs(input.logs, input.track);
  const atLevel = mine.filter((l) => l.level === input.level && !l.deload);

  if (input.level === "expert" && input.stage === 2) {
    const recent = atLevel.slice(0, 8);
    const clean = recent.filter((l) => isQuality(l, "expert", null)).length;
    return {
      kind: "maintain",
      ready: false,
      headline: "Stay durable",
      nextTitle: "No next level — mastery is maintenance",
      changes: "Keep the work you already own. Add complexity only on days the warm-up feels quiet.",
      safer: "Expert is a standard, not a finish line. Deload weeks protect the standard.",
      how: "If landings get loud or holds get shaky, drop volume for a week. That is the program.",
      flavor: TRACK_STEP[input.track]["advanced:expert"] ?? "",
      qualityCount: clean,
      qualityNeeded: 8,
      criteria: [
        {
          id: "maintain-quality",
          label: "Recent sessions stay clean",
          detail: "Look at the last 8 non-recovery sessions. Most should still be form 4–5, no pain, not too hard.",
          met: recent.length === 0 ? false : clean >= Math.min(4, recent.length),
          progressText: recent.length === 0 ? "No sessions yet" : `${clean} of ${recent.length} recent sessions clean`,
        },
        {
          id: "maintain-deload",
          label: "Recovery is scheduled, not optional",
          detail: "After 8 harder sessions the app will hand you a lighter day. Take it.",
          met: true,
          progressText: "Built into Advanced and Expert",
        },
      ],
    };
  }

  const gatingStage: Stage = input.stage;
  const kind: Evaluation["kind"] = input.stage === 1 ? "stage" : "level";
  const rule =
    kind === "stage"
      ? RULES.stageUp
      : RULES.levelUp[input.level as "beginner" | "intermediate" | "advanced"];

  const quality = atLevel.filter((l) => isQuality(l, input.level, gatingStage));
  const span = daySpan(quality.map((l) => l.date));
  const latest = atLevel[0];
  const latestOk = latest ? isQuality(latest, input.level, gatingStage) : false;

  const countMet = quality.length >= rule.qualitySessions;
  const spanMet = span >= rule.minSpanDays;
  const criteria: Criterion[] = [
    {
      id: "count",
      label:
        kind === "stage"
          ? `Complete ${rule.qualitySessions} clean sessions at this stage`
          : `Complete ${rule.qualitySessions} clean sessions owning this level`,
      detail:
        "Clean means form 4 or 5, no pain flag, and effort not marked too hard. Those other sessions stay in your history.",
      met: countMet,
      progressText: `${Math.min(quality.length, rule.qualitySessions)} of ${rule.qualitySessions}`,
    },
    {
      id: "span",
      label: `Spread the work across at least ${rule.minSpanDays} days`,
      detail:
        kind === "stage"
          ? "About two sessions a week. Cramming four practices into one weekend does not count as consistency."
          : "Consistency is the safety feature. The first and last clean session need this many days between them.",
      met: spanMet,
      progressText: quality.length < 2 ? "Need at least two clean sessions" : `${span} days so far`,
    },
    {
      id: "latest",
      label: "Your latest session at this stage was clean",
      detail: "A painful or sloppy session today pauses the step up, even if older sessions filled the count.",
      met: latestOk,
      progressText: !latest
        ? "No session yet"
        : latestOk
          ? "Latest session was clean"
          : "Latest session did not meet the bar",
    },
  ];

  let headline = "";
  let nextTitle = "";
  let changes = STAGE_COPY_SAFE.changes;
  let safer = STAGE_COPY_SAFE.safer;
  let how = STAGE_COPY_SAFE.how;
  let flavor = "You will feel the same shapes with a little less help.";

  if (kind === "stage") {
    headline = "Ready to own the pattern";
    nextTitle = STAGE_LABEL[2];
  } else {
    const to = nextLevel(input.level)!;
    const key = `${input.level}:${to}`;
    const copy = LEVEL_COPY[key];
    headline = `Ready for ${LEVEL_NAME[to]}`;
    nextTitle = `${LEVEL_NAME[to]}`;
    if (copy) {
      changes = copy.changes;
      safer = copy.safer;
      how = copy.how;
    }
    flavor = TRACK_STEP[input.track][key] ?? "";
    for (const check of checksFor(input.track, input.level)) {
      const met = Boolean(input.checks[check.id]);
      criteria.push({
        id: check.id,
        label: check.label,
        detail: "Check this only if it is true this week. Guessing is how people get hurt.",
        met,
        progressText: met ? "Confirmed" : "Not yet",
        selfCheck: true,
      });
    }
  }

  const ready = criteria.every((c) => c.met);

  return {
    kind,
    ready,
    headline: ready ? headline : kind === "stage" ? "Working this stage" : "Working this level",
    nextTitle,
    changes,
    safer,
    how,
    flavor,
    criteria,
    qualityCount: quality.length,
    qualityNeeded: rule.qualitySessions,
  };
}

const STAGE_COPY_SAFE = {
  changes:
    "Same moves, a little more time under tension and less support. The standard is still a quiet, repeatable rep.",
  safer:
    "Four clean sessions is enough to add a notch. It is not a reason to rush the next level.",
  how: "If a cue falls apart, finish that set with the easier version. Smart regressions still count as training.",
};

export function deloadDue(logs: SessionLog[], track: TrackId, level: LevelId): boolean {
  if (level !== "advanced" && level !== "expert") return false;
  const mine = trackLogs(logs, track);
  let streak = 0;
  for (const log of mine) {
    if (log.deload) break;
    streak += 1;
  }
  return streak >= RULES.deloadAfter;
}

export function sessionsUntilDeload(logs: SessionLog[], track: TrackId, level: LevelId): number | null {
  if (level !== "advanced" && level !== "expert") return null;
  const mine = trackLogs(logs, track);
  let streak = 0;
  for (const log of mine) {
    if (log.deload) break;
    streak += 1;
  }
  return Math.max(0, RULES.deloadAfter - streak);
}

export type PlacementAnswers = Record<string, boolean>;

export const READINESS = {
  intermediate: [
    {
      id: "r-plank",
      prompt: "I can hold a braced plank for 20 seconds without my lower back sagging.",
    },
    {
      id: "r-balance",
      prompt: "I can stand on one leg for 15 seconds with a fingertip on a wall.",
    },
    {
      id: "r-land",
      prompt: "I can do a small hop, land quietly, and pause.",
    },
    {
      id: "r-pain",
      prompt: "Bodyweight squats do not cause sharp pain in my back, knees, or shoulders.",
    },
  ],
  advanced: [
    {
      id: "r-free",
      prompt: "I can balance on one leg for 20 seconds with no hand support.",
    },
    {
      id: "r-side",
      prompt: "I can hold a side plank for 15 seconds a side without the shoulder collapsing.",
    },
    {
      id: "r-step",
      prompt: "I can step down slowly from a low step five times without the knee collapsing inward.",
    },
    {
      id: "r-stick",
      prompt: "I can stick a line hop and hold the landing still.",
    },
  ],
} as const;

export function placementFromAnswers(answers: PlacementAnswers): {
  level: LevelId;
  passedIntermediate: boolean;
  passedAdvanced: boolean;
} {
  const passedIntermediate = READINESS.intermediate.every((q) => answers[q.id]);
  const passedAdvanced = passedIntermediate && READINESS.advanced.every((q) => answers[q.id]);
  const level: LevelId = passedAdvanced ? "advanced" : passedIntermediate ? "intermediate" : "beginner";
  return { level, passedIntermediate, passedAdvanced };
}
