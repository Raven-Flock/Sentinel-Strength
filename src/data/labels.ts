import type {
  Effort,
  Focus,
  JobDemand,
  LevelId,
  PainArea,
  Phase,
  TrackId,
} from "./types";

export const TRACK_LABEL: Record<TrackId, string> = {
  strength: "Strength",
  yoga: "Yoga",
  combined: "Combined",
};

export const TRACK_FULL: Record<TrackId, string> = {
  strength: "Functional strength and plyometrics",
  yoga: "Yoga and mobility",
  combined: "Combined strength and yoga",
};

export const LEVEL_LABEL: Record<LevelId, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
  expert: "Expert",
};

export const LEVEL_NAME: Record<LevelId, string> = {
  beginner: "Foundation",
  intermediate: "Build",
  advanced: "Power & Flow",
  expert: "Mastery & Resilience",
};

export const LEVEL_WHY: Record<LevelId, string> = {
  beginner:
    "Your job already loads your body. This level teaches quiet landings, a braced core, and balance before any speed or extra range.",
  intermediate:
    "You can absorb force and hold basic positions. Now we build controlled power and longer stability so carrying, climbing, and uneven ground feel steadier.",
  advanced:
    "Control is consistent. Reactive and single-leg work, plus fuller flows, only go as fast as your landings stay quiet.",
  expert:
    "This is durability work: multi-directional control, a strong brace under movement, and mobility you can use on the job. Form still gates everything.",
};

export const STAGE_LABEL: Record<1 | 2, string> = {
  1: "Learn the pattern",
  2: "Own the pattern",
};

export const PAIN_LABEL: Record<PainArea, string> = {
  back: "Lower back",
  knee: "Knees",
  hip: "Hips",
  shoulder: "Shoulders",
  ankle: "Ankles",
  wrist: "Wrists",
};

export const JOB_LABEL: Record<JobDemand, string> = {
  lifting: "Lifting from the ground",
  carrying: "Carrying awkward loads",
  uneven: "Uneven ground",
  overhead: "Overhead work",
  bending: "Repetitive bending",
  driving: "Driving, then labor",
};

export const JOB_LINE: Record<JobDemand, string> = {
  lifting: "Today's brace is for the moment you pick something up.",
  carrying: "Single-leg control helps when a load pulls you off center.",
  uneven: "Balance work is for mud, gravel, and unfinished floors.",
  overhead: "Shoulder stability here is for reaching and overhead tasks.",
  bending: "Hinging from the hips beats rounding to grab tools.",
  driving: "Hips and upper-back mobility undo time in the seat.",
};

export const FOCUS_LABEL: Record<Focus, string> = {
  core: "Core",
  balance: "Balance",
  landing: "Landing",
  mobility: "Mobility",
  hips: "Hips",
  shoulders: "Shoulders",
};

export const PHASE_LABEL: Record<Phase, string> = {
  warmup: "Warm-up",
  main: "Main work",
  auxiliary: "Finisher",
  cooldown: "Cool-down",
};

export const EFFORT_LABEL: Record<Effort, string> = {
  "too-easy": "Too easy",
  "just-right": "Just right",
  "too-hard": "Too hard",
};

export const LEVEL_COPY: Record<
  string,
  { changes: string; safer: string; how: string }
> = {
  "beginner:intermediate": {
    changes:
      "We'll add controlled hops, step-ups or longer holds, and less hand support. Volume stays modest.",
    safer:
      "Clean sessions and a pain-free recent practice mean your joints have practiced absorbing force, not just surviving it.",
    how:
      "Keep a snap-down or an easy balance in the warm-up. If a new move gets loud or sloppy, finish with the version you already own.",
  },
  "intermediate:advanced": {
    changes:
      "Reactive single-leg work and fuller flows show up. Each one still ends in a stick landing or a steady hold.",
    safer:
      "You have repeated the Build patterns with solid form across enough days that speed is no longer the first time your body sees the shape.",
    how:
      "Treat the first two weeks as a bridge. Fewer contacts, full pauses, and a deload if landings get noisy.",
  },
  "advanced:expert": {
    changes:
      "Multi-directional deceleration, harder anti-rotation, and — on the yoga side — arm balances and controlled inversions with strict prerequisites.",
    safer:
      "Expert is not harder for its own sake. You have shown you can stop, stick, and breathe while braced. That is the entry ticket.",
    how:
      "Keep easier variations in every warm-up. Skip any inversion or reactive hop the day form is off. Recovery weeks are part of this level, not a reward you earn later.",
  },
};

export const TRACK_STEP: Record<TrackId, Record<string, string>> = {
  strength: {
    "beginner:intermediate":
      "Strength adds low line hops, step-ups, and anti-rotation presses.",
    "intermediate:advanced":
      "Strength adds bounds, single-leg hops, and depth drops that must stick.",
    "advanced:expert":
      "Strength adds single-leg step-offs, two-bound sticks, and change-of-direction you could use on a job site.",
  },
  yoga: {
    "beginner:intermediate":
      "Yoga lengthens the holds and introduces a short flow without the wall.",
    "intermediate:advanced":
      "Yoga adds Warrior III, Half Moon, and crow prep — feet can stay down.",
    "advanced:expert":
      "Yoga adds a hands-free balance, side-arm prep, dolphin, and legs-up-the-wall. Nothing rests on the neck.",
  },
  combined: {
    "beginner:intermediate":
      "Combined keeps the landing drill, then spends the back half in longer yoga shapes.",
    "intermediate:advanced":
      "Combined pairs a controlled hop with a balance pose in the same session.",
    "advanced:expert":
      "Combined asks for a quiet landing and a steady advanced balance before any inversion prep.",
  },
};

export const STAGE_COPY = {
  changes:
    "Same moves, a little more time under tension and less support. The standard is still a quiet, repeatable rep.",
  safer:
    "Four clean sessions is enough to add a notch. It is not a reason to rush the next level.",
  how: "If a cue falls apart, finish that set with the easier version. Smart regressions still count as training.",
};
