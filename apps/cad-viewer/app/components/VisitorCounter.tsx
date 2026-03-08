"use client";

type VisitorConnectionState = "connected" | "disconnected" | "unknown";

type VisitorCounterProps = {
  redisConnected: VisitorConnectionState;
  todayVisitors: number | null;
  blueprintChecks: number | null;
};

function formatCount(value: number | null) {
  return value === null ? "-" : value.toLocaleString("en-US");
}

function redisLabel(state: VisitorConnectionState) {
  if (state === "connected") return "Redis connected";
  if (state === "disconnected") return "Redis disconnected";
  return "Redis status unknown";
}

export function VisitorCounter({
  redisConnected,
  todayVisitors,
  blueprintChecks,
}: VisitorCounterProps) {
  const statusClassName =
    redisConnected === "connected"
      ? "bg-[#1ca85e] shadow-[0_0_0_2px_rgba(28,168,94,0.2)] animate-pulse"
      : redisConnected === "disconnected"
        ? "bg-[#e11d48] shadow-[0_0_0_2px_rgba(225,29,72,0.2)]"
        : "bg-[#9ca3af] shadow-[0_0_0_2px_rgba(156,163,175,0.25)]";

  return (
    <div
      className="fixed right-4 bottom-4 z-30 inline-flex items-center justify-start gap-[0.45rem] rounded-full border border-[rgba(103,61,29,0.4)] bg-[linear-gradient(180deg,rgba(255,249,236,0.95),rgba(247,229,198,0.95))] px-[0.65rem] py-[0.45rem] text-[0.72rem] font-bold leading-[1.2] tracking-[0.01em] text-[#3d2a18] shadow-[0_10px_20px_rgba(59,35,17,0.2)] backdrop-blur-[4px] pointer-events-none max-[768px]:right-[0.65rem] max-[768px]:bottom-[0.65rem] max-[768px]:px-[0.55rem] max-[768px]:py-[0.4rem]"
      role="status"
      aria-live="polite"
    >
      <span
        className={`h-[0.62rem] w-[0.62rem] shrink-0 rounded-full border border-[rgba(31,41,55,0.35)] ${statusClassName}`}
        title={redisLabel(redisConnected)}
        aria-hidden="true"
      />
      <div className="flex min-w-[12.5rem] flex-col gap-[0.12rem] pr-2">
        <div className="grid grid-cols-[minmax(0,_1fr)_auto] items-center gap-[0.4rem]">
          <span className="truncate whitespace-nowrap text-left text-[0.72rem] text-[#5b4229]">Today's Visitors</span>
          <strong className="min-w-[1.2rem] text-right text-[0.84rem] font-extrabold text-[#2f1e12] [font-variant-numeric:tabular-nums]">
            {formatCount(todayVisitors)}
          </strong>
        </div>
        <div className="grid grid-cols-[minmax(0,_1fr)_auto] items-center gap-[0.4rem]">
          <span className="truncate whitespace-nowrap text-left text-[0.72rem] text-[#5b4229]">
            Total Blueprint Checks (All-time)
          </span>
          <strong className="min-w-[1.2rem] text-right text-[0.84rem] font-extrabold text-[#2f1e12] [font-variant-numeric:tabular-nums]">
            {formatCount(blueprintChecks)}
          </strong>
        </div>
      </div>
    </div>
  );
}
