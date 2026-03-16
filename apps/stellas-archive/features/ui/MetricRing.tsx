interface MetricRingProps {
  label: string;
  value: number;
  color: string;
  trackColor: string;
  stateLabel: string;
  maxValue?: number;
}

export function MetricRing({ label, value, color, trackColor, stateLabel, maxValue = 100 }: MetricRingProps) {
  const normalized = Math.max(0, Math.min(maxValue, value));
  const roundedValue = Math.round(normalized);
  const size = 68;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (roundedValue / maxValue) * circumference;
  const markerStep = 25;
  const markerColor = roundedValue >= 70 ? "#b0fb9f" : roundedValue >= 40 ? "#ffd58a" : "#ff9e9e";
  const isCritical = roundedValue <= 30;
  const isWarning = roundedValue > 30 && roundedValue <= 55;
  const statusGlow = isCritical
    ? "shadow-[0_0_12px_rgba(255,95,95,0.42)] border-[rgba(255,130,130,0.7)]"
    : isWarning
      ? "bg-[rgba(11,16,28,0.6)] border-[rgba(255,190,86,0.65)]"
      : "bg-[rgba(11,16,28,0.6)] border-[rgba(130,199,255,0.2)]";

  return (
    <div
      className={`flex min-w-0 flex-col items-center gap-1.5 rounded-none bg-[rgba(11,16,28,0.6)] px-2 py-2 transition-[transform,box-shadow] duration-300 ${statusGlow}`}
      role="img"
      aria-label={`${label} ${roundedValue}%`}
    >
      <span className="text-[11px] text-[rgba(183,232,255,0.9)] tracking-[0.3px] uppercase">{label}</span>
      <div className="relative h-16 w-16 shrink-0 transition-transform duration-500">
        <svg className="h-16 w-16 -rotate-90 transform" viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference / 10} ${circumference / 120}`}
            strokeLinecap="round"
            opacity={0.85}
          />
          {Array.from({ length: Math.floor(100 / markerStep) + 1 }).map((_, index) => {
            const percent = index * markerStep;
            const angle = ((percent / 100) * 360 - 90) * (Math.PI / 180);
            const markerRadius = radius + 3;
            const x = size / 2 + markerRadius * Math.cos(angle);
            const y = size / 2 + markerRadius * Math.sin(angle);
            return (
              <circle
                key={percent}
                cx={x}
                cy={y}
                r={1}
                fill="currentColor"
                className="text-[rgba(190,223,255,0.8)]"
              />
            );
          })}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-[stroke-dashoffset] duration-500"
            style={{ transitionProperty: "stroke-dashoffset", transitionDuration: "500ms" }}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <span className="text-[13px] font-semibold text-[#f1f8ff] transition-opacity duration-300">{roundedValue}</span>
          <span className="text-[10px] font-medium tracking-[0.2px]" style={{ color: markerColor }}>
            {stateLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
