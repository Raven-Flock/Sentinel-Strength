import { createFileRoute } from "@tanstack/react-router";
import { SettingsView } from "@/components/settings-view";
import { AppFrame, ClientOnly } from "@/components/shell";

export const Route = createFileRoute("/settings")({
  component: SettingsRoute,
});

function SettingsRoute() {
  return (
    <ClientOnly>
      {() => (
        <AppFrame>
          <SettingsView />
        </AppFrame>
      )}
    </ClientOnly>
  );
}
