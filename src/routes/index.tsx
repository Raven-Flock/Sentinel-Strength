import { createFileRoute } from "@tanstack/react-router";
import { Home } from "@/components/home";
import { Onboarding } from "@/components/onboarding";
import { AppFrame, ClientOnly } from "@/components/shell";
import { useStore } from "@/lib/store";

export const Route = createFileRoute("/")({ component: IndexRoute });

function IndexRoute() {
  return <ClientOnly>{() => <IndexInner />}</ClientOnly>;
}

function IndexInner() {
  const onboarded = useStore((state) => state.profile.onboarded);
  if (!onboarded) return <Onboarding />;
  return (
    <AppFrame>
      <Home />
    </AppFrame>
  );
}
