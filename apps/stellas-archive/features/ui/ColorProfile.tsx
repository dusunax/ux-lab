import type { ReactNode } from "react";

type RgbChannel = {
  label: string;
  value: number;
  color: string;
};

type ColorProfileProps = {
  rgb: {
    r: number;
    g: number;
    b: number;
  };
  title?: ReactNode;
  className?: string;
};

function clampByte(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function toHexChannel(value: number): string {
  return clampByte(value).toString(16).toUpperCase().padStart(2, "0");
}

export function ColorProfile({ rgb, title, className }: ColorProfileProps) {
  const channels: RgbChannel[] = [
    { label: "R", value: rgb.r, color: "rgb(255, 123, 123)" },
    { label: "G", value: rgb.g, color: "rgb(121, 233, 140)" },
    { label: "B", value: rgb.b, color: "rgb(108, 184, 255)" },
  ];

  const hex = `#${toHexChannel(rgb.r)}${toHexChannel(rgb.g)}${toHexChannel(rgb.b)}`;

  return (
    <div className={`mt-3 rounded-none border border-[rgba(130,199,255,0.22)] bg-[rgba(11,18,36,0.74)] p-3 ${className || ""}`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[12px] text-[rgba(190,230,255,0.85)]">{title ?? "RGB Profile"}</div>
        <span className="text-[13px] font-semibold tracking-[0.2px] text-[#f0f8ff]">{hex}</span>
      </div>
      <div className="grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
        <div
          className="mx-auto h-12 w-12 rounded-full border border-white/45 shadow-[0_0_14px_rgba(170,230,255,0.35)]"
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.02)), rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`,
          }}
        />
        <div className="grid gap-1.5">
          {channels.map((channel) => {
            const percent = (clampByte(channel.value) / 255) * 100;
            return (
              <div className="flex items-center gap-2" key={channel.label}>
                <span className="w-5 text-right text-[12px] text-[var(--muted)]">{channel.label}</span>
                <div className="relative h-[10px] flex-1 overflow-hidden border border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.12)]">
                  <div
                    className="absolute inset-y-0 left-0 h-full border-r-[2px] border-[rgba(255,255,255,0.4)]"
                    style={{ width: `${percent}%`, background: channel.color }}
                  />
                </div>
                <span className="w-10 text-right text-[12px] text-white">{clampByte(channel.value)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
