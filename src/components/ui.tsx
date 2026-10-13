import type { ReactNode } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function buttonClass(variant: "primary" | "secondary" | "ghost" = "primary", full = true) {
  return cn(
    "press inline-flex min-h-12 items-center justify-center gap-2 rounded-md px-4 text-center text-base font-medium disabled:opacity-40",
    full && "w-full",
    variant === "primary" && "bg-accent text-accent-fg",
    variant === "secondary" && "border border-line bg-surface-2 text-fg",
    variant === "ghost" && "text-fg",
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-line bg-surface p-4", className)}>{children}</section>;
}

export function Kicker({ children }: { children: ReactNode }) {
  return <p className="font-display text-xs font-medium tracking-brand text-muted uppercase">{children}</p>;
}

export function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const safeMax = Math.max(max, 1);
  const pct = Math.max(0, Math.min(100, Math.round((Math.min(value, max) / safeMax) * 100)));
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted">{label}</span>
        <span className="tabular-nums text-fg">
          {Math.min(value, max)}/{max}
        </span>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-surface-2"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div className="h-full bg-sage" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export function Choice({
  selected,
  onClick,
  children,
}: {
  selected?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "press min-h-12 rounded-md border px-3 py-2 text-left font-medium",
        selected ? "border-accent bg-accent text-accent-fg" : "border-line bg-surface-2 text-fg",
      )}
    >
      {children}
    </button>
  );
}
