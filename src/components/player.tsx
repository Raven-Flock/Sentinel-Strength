import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getExercise, getSession } from "@/data/catalog";
import { EFFORT_LABEL, LEVEL_LABEL, PAIN_LABEL, TRACK_LABEL } from "@/data/labels";
import type { Effort, ExerciseKind, PainArea, Phase } from "@/data/types";
import { LEVELS, PAIN_AREAS } from "@/data/types";
import { useStore } from "@/lib/store";
import { playableFromId, todayKey } from "@/lib/training";
import { AppFrame } from "./shell";
import { buttonClass, Kicker, Panel } from "./ui";

function clock(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function blockLabel(phase: Phase, kind: ExerciseKind | undefined): string {
  if (phase === "warmup") return "Warm-up";
  if (phase === "cooldown") return "Cool-down";
  if (phase === "auxiliary") return "Finisher";
  if (kind === "yoga") return "Yoga";
  return "Strength";
}

function clearTimer(interval: { current: number | null }) {
  if (interval.current != null) {
    window.clearInterval(interval.current);
    interval.current = null;
  }
}

function useTimer() {
  const [remainingMs, setRemainingMs] = useState(0);
  const [running, setRunning] = useState(false);
  const endRef = useRef(0);
  const leftRef = useRef(0);
  const cbRef = useRef<() => void>(() => {});
  const armed = useRef(false);
  const interval = useRef<number | null>(null);

  useEffect(() => () => clearTimer(interval), []);

  function loop() {
    clearTimer(interval);
    interval.current = window.setInterval(() => {
      const left = Math.max(0, endRef.current - Date.now());
      setRemainingMs(left);
      if (left <= 0 && armed.current) {
        armed.current = false;
        setRunning(false);
        clearTimer(interval);
        cbRef.current();
      }
    }, 100);
  }

  return {
    remainingMs,
    running,
    start(seconds: number, onDone: () => void) {
      cbRef.current = onDone;
      armed.current = true;
      endRef.current = Date.now() + seconds * 1000;
      leftRef.current = seconds * 1000;
      setRemainingMs(seconds * 1000);
      setRunning(true);
      loop();
    },
    pause() {
      leftRef.current = Math.max(0, endRef.current - Date.now());
      armed.current = false;
      setRunning(false);
      clearTimer(interval);
      setRemainingMs(leftRef.current);
    },
    resume() {
      if (leftRef.current <= 0) return;
      armed.current = true;
      endRef.current = Date.now() + leftRef.current;
      setRunning(true);
      loop();
    },
    stop() {
      armed.current = false;
      setRunning(false);
      clearTimer(interval);
    },
  };
}

export function Player({ sessionId }: { sessionId: string }) {
  const profile = useStore((state) => state.profile);
  const tracks = useStore((state) => state.tracks);
  const logSession = useStore((state) => state.logSession);
  const template = getSession(sessionId);
  const track = template?.track ?? profile.preferredTrack;
  const user = tracks[track];
  const playable = useMemo(() => {
    if (!template) return null;
    return playableFromId(sessionId, {
      length: profile.sessionLength,
      pain: profile.painAreas,
      stage: user.level === template.level || template.deload || template.bridge ? user.stage : 1,
    });
  }, [sessionId, template, profile.sessionLength, profile.painAreas, user.level, user.stage]);

  const timer = useTimer();
  const [index, setIndex] = useState(0);
  const [setNo, setSetNo] = useState(1);
  const [mode, setMode] = useState<"ready" | "work" | "rest" | "feedback" | "saved">("ready");
  const [done, setDone] = useState<number[]>([]);
  const [leave, setLeave] = useState(false);
  const [form, setForm] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [effort, setEffort] = useState<Effort | null>(null);
  const [pain, setPain] = useState<boolean | null>(null);
  const [painNote, setPainNote] = useState("");
  const [extraPain, setExtraPain] = useState<PainArea[]>([]);
  const [savedCopy, setSavedCopy] = useState("");
  const indexRef = useRef(0);
  const setNoRef = useRef(1);
  indexRef.current = index;
  setNoRef.current = setNo;

  if (!template || !playable) {
    return (
      <AppFrame>
        <h1 className="font-display text-3xl font-medium">Session not found</h1>
        <Link to="/library" className={`${buttonClass()} mt-6`}>
          Back to the library
        </Link>
      </AppFrame>
    );
  }

  const block = playable.blocks[index];
  const exercise = block ? getExercise(block.exerciseId) : undefined;
  const mainIndexes = playable.blocks
    .map((item, itemIndex) => (item.phase === "main" ? itemIndex : -1))
    .filter((itemIndex) => itemIndex >= 0);
  const doneMain = mainIndexes.filter((itemIndex) => done.includes(itemIndex)).length;
  const partial = mainIndexes.length > 0 && doneMain / mainIndexes.length < 0.6;
  const above =
    !playable.deload &&
    !playable.bridge &&
    LEVELS.indexOf(playable.level) > LEVELS.indexOf(user.level);

  function markDone(blockIndex: number) {
    setDone((current) => (current.includes(blockIndex) ? current : [...current, blockIndex]));
  }

  function afterSet() {
    const currentIndex = indexRef.current;
    const currentSet = setNoRef.current;
    const current = playable!.blocks[currentIndex];
    if (!current) return;
    markDone(currentIndex);
    if (currentSet < current.sets) {
      if (current.restSec > 0) {
        setMode("rest");
        timer.start(current.restSec, () => {
          setSetNo((value) => value + 1);
          setMode("ready");
        });
      } else {
        setSetNo((value) => value + 1);
        setMode("ready");
      }
      return;
    }
    if (currentIndex >= playable!.blocks.length - 1) {
      setMode("feedback");
      return;
    }
    setIndex((value) => value + 1);
    setSetNo(1);
    setMode("ready");
  }

  function skip() {
    timer.stop();
    if (index >= playable!.blocks.length - 1) {
      setMode("feedback");
      return;
    }
    setIndex((value) => value + 1);
    setSetNo(1);
    setMode("ready");
  }

  function startWork() {
    if (!block) return;
    if (block.holdSec) {
      setMode("work");
      timer.start(block.holdSec, afterSet);
      return;
    }
    setMode("work");
  }

  function save() {
    if (form == null || effort == null || pain == null) return;
    const forThisLevel = Boolean(playable!.deload) || playable!.level === user.level;
    const counted =
      forThisLevel && !playable!.deload && !partial && form >= 4 && !pain && effort !== "too-hard";
    const reason = counted
      ? "This one counts toward the next step."
      : playable!.deload
        ? "Recovery is logged. It does not push the level — that is the point."
        : partial
          ? "Logged as a partial session. Finish most of the main work, with clean form and no pain, for it to count."
          : form < 4
            ? "Logged. Form under 4 stays in the history, but it does not unlock the next step."
            : pain
              ? "Logged. A pain flag pauses the step up. Ease that area next time."
              : effort === "too-hard"
                ? "Logged. Too hard is information, not a promotion. Stay with this level until the work feels repeatable."
                : "Logged. This stays in the history without moving the level.";
    logSession(
      {
        id: crypto.randomUUID(),
        at: Date.now(),
        sessionId: playable!.id,
        title: playable!.title,
        track: playable!.track,
        level: forThisLevel ? user.level : playable!.level,
        stage: forThisLevel ? user.stage : 1,
        date: todayKey(),
        form,
        effort,
        pain,
        painNote,
        deload: playable!.deload,
        bridge: playable!.bridge,
        partial,
        minutes: playable!.minutes,
      },
      pain ? extraPain : [],
    );
    setSavedCopy(reason);
    setMode("saved");
  }

  if (mode === "saved") {
    return (
      <AppFrame nav={false}>
        <Kicker>Logged</Kicker>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{playable.title}</h1>
        <p className="mt-4">{savedCopy}</p>
        {pain ? (
          <p className="mt-3 text-sm text-muted">
            Sharp pain means stop that pattern. Dull soreness is different. If it was sharp, give the area an easier day.
          </p>
        ) : null}
        <Link to="/" className={`${buttonClass()} mt-8`}>
          Back to today
        </Link>
        <Link to="/progress" search={{ ready: false }} className={`${buttonClass("secondary")} mt-3`}>
          See progress
        </Link>
      </AppFrame>
    );
  }

  if (mode === "feedback") {
    return (
      <AppFrame nav={false}>
        <Kicker>Session notes</Kicker>
        <h1 className="mt-2 font-display text-3xl font-medium tracking-tight">How did the work actually look?</h1>
        <p className="mt-2 text-sm text-muted">Honest scores are what keep the next level from arriving too early.</p>
        {partial ? (
          <p className="mt-3 text-sm text-warn">Less than 60% of the main work was completed, so this will log as partial.</p>
        ) : null}
        <fieldset className="mt-6">
          <legend className="font-medium">Form</legend>
          <div className="mt-2 grid grid-cols-5 gap-2">
            {([1, 2, 3, 4, 5] as const).map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setForm(score)}
                className={
                  form === score
                    ? "press min-h-14 rounded-md bg-accent text-lg font-medium text-accent-fg tabular-nums"
                    : "press min-h-14 rounded-md border border-line bg-surface text-lg font-medium tabular-nums"
                }
              >
                {score}
              </button>
            ))}
          </div>
          <p className="mt-2 flex justify-between text-xs text-muted">
            <span>Rough</span>
            <span>Clean</span>
          </p>
        </fieldset>
        <fieldset className="mt-6">
          <legend className="font-medium">Effort</legend>
          <div className="mt-2 grid gap-2">
            {(["too-easy", "just-right", "too-hard"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setEffort(value)}
                className={
                  effort === value
                    ? "press min-h-12 rounded-md bg-accent px-3 text-left font-medium text-accent-fg"
                    : "press min-h-12 rounded-md border border-line bg-surface px-3 text-left font-medium"
                }
              >
                {EFFORT_LABEL[value]}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className="font-medium">Any pain?</legend>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPain(false)}
              className={
                pain === false
                  ? "press min-h-12 rounded-md bg-accent font-medium text-accent-fg"
                  : "press min-h-12 rounded-md border border-line bg-surface font-medium"
              }
            >
              No
            </button>
            <button
              type="button"
              onClick={() => setPain(true)}
              className={
                pain === true
                  ? "press min-h-12 rounded-md border border-warn bg-surface-2 font-medium text-warn"
                  : "press min-h-12 rounded-md border border-line bg-surface font-medium"
              }
            >
              Yes
            </button>
          </div>
        </fieldset>
        {pain ? (
          <div className="mt-4">
            <label className="text-sm text-muted" htmlFor="pain-note">
              Where? Optional.
            </label>
            <input
              id="pain-note"
              value={painNote}
              onChange={(event) => setPainNote(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-md border border-line bg-surface-2 px-3"
            />
            <p className="mt-3 text-sm text-muted">Add it to your injury notes so the next session modifies that area.</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {PAIN_AREAS.map((area) => (
                <button
                  key={area}
                  type="button"
                  onClick={() =>
                    setExtraPain((current) =>
                      current.includes(area) ? current.filter((item) => item !== area) : [...current, area],
                    )
                  }
                  className={
                    extraPain.includes(area)
                      ? "press min-h-12 rounded-md border border-warn bg-surface-2 text-sm font-medium"
                      : "press min-h-12 rounded-md border border-line bg-surface text-sm font-medium"
                  }
                >
                  {PAIN_LABEL[area]}
                </button>
              ))}
            </div>
          </div>
        ) : null}
        <button type="button" className={`${buttonClass()} mt-8`} disabled={form == null || effort == null || pain == null} onClick={save}>
          Save session
        </button>
      </AppFrame>
    );
  }

  if (!block || !exercise) {
    return (
      <AppFrame nav={false}>
        <p>This session has no moves left.</p>
        <button type="button" className={`${buttonClass()} mt-4`} onClick={() => setMode("feedback")}>
          Log what you did
        </button>
      </AppFrame>
    );
  }

  return (
    <AppFrame nav={false}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {index + 1} of {playable.blocks.length} · {blockLabel(block.phase, exercise.kind)}
        </p>
        <button type="button" className="min-h-12 px-2 text-sm text-muted" onClick={() => setLeave(true)}>
          End
        </button>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-sage" style={{ width: `${(index / playable.blocks.length) * 100}%` }} />
      </div>
      {above && mode === "ready" && index === 0 ? (
        <p className="mt-4 text-sm text-warn">
          This is {LEVEL_LABEL[playable.level]}, above your {LEVEL_LABEL[user.level]} plan. You can try it. It will not skip the checks.
        </p>
      ) : null}
      <div className="mt-6">
        <Kicker>{TRACK_LABEL[playable.track]}</Kicker>
      </div>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{exercise.name}</h1>
      <p className="mt-2 text-sage">{exercise.why}</p>
      <p className="mt-3 text-sm text-muted">
        Set {setNo} of {block.sets}
        {" · "}
        {block.holdSec ? `Hold ${block.holdSec}s` : block.reps}
        {block.restSec > 0 ? ` · Rest ${block.restSec}s` : ""}
      </p>
      {block.adaptNote ? <p className="mt-2 text-sm text-warn">{block.adaptNote}</p> : null}
      {exercise.prerequisite ? <p className="mt-2 text-sm text-muted">Prerequisite: {exercise.prerequisite}</p> : null}

      {mode === "ready" ? (
        <Panel className="mt-5">
          <p className="text-sm text-muted">Setup</p>
          <p className="mt-1">{exercise.setup}</p>
          <p className="mt-4 text-sm text-muted">Do this</p>
          <p className="mt-1">{exercise.instructions}</p>
          <p className="mt-4 font-medium">{exercise.cues[0]}</p>
          <ul className="mt-2 list-disc pl-5 text-sm text-muted">
            {exercise.cues.slice(1).map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
        </Panel>
      ) : null}

      {mode === "work" && block.holdSec ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted">Hold</p>
          <p className="mt-2 font-display text-6xl tabular-nums" aria-live="polite">
            {clock(timer.remainingMs)}
          </p>
          <p className="mt-4 text-lg">{exercise.cues[0]}</p>
        </div>
      ) : null}

      {mode === "work" && !block.holdSec ? (
        <Panel className="mt-5">
          <p className="font-medium">{block.reps}</p>
          <p className="mt-2 text-muted">{exercise.cues[0]}</p>
          <p className="mt-3 text-sm text-muted">Stop the set when the cue breaks. A shorter clean set beats a longer sloppy one.</p>
        </Panel>
      ) : null}

      {mode === "rest" ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-muted">Rest</p>
          <p className="mt-2 font-display text-6xl tabular-nums" aria-live="polite">
            {clock(timer.remainingMs)}
          </p>
          <p className="mt-4 text-muted">Start the next set when you can keep the cues. Rest is part of the work.</p>
        </div>
      ) : null}

      <details className="mt-5 rounded-lg border border-line bg-surface px-4 py-3">
        <summary className="min-h-12 cursor-pointer py-2 font-medium">Mistakes and options</summary>
        <p className="mt-2 text-sm text-muted">Avoid</p>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {exercise.mistakes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Easier</p>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {exercise.modifications.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Harder, only if today is clean</p>
        <ul className="mt-1 list-disc pl-5 text-sm">
          {exercise.progressions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Equipment: {exercise.equipment}</p>
      </details>

      <div className="pb-36">
      {index < playable.blocks.length - 1 ? (
        <p className="mt-4 text-sm text-muted">Next: {getExercise(playable.blocks[index + 1]!.exerciseId)?.name}</p>
      ) : (
        <p className="mt-4 text-sm text-muted">Last move. Notes come after this.</p>
      )}
      <p className="mt-4 text-xs text-subtle">Stop for sharp pain. Quality over speed.</p>
      </div>

      <div className="pb-safe-bar fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg px-4 pt-3">
        <div className="mx-auto grid max-w-xl gap-2">
        {mode === "ready" ? (
          <button type="button" className={buttonClass()} onClick={startWork}>
            {block.holdSec ? "Start hold" : "Start set"}
          </button>
        ) : null}
        {mode === "work" && block.holdSec ? (
          <button type="button" className={buttonClass()} onClick={() => (timer.running ? timer.pause() : timer.resume())}>
            {timer.running ? "Pause" : "Resume"}
          </button>
        ) : null}
        {mode === "work" && !block.holdSec ? (
          <button type="button" className={buttonClass()} onClick={afterSet}>
            Set done
          </button>
        ) : null}
        {mode === "work" && block.holdSec ? (
          <button
            type="button"
            className={buttonClass("secondary")}
            onClick={() => {
              timer.stop();
              afterSet();
            }}
          >
            End set early
          </button>
        ) : null}
        {mode === "rest" ? (
          <button
            type="button"
            className={buttonClass("secondary")}
            onClick={() => {
              timer.stop();
              setSetNo((value) => value + 1);
              setMode("ready");
            }}
          >
            Skip rest
          </button>
        ) : null}
        {mode === "ready" ? (
          <button type="button" className={buttonClass("secondary")} onClick={skip}>
            Skip this move
          </button>
        ) : null}
        </div>
      </div>

      {leave ? (
        <div className="scrim fixed inset-0 z-30 flex items-end p-4">
          <div className="mx-auto w-full max-w-xl rounded-xl border border-line bg-surface p-4">
            <h2 className="font-display text-2xl font-medium">End this session?</h2>
            <p className="mt-2 text-sm text-muted">If you leave without notes, nothing is logged and the streak does not change.</p>
            <button
              type="button"
              className={`${buttonClass()} mt-4`}
              onClick={() => {
                timer.stop();
                setLeave(false);
                setMode("feedback");
              }}
            >
              Log what I did
            </button>
            <Link to="/" className={`${buttonClass("secondary")} mt-2`} onClick={() => timer.stop()}>
              Discard
            </Link>
            <button type="button" className={`${buttonClass("ghost")} mt-2`} onClick={() => setLeave(false)}>
              Keep going
            </button>
          </div>
        </div>
      ) : null}
    </AppFrame>
  );
}
