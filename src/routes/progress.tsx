import { createFileRoute } from "@tanstack/react-router";
import { ProgressView } from "@/components/progress-view";
import { AppFrame, ClientOnly } from "@/components/shell";

type ProgressSearch = { ready: boolean };

export const Route = createFileRoute("/progress")({
  validateSearch: (search: Record<string, unknown>): ProgressSearch => ({
    ready: search.ready === true || search.ready === "true" || search.ready === 1 || search.ready === "1",
  }),
  component: ProgressRoute,
});

function ProgressRoute() {
  const { ready } = Route.useSearch();
  return (
    <ClientOnly>
      {() => (
        <AppFrame>
          <ProgressView openReady={ready} />
        </AppFrame>
      )}
    </ClientOnly>
  );
}
