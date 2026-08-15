import clsx from "clsx";

export function ProgressBar({ value, className }: { value: number; className?: string }) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div className={clsx("h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800", className)}>
      <div
        className={clsx("h-full rounded-full transition-all", clamped >= 100 ? "bg-green-500" : "bg-brand-500")}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
