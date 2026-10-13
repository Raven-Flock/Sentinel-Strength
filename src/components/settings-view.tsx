import { useState } from "react";
import { JOB_LABEL, LEVEL_LABEL, LEVEL_NAME, PAIN_LABEL, TRACK_LABEL } from "@/data/labels";
import { JOBS, LEVELS, PAIN_AREAS, TRACKS, type LevelId, type SessionLength, type TrackId } from "@/data/types";
import { useStore } from "@/lib/store";
import { buttonClass, Kicker, Panel } from "./ui";

const LENGTHS: SessionLength[] = [15, 25, 40];

export function SettingsView() {
  const profile = useStore((state) => state.profile);
  const tracks = useStore((state) => state.tracks);
  const update = useStore((state) => state.updateProfile);
  const dropTrack = useStore((state) => state.dropTrack);
  const resetAll = useStore((state) => state.resetAll);
  const [confirm, setConfirm] = useState(false);
  const [drop, setDrop] = useState<{ track: TrackId; level: LevelId } | null>(null);

  function togglePain(area: (typeof PAIN_AREAS)[number]) {
    const painAreas = profile.painAreas.includes(area)
      ? profile.painAreas.filter((item) => item !== area)
      : [...profile.painAreas, area];
    update({ painAreas });
  }

  function toggleJob(job: (typeof JOBS)[number]) {
    const jobDemands = profile.jobDemands.includes(job)
      ? profile.jobDemands.filter((item) => item !== job)
      : [...profile.jobDemands, job];
    update({ jobDemands });
  }

  return (
    <div>
      <Kicker>Settings</Kicker>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Make it fit the work</h1>

      <section className="mt-6">
        <h2 className="font-medium">Session length</h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {LENGTHS.map((length) => (
            <button
              key={length}
              type="button"
              onClick={() => update({ sessionLength: length })}
              className={
                profile.sessionLength === length
                  ? "press min-h-12 rounded-md bg-accent text-sm font-medium text-accent-fg"
                  : "press min-h-12 rounded-md border border-line bg-surface text-sm font-medium"
              }
            >
              {length} min
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-medium">Default track</h2>
        <div className="mt-2 grid gap-2">
          {TRACKS.map((track) => (
            <button
              key={track}
              type="button"
              onClick={() => update({ preferredTrack: track })}
              className={
                profile.preferredTrack === track
                  ? "press min-h-12 rounded-md bg-accent px-3 text-left font-medium text-accent-fg"
                  : "press min-h-12 rounded-md border border-line bg-surface px-3 text-left font-medium"
              }
            >
              {TRACK_LABEL[track]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-medium">Injury notes</h2>
        <p className="mt-1 text-sm text-muted">Sessions swap or shorten moves that load these areas. Update them when something changes.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {PAIN_AREAS.map((area) => (
            <button
              key={area}
              type="button"
              onClick={() => togglePain(area)}
              className={
                profile.painAreas.includes(area)
                  ? "press min-h-12 rounded-md border border-warn bg-surface-2 text-sm font-medium"
                  : "press min-h-12 rounded-md border border-line bg-surface text-sm font-medium"
              }
            >
              {PAIN_LABEL[area]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-medium">Job demands</h2>
        <div className="mt-3 grid gap-2">
          {JOBS.map((job) => (
            <button
              key={job}
              type="button"
              onClick={() => toggleJob(job)}
              className={
                profile.jobDemands.includes(job)
                  ? "press min-h-12 rounded-md bg-accent px-3 text-left text-sm font-medium text-accent-fg"
                  : "press min-h-12 rounded-md border border-line bg-surface px-3 text-left text-sm font-medium"
              }
            >
              {JOB_LABEL[job]}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="font-medium">Reminder</h2>
        <p className="mt-1 text-sm text-muted">
          Saved on this phone. Open Sentinel around this time — background alerts depend on the browser, so this is a cue, not a guarantee.
        </p>
        <label className="mt-3 flex min-h-12 items-center justify-between gap-3">
          <span>Show a reminder time</span>
          <input
            type="checkbox"
            className="size-5 accent-sage"
            checked={profile.remindersOn}
            onChange={(event) => update({ remindersOn: event.target.checked })}
          />
        </label>
        {profile.remindersOn ? (
          <input
            type="time"
            value={profile.reminderTime}
            onChange={(event) => update({ reminderTime: event.target.value })}
            className="mt-2 min-h-12 rounded-md border border-line bg-surface-2 px-3"
          />
        ) : null}
        {profile.remindersOn ? <p className="mt-2 text-sm text-sage">Reminder set for {profile.reminderTime}.</p> : null}
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Levels</h2>
        <p className="mt-1 text-sm text-muted">You can move a track down. Moving up still goes through the checklist.</p>
        <div className="mt-3 grid gap-3">
          {TRACKS.map((track) => {
            const current = tracks[track].level;
            const lower = LEVELS.filter((level) => LEVELS.indexOf(level) < LEVELS.indexOf(current));
            return (
              <Panel key={track}>
                <p className="font-medium">{TRACK_LABEL[track]}</p>
                <p className="text-sm text-muted">
                  {LEVEL_LABEL[current]} · {LEVEL_NAME[current]}
                </p>
                {lower.length === 0 ? (
                  <p className="mt-2 text-sm text-muted">Already at Foundation.</p>
                ) : (
                  <div className="mt-3 grid gap-2">
                    {lower.map((level) => (
                      <button
                        key={level}
                        type="button"
                        className={buttonClass("secondary")}
                        onClick={() => setDrop({ track, level })}
                      >
                        Move down to {LEVEL_LABEL[level]}
                      </button>
                    ))}
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="font-medium">Disclaimer</h2>
        <p className="mt-2 text-sm text-muted">
          Sentinel Strength is general fitness coaching, not medical care or physical therapy. Talk to a doctor before you start, especially with an injury, pregnancy, or a restriction you were already given. Stop for sharp pain, dizziness, chest pain, or numbness. Soreness can be normal. Sharp pain is a stop signal. You choose the movements that match your body today.
        </p>
      </section>

      <button type="button" className={`${buttonClass("secondary")} mt-8`} onClick={() => setConfirm(true)}>
        Reset progress on this phone
      </button>
      <p className="mt-3 text-xs text-subtle">Progress stays on this phone. There is no account.</p>

      {confirm ? (
        <div className="scrim fixed inset-0 z-30 flex items-end p-4">
          <div className="mx-auto w-full max-w-xl rounded-xl border border-line bg-surface p-4">
            <h2 className="font-display text-2xl font-medium">Reset everything?</h2>
            <p className="mt-2 text-sm text-muted">Levels, notes, and session history on this phone will be cleared.</p>
            <button type="button" className={`${buttonClass()} mt-4`} onClick={() => resetAll()}>
              Reset
            </button>
            <button type="button" className={`${buttonClass("ghost")} mt-2`} onClick={() => setConfirm(false)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {drop ? (
        <div className="scrim fixed inset-0 z-30 flex items-end p-4">
          <div className="mx-auto w-full max-w-xl rounded-xl border border-line bg-surface p-4">
            <h2 className="font-display text-2xl font-medium">
              Move {TRACK_LABEL[drop.track]} down to {LEVEL_LABEL[drop.level]}?
            </h2>
            <p className="mt-2 text-sm text-muted">You will need to earn the higher level again. The rules do not change.</p>
            <button
              type="button"
              className={`${buttonClass()} mt-4`}
              onClick={() => {
                dropTrack(drop.track, drop.level);
                setDrop(null);
              }}
            >
              Move down
            </button>
            <button type="button" className={`${buttonClass("ghost")} mt-2`} onClick={() => setDrop(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
