import { useState } from "react";
import { placementFromAnswers, READINESS, type PlacementAnswers } from "@/data/progression";
import { JOB_LABEL, LEVEL_NAME, PAIN_LABEL, TRACK_FULL, TRACK_LABEL } from "@/data/labels";
import type { Activity, JobDemand, LevelId, PainArea, SessionLength, TrackId } from "@/data/types";
import { JOBS, PAIN_AREAS, TRACKS } from "@/data/types";
import { useStore } from "@/lib/store";
import { buttonClass, Choice, Kicker, Panel } from "./ui";

const ACTIVITIES: { id: Activity; title: string; detail: string }[] = [
  { id: "getting-started", title: "Getting started", detail: "New to training like this." },
  { id: "some-training", title: "Some training", detail: "I move, but not on a plan." },
  { id: "training-regularly", title: "Training most weeks", detail: "I already practice on purpose." },
];

const LENGTHS: { id: SessionLength; title: string; detail: string }[] = [
  { id: 15, title: "15 minutes", detail: "Warm-up, three main moves, a short close." },
  { id: 25, title: "25 minutes", detail: "The standard session." },
  { id: 40, title: "40 minutes", detail: "Same plan, an extra set on the main work." },
];

export function Onboarding() {
  const finish = useStore((state) => state.finishOnboarding);
  const [step, setStep] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [activity, setActivity] = useState<Activity>("getting-started");
  const [pain, setPain] = useState<PainArea[]>([]);
  const [jobs, setJobs] = useState<JobDemand[]>([]);
  const [length, setLength] = useState<SessionLength>(25);
  const [track, setTrack] = useState<TrackId>("combined");
  const [wantCheck, setWantCheck] = useState(false);
  const [answers, setAnswers] = useState<PlacementAnswers>({});
  const [chosen, setChosen] = useState<LevelId>("beginner");

  const placement = placementFromAnswers(answers);
  const total = wantCheck ? 8 : 7;

  function togglePain(area: PainArea) {
    setPain((current) => (current.includes(area) ? current.filter((item) => item !== area) : [...current, area]));
  }

  function toggleJob(job: JobDemand) {
    setJobs((current) => (current.includes(job) ? current.filter((item) => item !== job) : [...current, job]));
  }

  function finishWith(level: LevelId) {
    finish(
      {
        onboarded: true,
        disclaimerAccepted: true,
        activity,
        painAreas: pain,
        jobDemands: jobs,
        sessionLength: length,
        preferredTrack: track,
        remindersOn: false,
        reminderTime: "06:30",
      },
      level,
    );
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-xl bg-bg px-4 py-6 text-fg">
      <Kicker>Sentinel Strength</Kicker>
      <p className="mt-2 text-sm text-muted">
        Step {Math.min(step + 1, total)} of {total}
      </p>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full bg-sage" style={{ width: `${((step + 1) / total) * 100}%` }} />
      </div>

      {step === 0 ? (
        <div className="mt-8">
          <h1 className="font-display text-4xl font-medium tracking-tight">Train so the job does not break you down.</h1>
          <p className="mt-4 text-muted">
            Core, balance, soft landings, and mobility. No gym. Sessions run 15 to 40 minutes. Quality beats intensity — sloppy reps do not move you up.
          </p>
          <Panel className="mt-6">
            <p className="font-medium">Before you start</p>
            <p className="mt-2 text-sm text-muted">
              This is general fitness coaching, not medical care. Talk to a doctor before you begin, especially with an injury, pregnancy, or any limit a clinician already gave you. Stop for sharp pain, dizziness, chest pain, or numbness. Muscle soreness can be normal. Sharp pain is a stop signal.
            </p>
            <label className="mt-4 flex min-h-12 items-start gap-3 text-sm">
              <input
                type="checkbox"
                className="mt-1 size-5 accent-sage"
                checked={accepted}
                onChange={(event) => setAccepted(event.target.checked)}
              />
              <span>I understand. I will stop if something feels sharp, and this app is not medical advice.</span>
            </label>
          </Panel>
          <button type="button" className={`${buttonClass()} mt-6`} disabled={!accepted} onClick={() => setStep(1)}>
            Continue
          </button>
        </div>
      ) : null}

      {step === 1 ? (
        <Step title="How steady is your training right now?" onBack={() => setStep(0)}>
          <div className="grid gap-2">
            {ACTIVITIES.map((item) => (
              <Choice key={item.id} selected={activity === item.id} onClick={() => setActivity(item.id)}>
                <span className="block">{item.title}</span>
                <span className={activity === item.id ? "block text-sm opacity-80" : "block text-sm text-muted"}>{item.detail}</span>
              </Choice>
            ))}
          </div>
          <button type="button" className={`${buttonClass()} mt-6`} onClick={() => setStep(2)}>
            Continue
          </button>
        </Step>
      ) : null}

      {step === 2 ? (
        <Step title="Any areas to protect?" onBack={() => setStep(1)}>
          <p className="text-muted">We will swap or shorten moves that load these. This is not a diagnosis.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {PAIN_AREAS.map((area) => (
              <Choice key={area} selected={pain.includes(area)} onClick={() => togglePain(area)}>
                {PAIN_LABEL[area]}
              </Choice>
            ))}
          </div>
          <button type="button" className={`${buttonClass("ghost")} mt-3`} onClick={() => setPain([])}>
            None right now
          </button>
          <button type="button" className={`${buttonClass()} mt-4`} onClick={() => setStep(3)}>
            Continue
          </button>
        </Step>
      ) : null}

      {step === 3 ? (
        <Step title="What does the work ask of you?" onBack={() => setStep(2)}>
          <p className="text-muted">Optional. It changes the coaching line, not the exercises.</p>
          <div className="mt-4 grid gap-2">
            {JOBS.map((job) => (
              <Choice key={job} selected={jobs.includes(job)} onClick={() => toggleJob(job)}>
                {JOB_LABEL[job]}
              </Choice>
            ))}
          </div>
          <button type="button" className={`${buttonClass()} mt-6`} onClick={() => setStep(4)}>
            Continue
          </button>
        </Step>
      ) : null}

      {step === 4 ? (
        <Step title="How long can you train?" onBack={() => setStep(3)}>
          <div className="grid gap-2">
            {LENGTHS.map((item) => (
              <Choice key={item.id} selected={length === item.id} onClick={() => setLength(item.id)}>
                <span className="block">{item.title}</span>
                <span className={length === item.id ? "block text-sm opacity-80" : "block text-sm text-muted"}>{item.detail}</span>
              </Choice>
            ))}
          </div>
          <button type="button" className={`${buttonClass()} mt-6`} onClick={() => setStep(5)}>
            Continue
          </button>
        </Step>
      ) : null}

      {step === 5 ? (
        <Step title="Where do you want to start?" onBack={() => setStep(4)}>
          <div className="grid gap-2">
            {TRACKS.map((id) => (
              <Choice key={id} selected={track === id} onClick={() => setTrack(id)}>
                <span className="block">{TRACK_LABEL[id]}</span>
                <span className={track === id ? "block text-sm opacity-80" : "block text-sm text-muted"}>{TRACK_FULL[id]}</span>
              </Choice>
            ))}
          </div>
          <p className="mt-3 text-sm text-muted">You can switch tracks any day. Each one keeps its own level.</p>
          <button type="button" className={`${buttonClass()} mt-6`} onClick={() => setStep(6)}>
            Continue
          </button>
        </Step>
      ) : null}

      {step === 6 ? (
        <Step title="Everyone can start at Foundation." onBack={() => setStep(5)}>
          <p className="text-muted">
            Foundation is the right start unless you can already land quietly, brace, and balance. Expert is earned inside the app. It is not a starting point.
          </p>
          <button
            type="button"
            className={`${buttonClass()} mt-6`}
            onClick={() => {
              setWantCheck(false);
              setChosen("beginner");
              finishWith("beginner");
            }}
          >
            Start at Beginner
          </button>
          <button
            type="button"
            className={`${buttonClass("secondary")} mt-3`}
            onClick={() => {
              setWantCheck(true);
              setStep(7);
            }}
          >
            I've trained — run a readiness check
          </button>
        </Step>
      ) : null}

      {step === 7 ? (
        <Step title="Readiness check" onBack={() => setStep(6)}>
          <p className="text-muted">Answer for this week, not for your best day last year. A no keeps you safer.</p>
          <div className="mt-4 grid gap-4">
            <CheckGroup
              title="To start at Intermediate"
              items={READINESS.intermediate}
              answers={answers}
              onToggle={(id) => setAnswers((current) => ({ ...current, [id]: !current[id] }))}
            />
            <CheckGroup
              title="To start at Advanced"
              items={READINESS.advanced}
              answers={answers}
              onToggle={(id) => setAnswers((current) => ({ ...current, [id]: !current[id] }))}
            />
          </div>
          <button
            type="button"
            className={`${buttonClass()} mt-6`}
            onClick={() => {
              setChosen(placement.level);
              setStep(8);
            }}
          >
            See where that puts you
          </button>
        </Step>
      ) : null}

      {step === 8 ? (
        <Step title={`${LEVEL_NAME[chosen]} is the match.`} onBack={() => setStep(7)}>
          <Panel>
            <p>
              {placement.passedAdvanced
                ? "You cleared the Advanced checks. All three tracks will start there. If yoga feels high, move that track down in Settings — you cannot skip upward later."
                : placement.passedIntermediate
                  ? "You cleared the Intermediate checks, not the Advanced ones. Build is the start. Expert still has to be earned."
                  : "At least one Foundation skill is still open. That is what Beginner trains. You can move up when the session record says so."}
            </p>
          </Panel>
          <div className="mt-4 grid gap-2">
            {(["beginner", "intermediate", "advanced"] as LevelId[])
              .filter((level) => levelRank(level) <= levelRank(placement.level))
              .map((level) => (
                <Choice key={level} selected={chosen === level} onClick={() => setChosen(level)}>
                  Start at {LEVEL_NAME[level]}
                </Choice>
              ))}
          </div>
          <button type="button" className={`${buttonClass()} mt-6`} onClick={() => finishWith(chosen)}>
            Start training
          </button>
        </Step>
      ) : null}
    </div>
  );
}

function levelRank(level: LevelId): number {
  if (level === "beginner") return 0;
  if (level === "intermediate") return 1;
  if (level === "advanced") return 2;
  return 3;
}

function Step({ title, onBack, children }: { title: string; onBack: () => void; children: React.ReactNode }) {
  return (
    <div className="mt-8">
      <button type="button" className="text-sm text-muted" onClick={onBack}>
        Back
      </button>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function CheckGroup({
  title,
  items,
  answers,
  onToggle,
}: {
  title: string;
  items: ReadonlyArray<{ id: string; prompt: string }>;
  answers: PlacementAnswers;
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset>
      <legend className="text-sm font-medium text-muted">{title}</legend>
      <div className="mt-2 grid gap-2">
        {items.map((item) => (
          <Choice key={item.id} selected={Boolean(answers[item.id])} onClick={() => onToggle(item.id)}>
            {item.prompt}
          </Choice>
        ))}
      </div>
    </fieldset>
  );
}
