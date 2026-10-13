import { Link, useNavigate } from "@tanstack/react-router";
import { ChartNoAxesCombined, House, Library, Settings } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useStore } from "@/lib/store";
import { cn } from "./ui";

export function ClientOnly({ children }: { children: () => ReactNode }) {
  const hydrated = useStore((state) => state.hydrated);
  useEffect(() => {
    let live = true;
    void Promise.resolve(useStore.persist.rehydrate()).finally(() => {
      if (live) useStore.setState({ hydrated: true });
    });
    return () => {
      live = false;
    };
  }, []);
  if (!hydrated) {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg px-6 text-fg">
        <div>
          <p className="font-display text-4xl font-medium tracking-tight">Sentinel</p>
          <p className="text-lg text-muted">Strength</p>
        </div>
      </div>
    );
  }
  return <>{children()}</>;
}

const NAV = [
  { to: "/", label: "Today", icon: House, exact: true },
  { to: "/library", label: "Library", icon: Library, exact: false },
  { to: "/progress", label: "Progress", icon: ChartNoAxesCombined, exact: false },
  { to: "/settings", label: "Settings", icon: Settings, exact: false },
] as const;

export function AppFrame({ children, nav = true }: { children: ReactNode; nav?: boolean }) {
  const onboarded = useStore((state) => state.profile.onboarded);
  const hydrated = useStore((state) => state.hydrated);
  const navigate = useNavigate();
  useEffect(() => {
    if (hydrated && !onboarded) navigate({ to: "/" });
  }, [hydrated, onboarded, navigate]);
  if (!onboarded) return null;
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <div className={cn("mx-auto w-full max-w-xl px-4 pt-6", nav ? "pb-28" : "pb-8")}>{children}</div>
      {nav ? (
        <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface" aria-label="Primary">
          <div className="mx-auto grid max-w-xl grid-cols-4 pb-safe-nav">
            {NAV.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  activeOptions={{ exact: item.exact }}
                  className="flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-subtle"
                  activeProps={{ className: "flex min-h-14 flex-col items-center justify-center gap-1 text-xs text-fg" }}
                >
                  <Icon className="size-5" aria-hidden="true" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
