import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { LEVEL_LABEL, LEVEL_NAME, LEVEL_WHY, STAGE_LABEL, TRACK_FULL, TRACK_LABEL } from "@/data/labels";
import { evaluate, nextLevel, sessionsUntilDeload } from "@/data/progression";
import { LEVELS, TRACKS, type TrackId } from "@/data/types";
import { useStore } from "@/lib/store";
import { bridgeSession, calendarCells, formatDay, todayKey } from "@/lib/training";
import { buttonClass, Kicker, Meter, Panel } from "./ui";

export function ProgressView({ openReady }: { openReady: boolean }) {
  const profile = useStore((state) => state.profile);
  const tracks = useStore((state) => state.tracks);
  const logs = useStore((state) => state.logs);
  const toggleCheck = useStore((state) => state.toggleCheck);
  const setStay = useStore((state) => state.setStay);
  const advance = useStore((state) => state.advance);
  const setTrack = useStore((state) => state.setTrack);
  const [track, setLocalTrack] = useState<TrackId>(profile.preferredTrack);
  const [showReady, setShowReady] = useState(openReady);
  const state = tracks[track];
  const report = evaluate({
    track,
    level: state.level,
    stage: state.stage,
    logs,
    checks: state.checks,
  });
  const bridge = bridgeSession({
    track,
    level: state.level,
    stage: state.stage,
    length: profile.sessionLength,
    pain: profile.painAreas,
  });
  const history = logs.filter((log) => log.track === track).slice().reverse();
  const until = sessionsUntilDeload(logs, track, state.level);
  const cells = calendarCells();
  const byDay = new Map<string, { any: boolean; pain: boolean }>();
  for (const log of logs) {
    const current = byDay.get(log.date) ?? { any: false, pain: false };
    current.any = true;
    current.pain = current.pain || log.pain;
    byDay.set(log.date, current);
  }
  const today = todayKey();

  function selectTrack(id: TrackId) {
    setLocalTrack(id);
    setTrack(id);
    setShowReady(false);
  }

  if (showReady && report.kind !== "maintain") {
    return (
      <div>
        <button type="button" className="text-sm text-muted" onClick={() => setShowReady(false)}>
          Back to checklist
        </button>
        <div className="mt-4">
          <Kicker>{TRACK_LABEL[track]}</Kicker>
        </div>
        <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">
          {report.ready ? report.headline : "Not yet"}
        </h1>
        <p className="mt-3 text-muted">
          {report.ready
            ? `Next: ${report.nextTitle}.`
            : "The screen below is what changes when the checklist is complete. Nothing moves until it is."}
        </p>
        <Panel className="mt-5">
          <p className="text-sm text-muted">What changes</p>
          <p className="mt-1">{report.changes}</p>
          <p className="mt-4 text-sm text-muted">Why it is safer now</p>
          <p className="mt-1">{report.safer}</p>
          <p className="mt-4 text-sm text-muted">How to transition</p>
          <p className="mt-1">{report.how}</p>
          {report.flavor ? <p className="mt-4 text-sage">{report.flavor}</p> : null}
        </Panel>
        {report.kind === "level" && bridge ? (
          <Link to="/session/$sessionId" params={{ sessionId: bridge.id }} className={`${buttonClass("secondary")} mt-4`}>
            Optional bridge session
          </Link>
        ) : null}
        <button type="button" className={`${buttonClass()} mt-3`} disabled={!report.ready} onClick={() => advance(track)}>
          {report.kind === "stage" ? "Start owning the pattern" : `Move up to ${report.nextTitle}`}
        </button>
        <button type="button" className={`${buttonClass("ghost")} mt-2`} onClick={() => setStay(track, true)}>
          Stay at this level
        </button>
        {!report.ready ? (
          <p className="mt-4 text-sm text-muted">The move-up button stays off until every line in the checklist is true.</p>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <Kicker>Progress</Kicker>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">How you move up</h1>
      <p className="mt-2 text-muted">{TRACK_FULL[track]}. Clean sessions, spread out, with no pain flag.</p>

      <div className="mt-5 grid grid-cols-3 gap-2">
        {TRACKS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => selectTrack(id)}
            className={
              id === track
                ? "press min-h-12 rounded-md bg-accent px-2 text-sm font-medium text-accent-fg"
                : "press min-h-12 rounded-md border border-line bg-surface text-sm font-medium"
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
        <h2 className="mt-2 font-display text-2xl font-medium">{STAGE_LABEL[state.stage]}</h2>
        <p className="mt-2 text-sm text-muted">{LEVEL_WHY[state.level]}</p>
        <ol className="mt-4 grid grid-cols-4 gap-2">
          {LEVELS.map((level) => {
            const rank = LEVELS.indexOf(level);
            const current = LEVELS.indexOf(state.level);
            const on = rank === current;
            const done = rank < current;
            return (
              <li key={level} className="min-w-0">
                <span className={`block h-1 rounded-full ${on ? "bg-sage" : done ? "bg-fg" : "bg-surface-2"}`} />
                <span className={`mt-2 block text-xs leading-tight ${on ? "text-fg" : "text-subtle"}`}>
                  {level === "beginner" ? "Base" : level === "intermediate" ? "Build" : level === "advanced" ? "Power" : "Master"}
                </span>
              </li>
            );
          })}
        </ol>
        <div className="mt-4">
          <Meter value={report.qualityCount} max={report.qualityNeeded} label="Clean sessions in this gate" />
        </div>
      </Panel>

      {report.kind !== "maintain" ? (
        <button type="button" className={`${buttonClass()} mt-4`} onClick={() => setShowReady(true)}>
          {report.ready ? "You're ready — see the step up" : "Level check"}
        </button>
      ) : (
        <Panel className="mt-4">
          <p className="font-medium">No next level</p>
          <p className="mt-2 text-sm text-muted">{report.changes}</p>
        </Panel>
      )}

      {state.stay ? (
        <button type="button" className={`${buttonClass("ghost")} mt-2`} onClick={() => setStay(track, false)}>
          I'm willing to look at moving up again
        </button>
      ) : null}

      <section className="mt-6">
        <h2 className="font-display text-xl font-medium">Checklist</h2>
        <ul className="mt-3 grid gap-2">
          {report.criteria.map((item) => (
            <li key={item.id} className="rounded-lg border border-line bg-surface p-3">
              {item.selfCheck ? (
                <button type="button" className="flex w-full items-start gap-3 text-left" onClick={() => toggleCheck(track, item.id)}>
                  <span
                    className={
                      item.met
                        ? "mt-0.5 grid size-6 shrink-0 place-items-center rounded-sm bg-accent text-xs text-accent-fg"
                        : "mt-0.5 size-6 shrink-0 rounded-sm border border-line"
                    }
                    aria-hidden="true"
                  />
                  <span>
                    <span className="block font-medium">{item.label}</span>
                    <span className="mt-1 block text-sm text-muted">{item.detail}</span>
                    <span className="mt-1 block text-sm tabular-nums text-sage">{item.progressText}</span>
                  </span>
                </button>
              ) : (
                <div>
                  <p className="font-medium">
                    {item.met ? "Met" : "Not yet"} — {item.label}
                  </p>
                  <p className="mt-1 text-sm text-muted">{item.detail}</p>
                  <p className="mt-1 text-sm tabular-nums text-sage">{item.progressText}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {until != null ? (
        <p className="mt-4 text-sm text-muted">
          {until === 0
            ? "A recovery session is due. Today's recommendation on the home screen is the lighter day."
            : `${until} non-recovery session${until === 1 ? "" : "s"} until the app asks for a deload.`}
        </p>
      ) : (
        <p className="mt-4 text-sm text-muted">
          Formal deload weeks start at Advanced. Before that, use a recovery session from the library when you are beat up.
        </p>
      )}

      {nextLevel(state.level) && report.kind === "level" ? (
        <Panel className="mt-4">
          <p className="text-sm text-muted">When you do move up</p>
          <p className="mt-2">{report.changes}</p>
          <p className="mt-2 text-sm text-sage">{report.flavor}</p>
        </Panel>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-xl font-medium">Calendar</h2>
        <p className="mt-1 text-sm text-muted">Every track. A filled day is a logged session. A mark means pain was flagged.</p>
        <div className="mt-3 grid grid-cols-7 gap-1 text-center text-xs text-subtle">
          {["S", "M", "T", "W", "T", "F", "S"].map((label, index) => (
            <div key={`${label}-${index}`}>{label}</div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((cell) => {
            const info = byDay.get(cell.iso);
            const isToday = cell.iso === today;
            return (
              <div
                key={cell.iso}
                className={
                  info?.pain
                    ? "relative grid aspect-square place-items-center rounded-sm bg-sage text-xs text-accent-fg tabular-nums ring-2 ring-warn"
                    : info?.any
                      ? "grid aspect-square place-items-center rounded-sm bg-sage text-xs text-accent-fg tabular-nums"
                      : isToday
                        ? "grid aspect-square place-items-center rounded-sm border border-fg text-xs tabular-nums"
                        : "grid aspect-square place-items-center rounded-sm text-xs text-subtle tabular-nums"
                }
              >
                <span className={cell.inRange ? "" : "opacity-30"}>
                  {cell.day}
                  {info?.pain ? <span className="sr-only">, pain flagged</span> : null}
                </span>
                {info?.pain ? (
                  <span className="absolute right-1 top-1 size-1.5 rounded-full bg-warn" aria-hidden="true" />
                ) : null}
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-medium">History</h2>
        {history.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No {TRACK_LABEL[track].toLowerCase()} sessions yet.</p>
        ) : (
          <ul className="mt-3 grid gap-2">
            {history.map((log) => (
              <li key={log.id} className="rounded-lg border border-line bg-surface px-3 py-3 text-sm">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{log.title}</span>
                  <span className="text-muted">{formatDay(log.date)}</span>
                </span>
                <span className="mt-1 block text-muted">
                  {LEVEL_LABEL[log.level]} · Form {log.form}/5 ·{" "}
                  {log.effort === "too-easy" ? "Too easy" : log.effort === "too-hard" ? "Too hard" : "Just right"}
                  {log.pain ? " · Pain" : ""}
                  {log.partial ? " · Partial" : ""}
                  {log.deload ? " · Recovery" : ""}
                  {log.bridge ? " · Bridge" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
