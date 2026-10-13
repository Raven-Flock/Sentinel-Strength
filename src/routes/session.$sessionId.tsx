import { createFileRoute } from "@tanstack/react-router";
import { Player } from "@/components/player";
import { ClientOnly } from "@/components/shell";

export const Route = createFileRoute("/session/$sessionId")({
  component: SessionRoute,
});

function SessionRoute() {
  const { sessionId } = Route.useParams();
  return <ClientOnly>{() => <Player sessionId={sessionId} />}</ClientOnly>;
}
