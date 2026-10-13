import { createFileRoute, Link } from "@tanstack/react-router";
import { getExercise } from "@/data/catalog";
import { FOCUS_LABEL, LEVEL_LABEL } from "@/data/labels";
import { SESSIONS } from "@/data/sessions";
import { AppFrame, ClientOnly } from "@/components/shell";
import { Kicker } from "@/components/ui";

export const Route = createFileRoute("/move/$exerciseId")({
  component: MoveRoute,
});

function MoveRoute() {
  const { exerciseId } = Route.useParams();
  return <ClientOnly>{() => <MoveInner exerciseId={exerciseId} />}</ClientOnly>;
}

function MoveInner({ exerciseId }: { exerciseId: string }) {
  const exercise = getExercise(exerciseId);
  if (!exercise) {
    return (
      <AppFrame>
        <h1 className="font-display text-3xl font-medium">Move not found</h1>
        <Link to="/library" className="mt-4 inline-flex min-h-12 items-center text-sage">
          Back to the library
        </Link>
      </AppFrame>
    );
  }
  const usedIn = SESSIONS.filter((session) => session.blocks.some((block) => block.exerciseId === exercise.id)).slice(0, 6);
  const work = exercise.defaultHoldSec ? `Hold ${exercise.defaultHoldSec}s` : exercise.defaultReps;
  return (
    <AppFrame>
      <Link to="/library" className="text-sm text-muted">
        Library
      </Link>
      <div className="mt-4">
        <Kicker>{exercise.equipment === "None" ? "No equipment" : exercise.equipment}</Kicker>
      </div>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight">{exercise.name}</h1>
      <p className="mt-3 text-sage">{exercise.why}</p>
      <p className="mt-4 text-sm text-muted">
        {exercise.defaultSets} {exercise.defaultSets === 1 ? "set" : "sets"} · {work} · Rest {exercise.defaultRestSec}s
      </p>
      <p className="mt-2 text-sm text-muted">
        {exercise.levels.map((level) => LEVEL_LABEL[level]).join(", ")} · {exercise.focus.map((item) => FOCUS_LABEL[item]).join(", ")}
      </p>
      {exercise.prerequisite ? <p className="mt-4 text-sm text-warn">Prerequisite: {exercise.prerequisite}</p> : null}
      <section className="mt-6">
        <h2 className="font-medium">Setup</h2>
        <p className="mt-1">{exercise.setup}</p>
      </section>
      <section className="mt-5">
        <h2 className="font-medium">Instructions</h2>
        <p className="mt-1">{exercise.instructions}</p>
      </section>
      <section className="mt-5">
        <h2 className="font-medium">Cues</h2>
        <ul className="mt-2 list-disc pl-5">
          {exercise.cues.map((cue) => (
            <li key={cue}>{cue}</li>
          ))}
        </ul>
      </section>
      <section className="mt-5">
        <h2 className="font-medium">Common mistakes</h2>
        <ul className="mt-2 list-disc pl-5 text-muted">
          {exercise.mistakes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="mt-5">
        <h2 className="font-medium">Modifications</h2>
        <ul className="mt-2 list-disc pl-5">
          {exercise.modifications.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <section className="mt-5">
        <h2 className="font-medium">Progressions</h2>
        <ul className="mt-2 list-disc pl-5">
          {exercise.progressions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      {usedIn.length > 0 ? (
        <section className="mt-6">
          <h2 className="font-medium">Shows up in</h2>
          <ul className="mt-2 grid gap-2">
            {usedIn.map((session) => (
              <li key={session.id}>
                <Link to="/session/$sessionId" params={{ sessionId: session.id }} className="text-sage">
                  {session.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </AppFrame>
  );
}
