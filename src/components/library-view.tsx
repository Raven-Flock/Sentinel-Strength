import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { EXERCISES } from "@/data/catalog";
import { FOCUS_LABEL, LEVEL_LABEL, TRACK_LABEL } from "@/data/labels";
import { SESSIONS } from "@/data/sessions";
import type { Focus, LevelId, TrackId } from "@/data/types";
import { LEVELS, TRACKS } from "@/data/types";
import { useStore } from "@/lib/store";
import { resolveSession } from "@/lib/training";
import { Kicker, Panel } from "./ui";

const FOCUSES: Focus[] = ["core", "balance", "landing", "mobility", "hips", "shoulders"];

export function LibraryView() {
  const profile = useStore((state) => state.profile);
  const tracks = useStore((state) => state.tracks);
  const [tab, setTab] = useState<"sessions" | "moves">("sessions");
  const [track, setTrack] = useState<TrackId>(profile.preferredTrack);
  const [level, setLevel] = useState<LevelId | "all">(tracks[profile.preferredTrack].level);
  const [focus, setFocus] = useState<Focus | "all">("all");
  const [recovery, setRecovery] = useState(false);
  const [query, setQuery] = useState("");

  const sessions = useMemo(() => {
    return SESSIONS.filter((session) => {
      if (session.track !== track) return false;
      if (session.bridge) {
        return !recovery && session.level === tracks[track].level && (level === "all" || level === session.level);
      }
      if (recovery) return Boolean(session.deload);
      if (session.deload) return false;
      if (level !== "all" && session.level !== level) return false;
      return true;
    }).sort((a, b) => LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) || a.order - b.order);
  }, [track, level, recovery, tracks]);

  const moves = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((exercise) => {
      if (track === "strength" && !exercise.tracks.includes("strength")) return false;
      if (track === "yoga" && !exercise.tracks.includes("yoga")) return false;
      if (level !== "all" && !exercise.levels.includes(level)) return false;
      if (focus !== "all" && !exercise.focus.includes(focus)) return false;
      if (!q) return true;
      return `${exercise.name} ${exercise.why}`.toLowerCase().includes(q);
    });
  }, [track, level, focus, query]);

  return (
    <div>
      <Kicker>Library</Kicker>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">Sessions and moves</h1>
      <p className="mt-2 text-muted">Combined sessions reuse the strength and yoga moves. Nothing is a second copy.</p>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTab("sessions")}
          className={tab === "sessions" ? "press min-h-12 rounded-md bg-accent font-medium text-accent-fg" : "press min-h-12 rounded-md border border-line bg-surface font-medium"}
        >
          Sessions
        </button>
        <button
          type="button"
          onClick={() => setTab("moves")}
          className={tab === "moves" ? "press min-h-12 rounded-md bg-accent font-medium text-accent-fg" : "press min-h-12 rounded-md border border-line bg-surface font-medium"}
        >
          Moves
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {TRACKS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setTrack(id)}
            className={track === id ? "min-h-10 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg" : "min-h-10 rounded-md border border-line px-3 text-sm"}
          >
            {TRACK_LABEL[id]}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setLevel("all");
            setRecovery(false);
          }}
          className={level === "all" && !recovery ? "min-h-10 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg" : "min-h-10 rounded-md border border-line px-3 text-sm"}
        >
          All levels
        </button>
        {LEVELS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setLevel(id);
              setRecovery(false);
            }}
            className={level === id && !recovery ? "min-h-10 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg" : "min-h-10 rounded-md border border-line px-3 text-sm"}
          >
            {LEVEL_LABEL[id]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setRecovery((value) => !value)}
          className={recovery ? "min-h-10 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg" : "min-h-10 rounded-md border border-line px-3 text-sm"}
        >
          Recovery
        </button>
      </div>

      {tab === "moves" ? (
        <div className="mt-4">
          <label className="text-sm text-muted" htmlFor="move-search">
            Search moves
          </label>
          <input
            id="move-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="mt-2 min-h-12 w-full rounded-md border border-line bg-surface-2 px-3"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <FilterChip selected={focus === "all"} onClick={() => setFocus("all")}>
              Any focus
            </FilterChip>
            {FOCUSES.map((id) => (
              <FilterChip key={id} selected={focus === id} onClick={() => setFocus(id)}>
                {FOCUS_LABEL[id]}
              </FilterChip>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "sessions" ? (
        <div className="mt-5 grid gap-3">
          {sessions.length === 0 ? (
            <p className="text-sm text-muted">Nothing in this filter. Clear it to see the full catalog.</p>
          ) : (
            sessions.map((session) => {
              const user = tracks[session.track];
              const minutes = resolveSession(session, {
                length: profile.sessionLength,
                pain: profile.painAreas,
                stage: user.level === session.level ? user.stage : 1,
              }).minutes;
              const higher = !session.deload && !session.bridge && LEVELS.indexOf(session.level) > LEVELS.indexOf(user.level);
              return (
                <Panel key={session.id}>
                  <p className="text-sm text-muted">
                    {session.deload ? "Recovery" : session.bridge ? "Bridge" : LEVEL_LABEL[session.level]}
                    {session.scaffold ? " · Lean catalog" : ""} · {minutes} min
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-medium">{session.title}</h2>
                  <p className="mt-2 text-sm text-muted">{session.intent}</p>
                  {higher ? (
                    <p className="mt-2 text-sm text-warn">Above your current level. Trying it will not skip the checks.</p>
                  ) : null}
                  <Link to="/session/$sessionId" params={{ sessionId: session.id }} className="mt-3 inline-flex min-h-12 items-center font-medium text-sage">
                    Start
                  </Link>
                </Panel>
              );
            })
          )}
        </div>
      ) : (
        <div className="mt-5 grid gap-3">
          {moves.length === 0 ? (
            <p className="text-sm text-muted">Nothing in this filter. Clear it to see the full catalog.</p>
          ) : (
            moves.map((exercise) => (
              <Link
                key={exercise.id}
                to="/move/$exerciseId"
                params={{ exerciseId: exercise.id }}
                className="rounded-xl border border-line bg-surface p-4"
              >
                <p className="text-sm text-muted">{exercise.equipment}</p>
                <h2 className="mt-1 font-display text-2xl font-medium">{exercise.name}</h2>
                <p className="mt-2 text-sm text-muted">{exercise.why}</p>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={selected ? "min-h-10 rounded-md bg-accent px-3 text-sm font-medium text-accent-fg" : "min-h-10 rounded-md border border-line px-3 text-sm"}
    >
      {children}
    </button>
  );
}
