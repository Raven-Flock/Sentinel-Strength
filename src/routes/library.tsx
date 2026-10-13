import { createFileRoute } from "@tanstack/react-router";
import { LibraryView } from "@/components/library-view";
import { AppFrame, ClientOnly } from "@/components/shell";

export const Route = createFileRoute("/library")({
  component: LibraryRoute,
});

function LibraryRoute() {
  return (
    <ClientOnly>
      {() => (
        <AppFrame>
          <LibraryView />
        </AppFrame>
      )}
    </ClientOnly>
  );
}
