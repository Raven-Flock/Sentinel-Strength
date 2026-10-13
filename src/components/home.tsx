import { Link } from "@tanstack/react-router";
import { Shield } from "lucide-react";
import { JOB_LINE, LEVEL_LABEL, LEVEL_NAME, LEVEL_WHY, STAGE_LABEL, TRACK_LABEL } from "@/data/labels";
import { evaluate, sessionsUntilDeload } from "@/data/progression";
import { PAIN_LABEL } from "@/data/labels";
import { TRACKS } from "@/data/types";
import { useStore } from "@/lib/store";
import { recommend, streak, weekRhythm } from "@/lib/training";
import { buttonClass, Kicker, Meter, Panel } from "./ui";

function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function Home() {
  const profile = useStore((state) => state.profile);
  const tracks = useStore((state) => state.tracks);
  const logs = useStore((state) => state.logs);
  const notice = useStore((state) => state.notice);
  const dismiss = useStore((state) => state.dismissNotice);
  const setTrack = useStore((state) => state.setTrack);
  const track = profile.preferredTrack;
  const state = tracks[track];
  const report = evaluate({
    track,
    level: state.level,
    stage: state.stage,
    logs,
    checks: state.checks,
  });
  const today = recommend({
    track,
    level: state.level,
    stage: state.stage,
    length: profile.sessionLength,
    pain: profile.painAreas,
    logs,
  });
  const dayStreak = streak(logs);
  const job = profile.jobDemands[0];
  const recent = logs.filter((log) => log.track === track).slice(-3).reverse();
  const painLabel = profile.painAreas.map((area) => PAIN_LABEL[area].toLowerCase()).join(", ");
  const untilDeload = sessionsUntilDeload(logs, track, state.level);

  return (
    <div>
      <header className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-muted">
            <Shield className="size-4" aria-hidden="true" />
            <p className="font-display text-xs font-medium tracking-brand uppercase">Sentinel</p>
          </div>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{greeting()}</h1>
        </div>
        <p className="rounded-md border border-line bg-surface px-3 py-2 text-right">
          <span className="block font-display text-2xl tabular-nums leading-none">{dayStreak}</span>
          <span className="text-xs text-muted">{dayStreak === 1 ? "day" : "day streak"}</span>
        </p>
      </header>

      {notice ? (
        <Panel className="mt-5">
          <p className="font-medium">{notice.title}</p>
          <p className="mt-1 text-sm text-muted">{notice.body}</p>
          <button type="button" className={`${buttonClass("secondary")} mt-3`} onClick={dismiss}>
            Got it
          </button>
        </Panel>
      ) : null}

      <div className="mt-6 grid grid-cols-3 gap-2" role="tablist" aria-label="Track">
        {TRACKS.map((id) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={id === track}
            onClick={() => setTrack(id)}
            className={
              id === track
                ? "press min-h-12 rounded-md bg-accent px-2 text-sm font-medium text-accent-fg"
                : "press min-h-12 rounded-md border border-line bg-surface px-2 text-sm font-medium text-fg"
            }
          >
            {TRACK_LABEL[id]}
          </button>
        ))}
      </div>

      <Panel className="mt-4">
        <Kicker>
          {LEVEL_LABEL[state.level]} · {LEVEL_NAME[state.level]}
        </Kicker>
        <h2 className="mt-2 font-display text-2xl font-medium tracking-tight">{STAGE_LABEL[state.stage]}</h2>
        <p className="mt-2 text-sm text-muted">{LEVEL_WHY[state.level]}</p>
        <div className="mt-4">
          <Meter
            value={report.qualityCount}
            max={report.qualityNeeded}
            label={report.kind === "maintain" ? "Clean sessions in the recent window" : "Clean sessions toward the next step"}
          />
        </div>
        {state.level === "advanced" || state.level === "expert" ? (
          <p className="mt-3 text-sm text-muted">
            {untilDeload === 0
              ? "Recovery session is up. Today's plan is the lighter day."
              : `${untilDeload} harder session${untilDeload === 1 ? "" : "s"} until a recovery day.`}
          </p>
        ) : null}
      </Panel>

      {report.ready && !state.stay ? (
        <Panel className="mt-3 border-sage">
          <Kicker>Ready</Kicker>
          <p className="mt-2 font-medium">{report.headline}</p>
          <p className="mt-1 text-sm text-muted">The checks are met. Read what changes before you move.</p>
          <Link to="/progress" search={{ ready: true }} className={`${buttonClass()} mt-4`}>
            Review the step up
          </Link>
        </Panel>
      ) : null}

      {report.ready && state.stay ? (
        <p className="mt-3 text-sm text-muted">
          You asked to stay at this level. The next step is waiting in Progress whenever you want it.
        </p>
      ) : null}

      <Panel className="mt-4">
        <Kicker>{today.reason === "deload" ? "Recovery day" : "Today"}</Kicker>
        <h2 className="mt-2 font-display text-2xl font-medium tracking-tight">{today.title}</h2>
        <p className="mt-1 text-sm text-muted">
          {today.minutes} min · {TRACK_LABEL[track]} · Warm-up through cool-down
        </p>
        <p className="mt-3">{today.intent}</p>
        <p className="mt-3 text-sm text-sage">{job ? JOB_LINE[job] : "Built for lifting, carrying, and uneven ground."}</p>
        {painLabel ? <p className="mt-2 text-sm text-muted">Modifying for {painLabel}.</p> : null}
        {today.scaffold ? (
          <p className="mt-2 text-sm text-muted">
            This level is intentionally lean: the moves and the rules are real. More sessions can be added later without changing how you progress.
          </p>
        ) : null}
        <Link to="/session/$sessionId" params={{ sessionId: today.id }} className={`${buttonClass()} mt-4`}>
          Start session
        </Link>
      </Panel>

      <section className="mt-6">
        <h2 className="font-display text-xl font-medium">Three-day rhythm</h2>
        <p className="mt-1 text-sm text-muted">A simple week if you train three days. Tap one to switch tracks.</p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {weekRhythm(track).map((day) => (
            <button
              key={day.label}
              type="button"
              onClick={() => setTrack(day.track)}
              className="press min-h-20 rounded-lg border border-line bg-surface p-2 text-left"
            >
              <span className="block text-xs text-muted">{day.label}</span>
              <span className="mt-1 block text-sm font-medium">{day.title}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-xl font-medium">Other tracks</h2>
        <div className="mt-3 grid gap-2">
          {TRACKS.filter((id) => id !== track).map((id) => {
            const other = tracks[id];
            const otherReport = evaluate({
              track: id,
              level: other.level,
              stage: other.stage,
              logs,
              checks: other.checks,
            });
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTrack(id)}
                className="press rounded-lg border border-line bg-surface p-3 text-left"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{TRACK_LABEL[id]}</span>
                  <span className="text-sm text-muted">
                    {LEVEL_LABEL[other.level]} · {STAGE_LABEL[other.stage]}
                  </span>
                </span>
                <span className="mt-2 block">
                  <Meter value={otherReport.qualityCount} max={otherReport.qualityNeeded} label="Toward the next step" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-display text-xl font-medium">Recent notes</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Finish a session and rate the form. That is what moves the bar — not how tired you feel.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {recent.map((log) => (
              <li key={log.id} className="rounded-lg border border-line bg-surface px-3 py-3 text-sm">
                <span className="font-medium">{log.title}</span>
                <span className="mt-1 block text-muted">
                  Form {log.form}/5 · {log.effort === "too-easy" ? "Too easy" : log.effort === "too-hard" ? "Too hard" : "Just right"}
                  {log.pain ? " · Pain flagged" : " · No pain"}
                  {log.partial ? " · Partial" : ""}
                  {log.deload ? " · Recovery" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-8 text-xs text-subtle">
        Stop for sharp pain. This is coaching, not medical advice. Progress stays on this phone.
      </p>
    </div>
  );
}
